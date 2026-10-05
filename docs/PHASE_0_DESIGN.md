# Phase 0 — Design Pass

> Reasoning-first design plan, before any backend code is written.
> Output of Phase 0 of the production-grade MVP workflow for **GlimmoraNautica**.

---

## 1. Core Product Purpose

**One sentence:** GlimmoraNautica turns the live state of a fleet (and individual voyages) into *decisions* — what to do, why, with how much confidence, and what changes if you ignore it.

The frontend hammers this home: dashboards, vessel tables, alerts, and AGI cards all converge on a recommendation surface. The voyage flow (`/voyage/{id}` → `/analysis` → `/report`) is a fully-fledged decision-cycle: plan → live monitor → post-mortem.

**Therefore the backend's primary job is:**
1. Hold the truth about voyages, vessels, ports, alerts.
2. Compute derived intelligence (ETA, risk score, attribution).
3. Produce structured AI explanations (the AGI brief, the AGI decision cards, the report's `aiConclusion`).
4. Stream changes so the live page actually feels live.

Everything else is plumbing.

## 2. Primary Persona

There are 6 frontend roles, but only **two real personas** for the MVP:

| Persona | Role(s) | What they do all day |
|---|---|---|
| **Operations Commander** | `executive`, `fleet_ops`, `ai_core` | Watches the fleet, opens voyages that are slipping, decides whether to reroute, escalate, or wait. Lives on `/dashboard` and `/voyage/{id}`. |
| **Specialist Analyst** | `risk_intel`, `trade_intel`, `port_ops` | Drills into a slice — sanctions screening, trade docs, port congestion. Lives on `/risk`, `/trade`, `/ports`. |

The MVP target is **Operations Commander**. Specialist views must work, but the high-value path is: *I see a voyage in trouble → I open it → the AI tells me what's happening, why, and what to do → I act or acknowledge*.

## 3. Main User Intent

> *"Tell me which voyages need my attention right now, why, and what action to take."*

Every page must serve some slice of this intent or it is bloat.

## 4. Most Valuable Outputs (ranked)

1. **AI brief on a live voyage** — `whatIsHappening`, `whatChanged`, `whyETAMoved`, `recommendation`. This is the killer feature. ([components/voyage/ai/AIBriefCard.tsx](../frontend/components/voyage/ai/AIBriefCard.tsx))
2. **Live voyage snapshot** — position, ETA, ETA delta, risk score, phase. The number that triggers everything else. (`/api/voyages/{id}/live`)
3. **Cause attribution** — why the ETA moved, broken into weighted factors. ([components/voyage/analysis/CauseAttributionCard.tsx](../frontend/components/voyage/analysis/CauseAttributionCard.tsx))
4. **Alerts with acknowledgement** — surfaces what changed and lets the user dismiss noise.
5. **Voyage report** — final summary with AI conclusion, signed off.
6. **AGI decisions feed** — fleet-wide recommendations on `/agi`.
7. **Sanctions screening result** — a one-shot "is this entity flagged?" answer.
8. **Fleet KPIs / map** — situational awareness; lower per-call value but always visible.

## 5. Minimum Viable Flow

```
Login → Dashboard → see a slipping voyage in the AGI feed/risk banner
  → click into /voyage/{id}
  → see live snapshot, AI brief, alerts
  → acknowledge an alert OR /analysis OR /report
  → optionally start a new voyage from /voyage/new
```

This is what Playwright must verify end-to-end.

## 6. Essential vs Optional

| Essential (MVP) | Optional (later) |
|---|---|
| Auth (real JWT, not localStorage) | Multi-tenant orgs |
| Voyage CRUD + live snapshot | WebSocket streaming (poll first; SSE upgrade) |
| Voyage AI brief (Vertex Gemini) | Tool-using agent / chat composer |
| Cause attribution | ML-trained risk model |
| Alerts + acknowledge | Push notifications |
| ETA series | Historical ETA accuracy tracking |
| Voyage report (with AI conclusion) | PDF export |
| Sanctions screen via OpenSanctions | Custom-trained sanctions matcher |
| Port search (live geocoding) | Live AIS feed (AISstream WS) |
| Ship lookup (live) | Multi-list aggregation |
| Fleet/Ports/Trade/Risk read endpoints | Trade doc upload + blockchain write |
| AGI decisions list (Vertex) | Bulk-execute, feedback loop |
| KPIs (computed) | Real-time recharts |

The MVP must do every Essential row truthfully. Optionals are stubbed but not faked.

## 7. What Creates Real Value vs What Is Bloat

**Real value (keep):**
- AI explanations grounded in actual numbers (ETA delta, risk score, attribution weights). The AI's job is to translate numbers into a sentence a human can act on.
- Acknowledgement state that persists. The user must trust that "I saw this" survives a refresh.
- Stale-state indication. Operators need to know when data is fresh vs cached.
- Confidence on every AI output.

**Bloat (avoid):**
- Long-form prose where one bullet would do. The frontend already trends concise — the backend must match.
- Multiple AI providers. Vertex only.
- Custom analytics dashboards. The frontend already specifies its charts.
- Fancy auth (SSO, MFA, OAuth). JWT bearer is fine for MVP.
- Microservices.

## 8. Backend Compute vs Frontend Display

| Backend computes | Frontend displays |
|---|---|
| ETA delta, ETA confidence, ETA series | the chart |
| Risk score (0–100) and risk band | the gauge/pill |
| Cause attribution weights | the pie/bars |
| AI brief / AI conclusion (Gemini structured output) | the card |
| Distance, progress %, current phase | the status card |
| Stale flag (when was it last refreshed?) | the dot indicator |
| Acknowledged-by, acknowledged-at (audit) | "✓ acknowledged" pill |
| Sanctions match decision | "MATCH"/"CLEAR" banner |
| Aggregated KPIs (vessels by status, total alerts, etc.) | KPI cards |
| Top-10 ports by throughput | bar chart |

The frontend must **never** compute risk scores or attribution; those are backend reasoning outputs.

## 9. Interactive Pages vs Informational Pages

| Page | Today | Target | New interaction needed? |
|---|---|---|---|
| `/login` | interactive | interactive | none |
| `/dashboard` | informational | semi-interactive | KPI tiles → click filters fleet table; "Run analysis" trigger |
| `/fleet` | filter+sort+select | interactive | none — already strong |
| `/ports` | filter only | interactive | port detail drawer on click |
| `/risk` | search+filter+create | interactive | screen action stores result |
| `/trade` | filter+select+create+approve | interactive | none |
| `/agi` | filter+expand+execute | interactive | none |
| `/voyage` | static list (1 hardcoded entry) | interactive | **gap** — must list real voyages, sort by attention-worthy |
| `/voyage/new` | full form | interactive | none |
| `/voyage/{id}` | server-rendered, no live updates wired | interactive | **gap** — wire stream/poll, wire ackAlert, wire chat |
| `/voyage/{id}/analysis` | informational | semi-interactive | none — analysis is by nature read-only |
| `/voyage/{id}/report` | informational | informational | export action |

## 10. APIs: Real vs Adapter

| Capability | Source | Strategy |
|---|---|---|
| AI reasoning | **Vertex Gemini** (`gemini-2.5-flash` / `gemini-2.5-pro`) | Real, primary. JSON-schema-validated outputs. |
| Sanctions screening | **OpenSanctions** (`api.opensanctions.org/match`) | Real adapter. Free tier. |
| Port search / geocoding | **GeoNames** or local UN/LOCODE seed file | Hybrid: seed 100 ports locally for offline dev; GeoNames adapter behind feature flag. |
| Ship lookup | Local IMO directory + structured AIS open data | Local seed + adapter stub. |
| Live AIS / weather | **Open-Meteo** (weather), **AISstream** (live AIS, optional) | Adapter only; not on the critical MVP path. Weather adapter wired since it influences ETA brief. |
| Risk events / piracy | **ReliefWeb** + ICC IMB if reachable | Adapter, used to enrich risk score. Optional for MVP. |
| Blockchain | none | UI-only for MVP; backend stores hash strings as opaque text. |

**Rule:** any module that calls an external API must do so via a thin adapter under `app/adapters/<provider>.py` with: a typed request, a typed response, retry/timeout, and a fixture file that lets it run in tests with no network.

## 11. AI Strategy

Where Vertex Gemini is used:

| Module | Model | Why this model |
|---|---|---|
| Voyage AI Brief (`getBrief`) | `gemini-2.5-flash` | Quick turnaround per voyage; structured JSON; cheap. |
| Voyage Cause Attribution explanation | `gemini-2.5-flash` | Same. |
| Voyage Report `aiConclusion` | `gemini-2.5-pro` (env: `GEMINI_MODEL_PRO`) | Reasoning over the full timeline; one call per finished voyage; quality > latency. |
| AGI Decisions ("run analysis") | `gemini-2.5-pro` | Whole-fleet reasoning; rare invocation. |
| Sanctions explanation | `gemini-2.5-flash` | One-line summary of why a match is a match. |

**Rules:**
1. Every AI call goes through one helper (`app/services/llm/vertex.py`) that handles auth, retries, timeouts, JSON-schema response parsing.
2. Every call is logged: prompt template id, model, latency, token counts, parsed payload, raw payload. Stored in `ai_calls` table for inspection.
3. The provider can be set to `stub` (deterministic, no network) for test runs — `AI_PROVIDER=stub`.
4. When provider is `auto`, falls to `vertex` if creds present, else `stub`. (Already in `.env`.)
5. Schema-validated outputs only — no free-form text in JSON fields. If the model returns invalid JSON, retry once, then surface a `provider_error` envelope rather than guess.

## 12. Final Design Principles

- **Modular monolith.** Domains: `auth`, `voyages`, `fleet`, `ports`, `alerts`, `trades`, `risk`, `agi`, `dashboard`, `ai`. Each is a router + service + schema + (optional) adapter.
- **Stack:** FastAPI + SQLAlchemy 2.x async + Alembic + SQLite (dev) / Postgres (prod). The `.env` already specifies this — DATABASE_URL accepts both.
- **Storage strategy:** Real persistence for voyages, events, alerts, AI calls, audit log. Read-mostly reference data (ports, vessels, AGI decisions, trade docs) seeded into DB on first run, but served from DB so it's mutable.
- **Streaming:** Server-Sent Events at `/api/voyages/{id}/stream`. Cheaper than WebSockets, fits the data flow (server→client only), works behind any HTTP proxy. The frontend's `applyStream` handler is provider-agnostic.
- **Auth:** JWT bearer. Login returns access + refresh. Middleware reads `Authorization: Bearer …`, falls back to the existing `glimmora_session` cookie so frontend doesn't have to change.
- **Versioning:** every AI output is stamped `model + prompt_version + generated_at`. Stale UI dot fires when `now - asOf > 5 min` for live snapshots.
- **Tests:** unit (pure logic), integration (HTTP + DB + AI in stub mode), Playwright (real Next.js UI hitting the local FastAPI). Three layers, three commands.

## 13. Out-of-Scope (and why)

- **Real-time AIS ingestion** — the frontend doesn't show vessel-by-vessel telemetry beyond a single voyage; we synthesize a credible voyage live snapshot from planned route + elapsed time + weather adapter + small noise. AIS upgrade is a Phase 2 adapter swap.
- **PDF rendering** — the report page is HTML and printable; PDF export is a UX-only print stylesheet.
- **Multi-tenancy** — single-org MVP. The user table has an `organization` field reserved.
- **Email / push notifications** — alerts surface in-app only.
- **Trade doc blockchain writes** — UI shows hash, backend stores hash string. No on-chain action.

## 14. What Phase 0 Delivers to Phase 1

This document. Phase 1 (the forensic audit) is in [PHASE_1_FRONTEND_UNDERSTANDING.md](PHASE_1_FRONTEND_UNDERSTANDING.md), and Phase 2 (frontend → backend mapping) is in [PHASE_2_FRONTEND_BACKEND_MAPPING.md](PHASE_2_FRONTEND_BACKEND_MAPPING.md). The backend architecture follows in [PHASE_4_BACKEND_ARCHITECTURE.md](PHASE_4_BACKEND_ARCHITECTURE.md).
