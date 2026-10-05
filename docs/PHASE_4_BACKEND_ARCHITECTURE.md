# Phase 4 — Backend Architecture

> Modular monolith. FastAPI + SQLAlchemy 2.x async + Alembic + SQLite (dev) / Postgres (prod).
> Vertex AI for all reasoning. SSE for live updates. JWT bearer auth.

---

## 1. Layout

```
backend/
  app/
    main.py                    # FastAPI app factory, route registration, startup hooks
    config.py                  # Pydantic Settings; reads .env
    deps.py                    # FastAPI dependencies (db, current_user, role guards)
    db.py                      # async engine + session
    logging_setup.py           # JSON logging
    errors.py                  # Error envelopes + handlers
    sse.py                     # Tiny SSE helper

    domains/
      auth/
        models.py              # User, AuthEvent
        schemas.py             # Pydantic IO
        service.py             # login/refresh/me logic
        routes.py              # /api/auth/*
        password.py            # bcrypt helpers
        jwt.py                 # encode/decode access+refresh

      fleet/
        models.py              # Vessel
        schemas.py
        service.py
        routes.py

      ports/
        models.py              # Port, CongestionPoint
        schemas.py
        service.py
        routes.py

      risk/
        models.py              # Alert, RiskRegion, SanctionsScreen
        schemas.py
        service.py
        routes.py

      trade/
        models.py              # TradeDocument
        schemas.py
        service.py
        routes.py

      agi/
        models.py              # AGIDecision, AGIRun
        schemas.py
        service.py
        routes.py
        prompts/
          fleet_analysis.v1.md

      voyage/
        models.py              # Voyage, VoyageEvent, VoyageAlert,
                               # ETASnapshot, AIBrief, CauseAttribution, Milestone
        schemas.py             # Pydantic mirroring frontend types/voyage.ts
        service.py             # CRUD, derived computations
        live.py                # Live-snapshot synthesis (deterministic + weather)
        brief.py               # AI brief generator
        attribution.py         # Cause attribution
        report.py              # Final report assembler
        chat.py                # Voyage Q&A
        stream.py              # SSE generator
        routes.py
        prompts/
          voyage_brief.v1.md
          voyage_insight.v1.md
          voyage_chat.v1.md
          voyage_conclusion.v1.md
          attribution_notes.v1.md

      dashboard/
        service.py             # Aggregator only — no models
        routes.py

      meta/
        routes.py              # /api/health, /api/version

    services/
      llm/
        provider.py            # AIProvider protocol
        vertex.py              # Vertex Gemini client
        stub.py                # Deterministic provider for tests
        registry.py            # prompt loader + version stamping
        envelope.py            # _meta builder

      adapters/
        opensanctions.py       # POST match endpoint
        open_meteo.py          # weather adapter
        port_directory.py      # local seed; pluggable to GeoNames later
        ship_directory.py      # local seed; pluggable to IHS later

      audit/
        log.py                 # write to audit_log table

    seed/
      seed_runner.py
      data/
        vessels.json           # 100 (mirrors frontend)
        ports.json             # 20 (mirrors frontend)
        alerts.json            # 15
        trades.json            # 10
        agi_decisions.json     # 20
        risk_regions.json      # 10
        users.json             # 6 demo users
        ships.json             # ship-lookup seed
        port_search.json       # extended port list for autocomplete

  alembic/
    versions/
    env.py
    script.py.mako

  tests/
    unit/
      test_jwt.py
      test_voyage_live.py
      test_attribution.py
      test_llm_envelope.py
      test_sanctions_match.py
      test_dashboard_aggregator.py
    integration/
      conftest.py              # spins async client, in-memory SQLite, AI_PROVIDER=stub
      test_auth_flow.py
      test_fleet.py
      test_ports.py
      test_risk.py
      test_trade.py
      test_agi.py
      test_voyage_crud.py
      test_voyage_live.py
      test_voyage_brief.py
      test_voyage_report.py
      test_dashboard.py
      test_stream.py
    e2e/
      playwright.config.ts
      tests/
        auth.spec.ts
        dashboard.spec.ts
        fleet.spec.ts
        ports.spec.ts
        risk.spec.ts
        trade.spec.ts
        agi.spec.ts
        voyage_create.spec.ts
        voyage_live.spec.ts
        voyage_report.spec.ts

  scripts/
    dev.sh                     # uvicorn --reload + seed
    seed.py                    # one-shot seed
    smoke.py                   # quick contract smoke

  pyproject.toml
  alembic.ini
  Dockerfile                   # production-safe, single stage
  .dockerignore
```

## 2. Stack Choices

| Concern | Choice | Why |
|---|---|---|
| Web | FastAPI | Async-native, OpenAPI free, fits Pydantic schemas |
| ORM | SQLAlchemy 2.x async | Production-grade, asyncpg + aiosqlite |
| Migrations | Alembic | Standard pair |
| Validation | Pydantic v2 | Already what FastAPI uses; perf is fine |
| Auth | python-jose + passlib (bcrypt) | Battle-tested |
| AI | google-cloud-aiplatform (Vertex SDK) | Required by env; supports JSON-mode |
| HTTP client | httpx (async) | One client across adapters |
| SSE | starlette `EventSourceResponse` (sse-starlette) | Minimal |
| Testing | pytest + pytest-asyncio + httpx test client | Standard |
| E2E | Playwright (TypeScript) | Tests through real Next.js UI |
| Logging | python-json-logger | Structured logs ready for any platform |

## 3. Cross-cutting Patterns

### 3.1 Config

Pydantic `BaseSettings` in `app/config.py` reads the existing `.env`. Required at startup:
- `JWT_SECRET` (≥32 chars; fails fast)
- `DATABASE_URL`
- `AI_PROVIDER` (`auto|stub|vertex`)
- `GCP_SERVICE_ACCOUNT_JSON_B64` (required if provider = vertex; for `auto`, decodes to choose)
- `GCP_LOCATION`, `GEMINI_MODEL`, `GEMINI_MODEL_PRO`
- `LLM_MAX_RETRIES`, `LLM_INITIAL_BACKOFF`, `LLM_REQUEST_TIMEOUT_S`

Failure modes:
- Missing JWT_SECRET → exit 2.
- `vertex` selected but creds missing → exit 2.
- DB unreachable → exit 3.

### 3.2 Auth & Permissions

- Login → bcrypt verify → mint JWT pair.
- Access JWT contains `{ sub, role, iat, exp }`.
- `Authorization: Bearer ...` is the source of truth; cookie `glimmora_session` accepted as compatibility.
- `current_user` dependency loads user; role guards live in `deps.py` (`require_role(*roles)`).
- Permissions map mirrors `frontend/app/lib/permissions.ts` exactly. Endpoint guards are derived per the Phase 1 audit.

### 3.3 Errors

Single envelope:
```json
{ "error": { "code": "string", "message": "string", "detail": null|object|array } }
```
Codes used:
- `validation_error` (422)
- `unauthorized` (401), `forbidden` (403)
- `not_found` (404)
- `conflict` (409)
- `provider_error` (502) — AI/external adapter failed
- `internal` (500)

### 3.4 AI Provider

`AIProvider` protocol exposes `generate_json(prompt: str, schema: dict, model: str|None) -> ProviderResult`.
- `vertex.py` uses `aiplatform.gapic.PredictionServiceClient` via `google-cloud-aiplatform[generative]`. JSON mode where supported; otherwise we wrap with explicit "respond ONLY with JSON" preamble + repair loop.
- `stub.py` keys on prompt template id and returns canned valid payloads. Deterministic.
- All calls go through `services/llm/registry.py` which loads prompts by `name + version`, attaches `_meta`, and writes an `ai_calls` row.

### 3.5 SSE

`/api/voyages/{id}/stream` returns text/event-stream. Server emits messages every 30 s for the snapshot, plus events/alerts/brief as they happen (in MVP, simulated by a per-voyage tick task that updates the live snapshot deterministically). Frontend `applyStream` consumes `{ kind, payload }`.

### 3.6 Audit & Telemetry

Three persistent log tables:
- `auth_events` — login successes/failures, refreshes, logouts.
- `ai_calls` — every Vertex call: prompt name + version, model, request hash, latency ms, prompt tokens, completion tokens, success/error code.
- `audit_log` — alert created, document approved, decision executed, voyage created, alert acknowledged.

All structured into JSON logs as well via `logging_setup.py`.

### 3.7 Caching

In-memory TTL cache (functools-style) for:
- Live snapshot per voyage (60 s)
- AI brief per voyage (300 s)
- Dashboard KPIs (15 s)
- OpenSanctions screen results (300 s, keyed on query)
- Open-Meteo responses (600 s per coordinate bucket)

## 4. Data Model (SQL)

Below is the conceptual schema. Field types are SQLite-compatible (TEXT, INTEGER, REAL); migration to Postgres uses native types via Alembic.

### 4.1 Users / Auth
```
users(id pk, email unique, password_hash, name, role, organization, avatar, created_at, last_login_at)
auth_events(id pk, user_id?, email, action, success, ip, user_agent, ts)
```

### 4.2 Fleet
```
vessels(id pk, name, imo, flag, flag_emoji, type, lat, lng, speed, heading,
        status, risk_score, port_of_origin, port_of_destination, eta,
        cargo, dwt, draught, agi_recommendation, updated_at)
```

### 4.3 Ports
```
ports(id pk, name, country, country_code, unlocode unique, lat, lng,
      congestion_pct, queue_count, avg_wait_hours, throughput_teu, status, region)
congestion_points(id pk, date, global_pct, pacific_pct, atlantic_pct)
```

### 4.4 Risk
```
alerts(id pk, type, severity, title, description, location?, vessel_id?, ts, is_read)
risk_regions(id pk, name, lat, lng, level, summary)
sanctions_screens(id pk, query, type, matched, hits_json, explanation, model, prompt_version, generated_at, source)
```

### 4.5 Trade
```
trade_documents(id pk, type, title, vessel_name, shipper, consignee,
                port_of_loading, port_of_discharge, commodity, value, currency,
                status, issued_date, expiry_date?,
                smart_contract_hash?, blockchain_network?,
                approved_by?, approved_at?)
```

### 4.6 AGI
```
agi_runs(id pk, kind, status, created_at, finished_at?, model, prompt_version, summary)
agi_decisions(id pk, run_id?, category, title, summary, reasoning, confidence,
              priority, affected_vessels_json, affected_ports_json,
              estimated_saving?, ts, is_actioned, actioned_at?, actioned_by?)
```

### 4.7 Voyage
```
voyages(id pk, ship_id, origin_port_id, destination_port_id,
        planned_departure, planned_arrival?, actual_departure?, actual_arrival?,
        status, phase, sensitivity, tracking_mode, alert_preference,
        cargo_priority?, delay_tolerance_min?, preferred_route?,
        watchlist_company?, notes?, route_planned_json,
        created_at, updated_at)
ships(id pk, name, imo unique?, type, flag?)
voyage_events(id pk, voyage_id fk, category, severity, ts, title, detail?, position_json?, meta_json?)
voyage_alerts(id pk, voyage_id fk, category, severity, title, detail,
              raised_at, resolved_at?, acknowledged, acknowledged_at?, acknowledged_by?)
voyage_eta_snapshots(id pk, voyage_id fk, ts, eta, confidence, delta_min_from_prev, cause?)
voyage_briefs(id pk, voyage_id fk, generated_at, json_payload, model, prompt_version)
voyage_attributions(id pk, voyage_id fk, generated_at, factors_json)
voyage_milestones(id pk, voyage_id fk, key, name, planned_ts, actual_ts?, projected_ts?, delta_min?)
voyage_live_state(voyage_id pk fk, json_payload, updated_at)   # cached compute
```

### 4.8 Audit & AI
```
audit_log(id pk, actor_user_id?, action, entity_type, entity_id, before_json?, after_json?, ts, ip)
ai_calls(id pk, prompt_name, prompt_version, model, request_hash,
         latency_ms, prompt_tokens?, completion_tokens?,
         status, error_code?, raw_response_json?, parsed_json?, ts)
```

## 5. Module Contracts

Each domain module exposes:
- **Routes** matching the Phase 2 mapping.
- **Services** that take Pydantic schemas in/out (no SQLAlchemy types crossing the boundary).
- **Models** scoped to that domain (no cross-domain imports of models).
- **Tests** in `tests/unit/<domain>` and `tests/integration/<domain>`.

Cross-domain reads happen via service functions, not by sharing models.

## 6. Startup Sequence

`main.py` lifespan:
1. Validate config (fail fast).
2. Open DB, run lightweight `create_all` against the metadata; for prod, Alembic upgrades have already run before boot.
3. Run `seed_runner.run_idempotent(db)` — inserts demo users + reference data only if tables are empty.
4. Initialize LLM provider (vertex or stub).
5. Start the per-voyage SSE tick task supervisor.
6. Mount routers.

## 7. Deployment

- Single FastAPI ASGI app behind uvicorn.
- Container: python:3.11-slim, copy `app/`, run `uvicorn app.main:app --host 0.0.0.0 --port $APP_PORT`.
- Same image for local + Render + DO.
- Health endpoint `/api/health` returns `{ status, db, ai_provider, model, version }`.

## 8. Frontend Wiring

Frontend currently imports `voyageApi` (mocked). We add a single env-driven client:

- New file: `frontend/lib/voyage/voyageApiClient.ts` — same surface as the mocked one, but `fetch`-based against `NEXT_PUBLIC_API_BASE`.
- Existing `voyageApi.ts` is kept as a fallback when `NEXT_PUBLIC_USE_MOCK=1`.
- All other pages get a shared `frontend/lib/api/client.ts` and per-domain wrappers (`fleetApi`, `portsApi`, etc.) introduced incrementally.

Frontend changes are kept minimal and additive — the existing UI rendering does not change.

## 9. Modules Order of Implementation

1. Foundation: `config`, `db`, `errors`, `logging`, `main`, `meta`, `seed_runner`.
2. `auth` (everything else needs `current_user`).
3. Reference data: `fleet`, `ports`, seed.
4. `risk` (alerts + regions + sanctions adapter).
5. `trade`.
6. `agi` (Vertex client + prompt registry first).
7. `voyage` (CRUD + types + create form contract).
8. `voyage` derived: live snapshot, ETA series, attribution, milestones, brief, report, chat, SSE.
9. `dashboard` aggregator.
10. Frontend wiring + Playwright.

Each module passes unit + integration before the next begins.

## 10. Definition of Done per module

- Routes return correct shape, validated against the Pydantic schema.
- Persistence (if any) confirmed via integration tests.
- AI calls (if any) validated in stub mode + smoke-tested in vertex mode.
- Errors return the standard envelope.
- Audit/ai_call rows written where applicable.
- Frontend rendering verified in Playwright (or via integration test for non-UI endpoints).
