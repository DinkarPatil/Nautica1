# Phase 2 — Frontend → Backend Mapping

> Per-page intent → input → backend process → response shape → states.
> Endpoint shapes match the existing TypeScript types in [frontend/types/voyage.ts](../frontend/types/voyage.ts) and [frontend/app/types/index.ts](../frontend/app/types/index.ts) so the frontend does not need to change.

---

## Conventions

- **Auth header:** `Authorization: Bearer <access_token>`. Cookie `glimmora_session` accepted as fallback for the existing frontend.
- **Errors:** every endpoint that can fail returns either the success body or `{ "error": { "code": str, "message": str, "detail"?: any } }` with a non-2xx status code.
- **Stale envelope:** for AI-generated payloads we wrap with `_meta`:
  ```json
  { "...payload": "...", "_meta": { "model": "gemini-2.5-flash", "promptVersion": "voyage_brief.v1", "generatedAt": "...", "stale": false } }
  ```
- **Unique value rule:** every page must do one of {decide, prepare, validate, prioritize, understand-risk, move-forward}. Marked per page.

---

## Page 1 — `/login`

| Field | Value |
|---|---|
| **User intent** | Authenticate as a maritime role |
| **Unique value** | Move-forward (gateway) |
| **Input** | `email`, `password` |
| **Backend data** | `users` table |
| **Backend process** | Verify bcrypt password → mint JWT access (30 min) + refresh (7 d) → audit `auth_events` |
| **Endpoint** | `POST /api/auth/login` |
| **Response** | `{ access_token, refresh_token, token_type:"bearer", user: {...} }` |
| **Loading** | button "Authenticating…" |
| **Error** | 401 → "Invalid credentials"; 422 → field-level |
| **Correct output** | redirect to `/dashboard`; cookie + storage updated |
| **Failure** | message displayed, no cookie written |

Also: `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`.

---

## Page 2 — `/dashboard`

| Field | Value |
|---|---|
| **User intent** | Get the situation in 5 seconds |
| **Unique value** | Prioritize / understand-risk |
| **Inputs** | none beyond JWT |
| **Backend process** | Aggregate counts from `vessels`, `ports`, `alerts`; pull top 5 alerts; pull top 7 days congestion |

| Endpoint | Response |
|---|---|
| `GET /api/dashboard/kpis` | `{ activeVessels, atPort, delayed, flagged, anchored, congestionPct, riskAlerts, tradeVolumeBn, co2SavedTons, uptimePct }` |
| `GET /api/dashboard/risk-snapshot` | `{ counts: {critical, high, medium, low}, top: Alert[] }` |
| `GET /api/dashboard/congestion` | `CongestionDataPoint[]` (`{ date, global, pacific, atlantic }`) — last 7 days |
| `GET /api/dashboard/agi-feed` | `AGIDecision[]` (most recent 8) |

States:
- Loading: skeleton tiles.
- Empty: counts of 0 still render.
- Error: red sliver banner; widget keeps last good data.
- Stale: dot in TopBar if any KPI > 5 min old.

---

## Page 3 — `/fleet`

| Field | Value |
|---|---|
| **User intent** | Find a vessel that needs attention |
| **Unique value** | Prioritize |
| **Inputs** | `status` filter, `q` (search), sort key + dir |
| **Backend process** | Query `vessels` with filters, ordered by sort, paginated |
| **Endpoint** | `GET /api/fleet/vessels?status=&q=&sort=&dir=&page=&limit=` |
| **Response** | `{ items: Vessel[], total, page, limit }` |
| **AGI rec** | Already computed and stored on vessel; refreshed by AGI module |
| **States** | empty → "No vessels match these filters"; error → toast + retry |

Detail click: `GET /api/fleet/vessels/{id}` returns the same `Vessel` (in case the table is paginated).

Optional: `POST /api/fleet/route-optimize { vesselId, alternatives? }` returns route options + savings; this powers `RouteOptimizer`.

---

## Page 4 — `/ports`

| Field | Value |
|---|---|
| **User intent** | See where loading/discharge will be slow |
| **Unique value** | Understand-risk / prepare |
| **Inputs** | `status`, `region` |
| **Endpoint** | `GET /api/ports?status=&region=` |
| **Response** | `Port[]` |
| **States** | empty handles same as fleet |

---

## Page 5 — `/risk`

| Endpoint | Purpose | Request | Response |
|---|---|---|---|
| `POST /api/risk/sanctions/screen` | Screen a name/IMO/company | `{ query, type?: "vessel"\|"company"\|"person" }` | `{ matched: bool, hits: [{name, source, listEntry, score}], explanation: str, _meta }` |
| `GET /api/risk/alerts?type=&severity=` | Feed | — | `Alert[]` |
| `POST /api/risk/alerts` | Create | `{ type, severity, title, description, location?, vesselId? }` (gated) | `Alert` |
| `GET /api/risk/regions` | Map regions | — | `RiskRegion[]` (`{ name, lat, lng, level, summary }`) |

OpenSanctions adapter call lives in `services/risk/sanctions.py`.

---

## Page 6 — `/trade`

| Endpoint | Purpose | Response |
|---|---|---|
| `GET /api/trade/documents?status=` | List | `TradeDocument[]` |
| `GET /api/trade/documents/{id}` | Detail | `TradeDocument` (full) |
| `POST /api/trade/documents` | Create (gated) | `TradeDocument` |
| `POST /api/trade/documents/{id}/approve` | Approve (gated `executive`) | `{ id, status: "Verified", approvedBy, approvedAt }` audited |
| `GET /api/trade/documents/{id}/contract` | Smart-contract metadata (opaque) | `{ network, txHash, blockHeight?, confirmations?, gasUsed?, parties }` |

Approval failure if user lacks `APPROVE`: 403.

---

## Page 7 — `/agi`

| Endpoint | Purpose | Response |
|---|---|---|
| `GET /api/agi/decisions?category=&priority=` | List | `AGIDecision[]` |
| `POST /api/agi/decisions/{id}/execute` | Mark actioned + dispatch (gated) | `{ id, executed: true, executedAt }` |
| `POST /api/agi/analyze` | Run a full-fleet analysis (gated `RUN_AGI`) | `{ runId, decisions: AGIDecision[], _meta }` |
| `GET /api/agi/model-status` | Surface current model | `{ provider:"vertex", model:"gemini-2.5-flash", proModel:"gemini-2.5-pro", lastRun }` |

`POST /api/agi/analyze` flow: pull current vessels, alerts, ports → prompt Gemini Pro with structured input → schema-validate output → persist + return.

---

## Page 8 — `/voyage` (list)

| Field | Value |
|---|---|
| **User intent** | Pick a voyage to monitor |
| **Unique value** | Prioritize |
| **Endpoint** | `GET /api/voyages?status=&q=&sort=` |
| **Response** | `VoyageSummary[]` (`{ id, ship, origin, destination, status, etaDeltaMin, riskBand, progressPct, updatedAt }`) |

Sort default: delayed → in-transit → completed; within group by abs(etaDelta) desc.

---

## Page 9 — `/voyage/new`

| Endpoint | Purpose | Request → Response |
|---|---|---|
| `GET /api/ports/search?q=` | Autocomplete | → `Port[]` |
| `GET /api/ships/lookup?imo=` | IMO validation | → `{ matched, ship?: { name, type, flag } }` |
| `POST /api/voyages` | Create | `VoyageDraft` (full) → `{ id }` |
| `POST /api/voyages/preview-brief` *(new)* | Dry-run AI assistant | `VoyageDraft` → `{ riskBand, summary, riskFactors }` |

`VoyageDraft` accepted by backend matches the frontend's draft shape (see [components/voyage/create/types.ts](../frontend/components/voyage/create/types.ts)) and is normalized server-side into a full `Voyage`.

States:
- Loading: button "Starting…"
- Validation error: 422 with `{ error: { code: "validation_error", detail: [{field, msg}, ...] } }`
- Success: `router.push(/voyage/{id})`.

---

## Page 10 — `/voyage/{id}` (live)

This is the crown jewel. All 7 endpoints below must return the exact shapes in [types/voyage.ts](../frontend/types/voyage.ts).

| Endpoint | Returns |
|---|---|
| `GET /api/voyages/{id}` | `Voyage` |
| `GET /api/voyages/{id}/live` | `VoyageLiveSnapshot` |
| `GET /api/voyages/{id}/events` | `VoyageEvent[]` (newest first, capped 200) |
| `GET /api/voyages/{id}/alerts` | `VoyageAlert[]` |
| `POST /api/voyages/{id}/alerts/{aid}/acknowledge` | `{ id, acknowledged: true }` |
| `GET /api/voyages/{id}/brief` | `AIBrief` (cached up to 5 min) |
| `POST /api/voyages/{id}/brief/refresh` | regenerate (gated) |
| `GET /api/voyages/{id}/eta-series` | `ETASnapshot[]` |
| `POST /api/voyages/{id}/chat` | `{ answer, citations, _meta }` |
| `GET /api/voyages/{id}/stream` (SSE) | event stream of `{ kind: "snapshot"\|"event"\|"alert"\|"brief", payload }` |

**Stream policy:** every 30 s emit a fresh `snapshot` for active voyages; emit `event` and `alert` records as they are created; emit a refreshed `brief` when ETA delta crosses ±15 min.

**Live snapshot computation (when no AIS feed):**
- Take voyage `routePlanned` (Coordinate[]).
- Use elapsed wall-clock time since `actualDeparture` and the planned total duration.
- Interpolate position along the great-circle path between the two nearest waypoints.
- Apply tiny noise + a weather-driven slowdown factor (Open-Meteo wind speed at current segment).
- Compute `etaDeltaMin` = (now → projected docking) − planned arrival.
- Risk score is a weighted blend of weather wind, ETA delta, recent alerts, sanctions hits.

Stale: if no AIS provider and the deterministic computation is older than 60 s, refresh on read.

---

## Page 11 — `/voyage/{id}/analysis`

| Endpoint | Returns |
|---|---|
| (reuse) `GET /api/voyages/{id}` | `Voyage` |
| (reuse) `GET /api/voyages/{id}/live` | `VoyageLiveSnapshot` |
| (reuse) `GET /api/voyages/{id}/eta-series` | `ETASnapshot[]` |
| `GET /api/voyages/{id}/attribution` | `CauseAttribution` |
| `GET /api/voyages/{id}/milestones` | `Milestone[]` |
| (reuse) `GET /api/voyages/{id}/alerts` | `VoyageAlert[]` |
| *(new)* `GET /api/voyages/{id}/insight` | `{ insight: str, _meta }` — replaces the hardcoded paragraph |

Cause attribution computation: weights derived from event categories (weather/congestion/speed/routing) summed by ETA-delta minutes attributed to each. AI augments each factor with a `note`.

---

## Page 12 — `/voyage/{id}/report`

| Endpoint | Returns |
|---|---|
| `GET /api/voyages/{id}/report` | `VoyageReport` |

Report only renders for `status ∈ {completed, aborted}`. Otherwise returns 409 with `{ code: "voyage_in_progress" }`.

---

## Cross-cutting non-functional requirements

| Concern | Requirement |
|---|---|
| Latency budget | 200 ms p95 for read endpoints; 5 s p95 for AI endpoints |
| Idempotency | `POST /api/risk/sanctions/screen` is safe to retry; AI endpoints carry `Idempotency-Key` header support (optional) |
| Caching | `Cache-Control: private, max-age=15` on dashboard read; `no-store` on auth and AI |
| Audit | `auth_events`, `ai_calls`, `audit_log` tables |
| Pagination | All list endpoints accept `?page=&limit=` (default 1/50) |
| CORS | `http://localhost:3000` in dev; configurable via env |
| Streaming | SSE only (HTTP/1.1 friendly); fall back to long-poll if `Accept: text/event-stream` not sent |

---

## Per-page failure semantics

| Page | If a critical fetch fails |
|---|---|
| `/dashboard` | render last-known with stale dot; toast on error |
| `/fleet`, `/ports` | error banner; "Retry" button |
| `/risk` (screen) | red banner; allow re-submit |
| `/trade`, `/agi` | error banner |
| `/voyage/{id}` | each card handles its own error state; brief card shows "Brief unavailable — retry" if AI failed |
| `/voyage/{id}/report` | full-page error if `report` 4xx/5xx |

---

This mapping is the **contract** for Phase 6 (implementation). No backend route should diverge from a row above without an explicit note in the implementation PR.
