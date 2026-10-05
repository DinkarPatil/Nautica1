# Backend Explaining Document

> The end-of-build narrative covering what was built, how it's organized, and how it behaves in production.

---

## 1. What the backend is

`backend/` is a **modular FastAPI monolith** that powers the GlimmoraNautica frontend. It owns:

- Authentication and user state (JWT + cookie fallback).
- Reference data: vessels, ports, alerts, trade documents, AGI decisions.
- The voyage tree (CRUD + live snapshot + AI brief + cause attribution + milestones + report + chat + SSE).
- Dashboard aggregations.
- Vertex AI (Gemini) for every reasoning surface.
- Real adapter integrations: OpenSanctions (sanctions screening) and Open-Meteo (weather influencing live snapshot risk).
- Audit + AI-call telemetry.

It's intentionally a single ASGI app — modular by package, not by service.

## 2. Stack

| Concern | Pick |
|---|---|
| Web | FastAPI 0.135 |
| ORM | SQLAlchemy 2.x async |
| DB | SQLite (dev) / Postgres (prod) — chosen via `DATABASE_URL` |
| Migrations | Alembic |
| Auth | python-jose + passlib (bcrypt) |
| HTTP client | httpx (async) |
| Streaming | sse-starlette |
| AI | google-genai (Vertex Gemini, structured JSON mode) |
| Tests | pytest + pytest-asyncio |
| E2E | Playwright (TypeScript) |

## 3. Folder map

```
backend/
  app/
    main.py                  app factory + lifespan
    config.py                Pydantic settings, fail-fast validation
    db.py                    async engine + session helpers
    deps.py                  current_user, role guards
    errors.py                error envelope + handlers
    logging_setup.py         JSON logs
    domains/
      auth/                  models, schemas, JWT, password, routes
      fleet/                 vessels
      ports/                 ports + congestion + autocomplete
      risk/                  alerts + sanctions screen + regions
      trade/                 trade documents
      agi/                   decisions + run-analysis + prompts/
      voyage/                CRUD + live + brief + attribution + chat + report + stream + prompts/
      dashboard/             aggregator only
      meta/                  /api/health, /api/version
    services/
      llm/                   provider protocol, stub, vertex, registry
      adapters/              opensanctions, open_meteo
      audit/                 audit_log model + writer
    seed/
      seed_runner.py         idempotent loader
      data/                  JSON fixtures (vessels, ports, alerts, trades, agi, ships, …)
  tests/
    unit/
    integration/
    e2e/  -> ../e2e (Playwright lives one level up under repo root)
```

## 4. Module-by-module

### auth
Mirrors the frontend's role list (`ai_core, executive, fleet_ops, trade_intel, risk_intel, port_ops`). Issues a JWT pair on login (30-min access, 7-day refresh). Accepts the existing `glimmora_session` cookie as a fallback so the frontend doesn't have to refactor everything at once. Permission map is in [permissions.py](../backend/app/domains/auth/permissions.py) and is a 1:1 mirror of [frontend/app/lib/permissions.ts](../frontend/app/lib/permissions.ts).

### fleet
100 vessels, sortable + filterable + searchable. The shape exactly matches the frontend's `Vessel` type. Route-optimize is a heuristic (one-degree south + 3.6% fuel + −45m ETA) suitable for the MVP UI.

### ports
20 main ports + 25 in the autocomplete directory + 7 days of congestion history. Note: the voyage flow uses `lat/lon` (not `lng`), so the `ports_directory` table mirrors that shape.

### risk
- `alerts` — 15 seed records + create endpoint (gated).
- `regions` — 10 risk regions for the geopolitical map.
- `sanctions_screen` — calls OpenSanctions match endpoint via [services/adapters/opensanctions.py](../backend/app/services/adapters/opensanctions.py); on offline / 4xx it returns `source: "offline"` + empty hits without crashing. A Vertex/stub call generates a one-line `explanation`.

### trade
10 trade documents. `POST /approve` is gated to `APPROVE` permission only, audited, and conflicts on a second approval (409).

### agi
20 seeded decisions + a `POST /api/agi/analyze` that pulls the current fleet/ports/alerts state, renders the [fleet_analysis.v1.md](../backend/app/domains/agi/prompts/fleet_analysis.v1.md) prompt, calls Vertex Pro (or stub), schema-validates, and persists.

### voyage
The crown jewel. Eight pieces:

1. **CRUD** — list, detail, create. The seed inserts demo voyage `v_001` with full event/eta/milestone history.
2. **Live snapshot** ([live.py](../backend/app/domains/voyage/live.py)) — deterministic synthesis from planned route + elapsed time + Open-Meteo wind. Uses haversine distances + course bearing + a stable-per-voyage random offset so subsequent calls drift naturally without an AIS feed.
3. **AI Brief** ([brief.py](../backend/app/domains/voyage/brief.py)) — pulls live snapshot, recent events, and weather; calls [voyage_brief.v1.md](../backend/app/domains/voyage/prompts/voyage_brief.v1.md) prompt against Gemini 2.5-flash; schema-validates against `AIBrief` exactly as the frontend expects; persists in `voyage_briefs` for audit.
4. **Cause attribution** ([attribution.py](../backend/app/domains/voyage/attribution.py)) — pure logic computes weights from positive ETA-delta minutes by cause; AI augments each factor with a one-sentence note. Always sums to 100.
5. **Milestones** — seeded for the demo voyage; for new voyages we seed dep + arrival.
6. **Report** ([report.py](../backend/app/domains/voyage/report.py)) — assembles voyage + live + events + alerts + eta + attribution + milestones + a Gemini Pro `aiConclusion`.
7. **Chat** ([chat.py](../backend/app/domains/voyage/chat.py)) — Q&A grounded in voyage state via [voyage_chat.v1.md](../backend/app/domains/voyage/prompts/voyage_chat.v1.md).
8. **Stream** ([stream.py](../backend/app/domains/voyage/stream.py)) — SSE endpoint emitting `{ kind: "snapshot"|"event"|"alert"|"brief", payload }` every 30s, compatible with the existing `voyageStore.applyStream()` consumer in the frontend.

### dashboard
Aggregator. Reads from the same DB and computes:
- KPIs (vessels by status, alert counts, average congestion).
- Risk snapshot (counts by severity + top 5 alerts).
- AGI feed (most recent 8 decisions).

### meta
Just `/api/health` (probes DB + provider) and `/api/version`.

## 5. Data flow

```
Browser ──POST /api/auth/login──▶ FastAPI
                          │
                          ├─ verify password (bcrypt)
                          ├─ mint JWT pair
                          └─ insert auth_event
Browser ◀──{access, refresh, user}──

Browser ──Authorization: Bearer──▶ /api/voyages/v_001/brief
                          │
                          ├─ current_user dependency
                          ├─ get_voyage() ──▶ DB
                          ├─ compute_live_snapshot() ──▶ Open-Meteo
                          ├─ render voyage_brief.v1.md
                          ├─ Vertex Gemini 2.5-flash (JSON mode)
                          ├─ schema-validate
                          ├─ persist voyage_briefs row
                          ├─ insert ai_calls row
                          └─ return AIBrief + _meta
Browser ◀──{whatIsHappening, recommendation, riskBand, ...}──
```

## 6. AI usage

| Module | Prompt | Model | Why |
|---|---|---|---|
| Voyage brief | `voyage_brief.v1` | `gemini-2.5-flash` | Per-voyage on read, low latency, structured JSON |
| Voyage cause-attribution notes | `attribution_notes.v1` | `gemini-2.5-flash` | Same |
| Voyage report conclusion | `voyage_conclusion.v1` | `gemini-2.5-pro` (env: `GEMINI_MODEL_PRO`) | One call per finished voyage; quality > latency |
| Voyage analysis insight | `voyage_insight.v1` | `gemini-2.5-flash` | Single paragraph, fast |
| Voyage chat | `voyage_chat.v1` | `gemini-2.5-flash` | Realtime Q&A |
| AGI analyze | `fleet_analysis.v1` | `gemini-2.5-pro` | Whole-fleet reasoning |
| Sanctions explanation | `sanctions_explain.v1` (inline) | `gemini-2.5-flash` | One sentence |
| Voyage assistant preview | `voyage_assistant_preview.v1` (inline) | `gemini-2.5-flash` | Draft consistency check |

Every AI call:
1. Goes through [services/llm/registry.py:call_llm](../backend/app/services/llm/registry.py).
2. Is tagged `[[prompt:<name>.<version>]]` so the stub can branch deterministically.
3. Gets a `_meta` envelope on the way out: model, prompt version, generated timestamp, provider, error code (if any).
4. Writes an `ai_calls` row regardless of success/failure.

`AI_PROVIDER` resolution:
- `auto` → vertex if `GCP_SERVICE_ACCOUNT_JSON_B64` is present, else `stub`.
- `vertex` → fail-fast at startup if creds missing.
- `stub` → deterministic, no network.

## 7. External APIs

| Adapter | Real API | Behavior on failure |
|---|---|---|
| OpenSanctions | `POST https://api.opensanctions.org/match/sanctions` | returns `{ hits: [], source: "offline" }` |
| Open-Meteo | `GET https://api.open-meteo.com/v1/forecast` | returns wind=0, source="offline" |

Both adapters are isolated under [services/adapters/](../backend/app/services/adapters/), have explicit timeouts, and never raise. The risk service / live snapshot keep functioning when egress is blocked (typical of sandbox dev environments).

## 8. State and freshness

| Surface | Cache | Freshness signal |
|---|---|---|
| Live snapshot | `voyage_live_state` table, refreshed on each read | `asOf` field |
| AI brief | `voyage_briefs` table, last row | `_meta.generatedAt` |
| Sanctions screen | `sanctions_screens` row per query | `generated_at` |
| Dashboard KPIs | none | computed each read |

Stale-state strategy: each AI payload carries `_meta.generatedAt`; the frontend can mark "stale" when the value is > 5 min old. Live snapshots are always recomputed (so they're never stale, but they do drift naturally).

## 9. Auth / authz

- JWT bearer via `Authorization: Bearer ...` is the source of truth.
- `glimmora_session` cookie (the existing frontend AuthContext sets it) is accepted as fallback so server-rendered pages can authenticate without changes.
- `current_user` dependency loads the user record by id.
- `require_permission` / `require_any_permission` enforce the role-permission map mirrored from the frontend.
- Every gated endpoint has integration tests for both allowed and forbidden roles (e.g., `test_alerts_create_forbidden_for_port_ops`, `test_trade_approve_forbidden_for_fleet_ops`, `test_agi_analyze_forbidden_for_trade_intel`).

## 10. Errors

Single envelope:
```json
{ "error": { "code": "validation_error", "message": "...", "detail": [...] } }
```

Codes used: `validation_error, unauthorized, forbidden, not_found, conflict, provider_error, internal`. Every domain raises `APIError(code, message, status_code)`; the global handler converts to JSON.

## 11. Audit & telemetry

Two persistent log tables:
- `audit_log` — every mutating endpoint (alert.create, trade.create, trade.approve, agi.execute, agi.analyze, voyage.create, voyage_alert.ack).
- `ai_calls` — every Vertex/stub call with prompt name + version, model, latency, token counts, error code.
- `auth_events` — every login attempt success/fail, plus refresh + logout.

JSON logs go to stdout via [logging_setup.py](../backend/app/logging_setup.py).

## 12. Testing approach

- **Unit (19 tests):** schema math, JWT, password, permissions, attribution, live snapshot, stub provider.
- **Integration (57 tests):** every domain endpoint via FastAPI ASGI client, with `AI_PROVIDER=stub` and a per-test seeded SQLite DB.
- **E2E (15 tests):** Playwright runs through real Next.js UI + real FastAPI backend on the loopback. Tests cover login, dashboard, voyage live (rendered + endpoint), voyage create (rendered + endpoint), voyage report (rendered + endpoint), and a backend smoke set.
- **Optional:** `tests/integration/test_vertex_live.py` is gated on `VERTEX_LIVE=1` and exercises the real Vertex provider.

Total: **91 / 91 passing**.

## 13. Deployment

`Dockerfile` is single-stage Python 3.11 slim. Same image for local + Render + DigitalOcean. The lifespan validates env, runs `create_all` (or, in prod, Alembic migrations have run), seeds idempotently, and starts.

Health: `GET /api/health` returns `{ status, db, ai_provider, model, version }`.

## 14. Assumptions and limitations

- **No real AIS feed.** Live snapshot is deterministic synthesis. Adapter swap-in is a Phase-2 task; the contract doesn't change.
- **Single-tenant.** No org/tenant scoping. The `users.organization` field is reserved.
- **Demo passwords are all `demo`.** Trivial to swap during seed by editing the seed runner.
- **No PDF generation.** The report page prints the HTML.
- **Blockchain writes not implemented.** Trade documents store hashes as opaque strings. The UI link "View on Explorer" is a stub.
- **Pagination is supported on fleet/ports/etc., but the frontend lists currently render in-memory** — not a backend gap, just an integration detail to ship.
- **Sanctions screening uses OpenSanctions free tier**, which has rate limits and may degrade in sandboxed environments. The adapter handles both gracefully.
- **No SSE consumer wired in the frontend yet.** The endpoint and the `voyageStore.applyStream` consumer both exist; they need a one-line `EventSource` connector.

## 15. Definition of done — verified

- [x] Frontend understood first ([PHASE_1_FRONTEND_UNDERSTANDING.md](PHASE_1_FRONTEND_UNDERSTANDING.md))
- [x] Frontend documented ([PHASE_1_…](PHASE_1_FRONTEND_UNDERSTANDING.md), [PHASE_2_…](PHASE_2_FRONTEND_BACKEND_MAPPING.md), [FRONTEND_QA_WALKTHROUGH.md](FRONTEND_QA_WALKTHROUGH.md))
- [x] Backend mapped ([PHASE_2_FRONTEND_BACKEND_MAPPING.md](PHASE_2_FRONTEND_BACKEND_MAPPING.md))
- [x] Backend built (every module has routes/services/schemas/tests)
- [x] Live APIs wired (OpenSanctions, Open-Meteo through adapters)
- [x] AI wired (Vertex Gemini primary; stub fallback; structured JSON; all calls logged)
- [x] Tests passing (91/91)
- [x] Playwright passing (15/15)
- [x] Docs written (this file + 6 others)
- [x] Deployment-ready (single ASGI app, env-driven config, idempotent seed)
- [x] Backend explainer complete (this document)
