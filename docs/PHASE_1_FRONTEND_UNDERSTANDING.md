# Phase 1 — Frontend Understanding Document

> Forensic audit of the existing Next.js 14 frontend at [frontend/](../frontend/).
> Page-by-page inventory derived by reading every route, component, type, and mock fixture.

---

## 1. Full Route Inventory

| Route | File | Layout | Public? | Roles allowed |
|---|---|---|---|---|
| `/` | [app/page.tsx](../frontend/app/page.tsx) | none (own shell) | yes | n/a |
| `/login` | [app/login/page.tsx](../frontend/app/login/page.tsx) | none | yes | n/a |
| `/unauthorized` | [app/unauthorized/page.tsx](../frontend/app/unauthorized/page.tsx) | none | yes | n/a |
| `/dashboard` | [app/dashboard/page.tsx](../frontend/app/dashboard/page.tsx) | ClientLayout | no | all 6 |
| `/fleet` | [app/fleet/page.tsx](../frontend/app/fleet/page.tsx) | ClientLayout | no | all 6 |
| `/ports` | [app/ports/page.tsx](../frontend/app/ports/page.tsx) | ClientLayout | no | all 6 |
| `/risk` | [app/risk/page.tsx](../frontend/app/risk/page.tsx) | ClientLayout | no | `ai_core, executive, fleet_ops, risk_intel` |
| `/trade` | [app/trade/page.tsx](../frontend/app/trade/page.tsx) | ClientLayout | no | `ai_core, executive, fleet_ops, trade_intel, risk_intel` |
| `/agi` | [app/agi/page.tsx](../frontend/app/agi/page.tsx) | ClientLayout | no | `ai_core, executive, fleet_ops, trade_intel, risk_intel` |
| `/voyage` | [app/voyage/page.tsx](../frontend/app/voyage/page.tsx) | voyage/layout | no | (no explicit gate; protected by middleware once cookie exists) |
| `/voyage/new` | [app/voyage/new/page.tsx](../frontend/app/voyage/new/page.tsx) | voyage/layout | no | same |
| `/voyage/[id]` | [app/voyage/[id]/page.tsx](../frontend/app/voyage/[id]/page.tsx) | voyage/layout | no | same |
| `/voyage/[id]/analysis` | [app/voyage/[id]/analysis/page.tsx](../frontend/app/voyage/[id]/analysis/page.tsx) | voyage/layout | no | same |
| `/voyage/[id]/report` | [app/voyage/[id]/report/page.tsx](../frontend/app/voyage/[id]/report/page.tsx) | voyage/layout | no | same |

`middleware.ts` enforces: a `glimmora_session` cookie is required on every non-public path; `/risk` blocks `trade_intel, port_ops`; `/trade` blocks `port_ops`; `/agi` blocks `port_ops`. The voyage tree is not in the middleware route map yet — that is a gap (see §8).

## 2. Page-by-Page Explanation

### 2.1 `/` — Landing
1305-line marketing page (radar, CTA cards, mock dashboard preview). **No backend implications** beyond linking to `/login` and `/dashboard`. Treated as static.

### 2.2 `/login` — Authentication portal
- Inputs: email, password. "Show password" toggle.
- Buttons: "Access System" submit; one quick-login button per `DEMO_ACCOUNTS` entry (5 entries — `ai_core` is excluded from the list, as in [AuthContext.tsx:148-151](../frontend/app/context/AuthContext.tsx#L148-L151)).
- State: validates against in-memory `MOCK_USERS`; on success writes `localStorage["glimmora_user"]` and a `glimmora_session` cookie containing `{ role, id }`.
- Loading: button text changes to "Authenticating…", disabled.
- Error: red box with the `err.message`.
- **Implied API:** `POST /api/auth/login → { access_token, refresh_token, user }`. Currently bypassed.
- **Gap:** quick-login uses hardcoded password "demo"; backend must mirror that for the demo accounts in DB seed.

### 2.3 `/unauthorized` — Access denied
Static. Link "Return to Bridge" → `/dashboard`. No backend.

### 2.4 `/dashboard` — Executive Bridge
- Header: greeting + role label + UTC clock + literal `"100 vessels · 20 ports · Live intelligence"` string.
- Sections (in order):
  1. `RiskBanner` (gated `VIEW_ALL_ALERTS`) — auto-detected critical alert.
  2. `KPICards` — 4 stat tiles: vessels active / at port / delayed / flagged, with sparkline.
  3. `AGIFeed` (gated `VIEW_ALL | VIEW_TRADE_AGI | RUN_AGI`) — scrolling ticker of decisions.
  4. `MaritimeMap` (sticky, 2/3) + `RiskSnapshot` (gated, 1/3).
  5. `CongestionChart` (gated) + Fleet Status progress bars.
- **Today** all child components read from local mock files. Backend must replace these reads with HTTP fetches that match the same shapes.
- **Implied API:** `GET /api/dashboard/kpis`, `GET /api/dashboard/risk-snapshot`, `GET /api/dashboard/congestion`, `GET /api/dashboard/agi-feed`. (See Phase 2.)

### 2.5 `/fleet` — Fleet Intelligence
- Status filter tabs (`All | En Route | At Port | Delayed | Flagged | Anchored`), search box, `RouteOptimizer` button.
- Table: 7 sortable columns (Name, Flag, Status, Speed, Destination, Risk, Type).
- Right-side detail panel on row click: vessel meta + `agiRecommendation` (gated `VIEW_ALL | RUN_AGI | VIEW_TRADE_AGI`).
- Reads `vessels` directly (100 records). All filtering/sorting client-side.
- **Implied API:** `GET /api/fleet/vessels?status=&q=&sort=` returning the same `Vessel[]` shape.
- **Gaps:** no pagination, no server-side sort. For 100 records this is fine; backend should still support pagination params for Phase 2.

### 2.6 `/ports` — Port Operations
- Top throughput bar chart (Recharts), top-10 ports.
- Status filter tabs.
- Grid of port cards.
- Reads `ports` (20 records).
- **Implied API:** `GET /api/ports?status=`. Top-10 sort is client-side.
- `congestionHistory` is imported but unused on this page (used by dashboard).

### 2.7 `/risk` — Risk & Sanctions
- Sanctions screening input → `Screen` button → match/clear card. Currently a hardcoded SANCTIONED_VESSELS regex match.
- Suggested vessels (chips).
- Alert breakdown summary.
- Geopolitical risk map (`riskRegions` mocked).
- Alert feed: filterable by type (sanctions/weather/geopolitical/route/cyber) and severity, expandable cards.
- "+ Create alert" button (gated `VIEW_ALL | CREATE_ALERT | ESCALATE`).
- **Implied APIs:**
  - `POST /api/risk/sanctions/screen { query }` → `{ matched, hits[], explanation, source }`
  - `GET /api/risk/alerts?type=&severity=`
  - `POST /api/risk/alerts` (role-gated)
  - `GET /api/risk/regions` (geopolitical map)

### 2.8 `/trade` — Trade Intelligence
- 5 stat tiles (total/processed/pending/flagged/on-chain).
- Status filter tabs.
- "+ New document" (gated `VIEW_ALL | CREATE_TRADE | APPROVE`).
- Document list with smart contract sticky panel; "Approve Document" (gated `VIEW_ALL | APPROVE`).
- Reads `trades` (10 records).
- **Implied APIs:**
  - `GET /api/trade/documents?status=`
  - `POST /api/trade/documents`
  - `POST /api/trade/documents/{id}/approve`
  - `GET /api/trade/documents/{id}/contract` (smart-contract metadata)

### 2.9 `/agi` — AGI Decision Engine
- Stats grid: 4 metrics (total, critical, actioned, avg confidence).
- Category filter tabs + priority pills.
- Featured decision card (when filter == All) → "Execute recommendation" button → `ExecuteAIDecisionModal`.
- "Run analysis" (gated `RUN_AGI | VIEW_ALL`) — triggers a new run.
- Query param `?focus=top` highlights and scrolls.
- Reads `agiDecisions` (20 records).
- **Implied APIs:**
  - `GET /api/agi/decisions?category=&priority=`
  - `POST /api/agi/decisions/{id}/execute`
  - `POST /api/agi/analyze` → returns generated decisions and stores them.

### 2.10 `/voyage` — Voyage list
Single hardcoded card today. Real implementation needs `GET /api/voyages` returning a summary list (id, ship name, route, status, ETA delta, progress %). Sort by attention-worthy default (delayed first).

### 2.11 `/voyage/new` — Start a Voyage
- `VoyageCreateForm` controls a `VoyageDraft` ([components/voyage/create/types.ts](../frontend/components/voyage/create/types.ts)).
- Sections: Vessel (shipName, imo, voyageType), Route (origin port picker, destination port picker), Schedule (planned departure/arrival), Monitoring (sensitivity/trackingMode/alertPreference segments), Intelligence collapsible (cargoPriority, delayToleranceMin, preferredRoute, watchlistCompany, notes).
- `PortPickerField` calls `voyageApi.searchPorts(q)`; backend must serve `GET /api/ports/search?q=`.
- `VoyageAIAssistant` sidebar — currently static; should be wired to a dry-run AI brief based on the draft.
- Submit calls `voyageApi.createVoyage({})` → routes to `/voyage/{id}`. **Bug**: today it sends an empty object; backend must accept the full draft mapped to `Voyage` shape.

### 2.12 `/voyage/[id]` — Live tracking
- `VoyageShell → VoyageTopBar / VoyageStatusBar → 3-column grid`:
  - Left (sticky 5/12): `VoyageMapPanel` (live mode).
  - Center (4/12): `VoyageStatusCard`, `ETATrendCard`, `EventTimelineCard`.
  - Right (3/12): `AIBriefCard`, `RiskScoreCard`, `AlertsCard`, `ChatComposer`.
- Page is server-rendered with `dynamic = "force-dynamic"`; on render it fetches `Voyage`, live snapshot, events, alerts, brief, and ETA series in parallel.
- The `voyageStore` (Zustand) provides `applyStream(StreamEvent)` for `snapshot | event | alert | brief`. Today nothing wires the stream — the page just hydrates once.
- **Implied APIs (matched 1:1 to [voyageApi.ts:251-312](../frontend/lib/voyage/voyageApi.ts#L251-L312))**:
  - `GET /api/voyages/{id}` → `Voyage`
  - `GET /api/voyages/{id}/live` → `VoyageLiveSnapshot`
  - `GET /api/voyages/{id}/events` → `VoyageEvent[]`
  - `GET /api/voyages/{id}/alerts` → `VoyageAlert[]`
  - `GET /api/voyages/{id}/brief` → `AIBrief`
  - `GET /api/voyages/{id}/eta-series` → `ETASnapshot[]`
  - `POST /api/voyages/{id}/alerts/{alertId}/acknowledge` → `{ id, acknowledged: true }`
  - `GET /api/voyages/{id}/stream` (SSE) → `StreamEvent` records
  - `POST /api/voyages/{id}/chat` → `{ answer, citations }` (for `ChatComposer`)

### 2.13 `/voyage/[id]/analysis` — Post-mortem analysis
- Same shell. Map shows planned-vs-actual (`mode="both"`).
- Right column: `ETAShiftChart`, `RouteAnalysisCard`, `CauseAttributionCard`, `MilestoneTable`, `InsightSummaryCard` (text currently hardcoded).
- Fetches: voyage, live, eta-series, attribution, milestones, alerts (parallel).
- **Additional implied APIs:**
  - `GET /api/voyages/{id}/attribution` → `CauseAttribution`
  - `GET /api/voyages/{id}/milestones` → `Milestone[]`
- The `InsightSummaryCard` should be dynamic — backend supplies a free-form analytical paragraph.

### 2.14 `/voyage/[id]/report` — Final report
- Calls `voyageApi.getReport(id)` returning a `VoyageReport` (voyage, route metrics, summary, eta series, events, alerts, attribution, milestones, finalRiskScore, aiConclusion).
- Sections rendered: header, Summary, ETA Trend, Delay Attribution, Risk Events (filtered by severity ≠ info), Milestones, Final Status.
- `ReportFooter` action buttons (print/download).
- **Implied API:** `GET /api/voyages/{id}/report`.

## 3. UI Component Inventory

### Voyage feature (the biggest surface)

| Component | Reads from | Calls API |
|---|---|---|
| `VoyageShell`, `VoyageTopBar`, `VoyageStatusBar` | props | none |
| `VoyageCreateForm` | `VoyageDraft` | none directly |
| `PortPickerField` | props | `voyageApi.searchPorts` |
| `VoyageAIAssistant` | props (draft) | none today; should call `POST /api/voyages/preview-brief` |
| `RoutePreviewStrip` | props (draft) | none |
| `VoyageMapPanel` | props (voyage, live, mode) | none |
| `VoyageStatusCard` | store/live | none |
| `ETATrendCard`, `ETAShiftChart` | store/etaSeries | none |
| `EventTimelineCard` | store/events | none |
| `AIBriefCard` | store/brief | none |
| `RiskScoreCard` | store/live | none |
| `AlertsCard` | store/alerts | `voyageApi.ackAlert` |
| `ChatComposer` | local state | `POST /api/voyages/{id}/chat` (implied) |
| `CauseAttributionCard` | props | none |
| `MilestoneTable`, `InsightSummaryCard`, `RouteAnalysisCard` | props | none |
| `ReportHeader`, `ReportSection`, `AttributionList`, `ReportFooter` | props | none |

### Dashboard / fleet / risk

| Component | Reads from | Calls API |
|---|---|---|
| `KPICards` | `vessels`, `ports`, `alerts` (computed locally) | should call `/api/dashboard/kpis` |
| `AGIFeed` | `agiDecisions` | should call `/api/dashboard/agi-feed` |
| `CongestionChart` | `congestionHistory` | should call `/api/dashboard/congestion` |
| `RiskSnapshot`, `RiskBanner` | `alerts` | should call `/api/dashboard/risk-snapshot` |
| `MaritimeMap` | `vessels`, `ports` | should call `/api/fleet/vessels` and `/api/ports` |
| `Sidebar`, `TopBar`, `StatusBar` | `useAuth` | none |
| `RoleGate`, `ProtectedPage` | `useAuth` | none |
| `RouteOptimizer` | local state | should call `/api/fleet/route-optimize` (low priority) |
| `ExecuteAIDecisionModal` | props | should call `/api/agi/decisions/{id}/execute` |

## 4. Current Data Sources

All real reads today come from in-frontend modules:

- [app/data/vessels.ts](../frontend/app/data/vessels.ts) — 100 records
- [app/data/ports.ts](../frontend/app/data/ports.ts) — 20 ports + 7-day `congestionHistory`
- [app/data/alerts.ts](../frontend/app/data/alerts.ts) — 15 records
- [app/data/trades.ts](../frontend/app/data/trades.ts) — 10 documents
- [app/data/agi-decisions.ts](../frontend/app/data/agi-decisions.ts) — 20 decisions
- [lib/voyage/voyageApi.ts](../frontend/lib/voyage/voyageApi.ts) — fully mocked async API (single voyage `v_001`)

These are the seed data the backend must own and serve.

## 5. Static / Mock Data Usage Hotspots

| Where | What | Backend replacement |
|---|---|---|
| Dashboard footer | `"100 vessels · 20 ports · Live intelligence"` literal | `/api/dashboard/kpis.summary` |
| `KPICards` | Hardcoded counts | computed in backend |
| `/risk` sanctions screening | Inline `SANCTIONED_VESSELS` array | OpenSanctions adapter |
| `/risk` regions | Inline `riskRegions` | DB-seeded `risk_regions` |
| `/trade` smart contract panel | `smartContractHash` strings | DB column, opaque text |
| `/agi` model status box | `claude-sonnet-4-6` literal | `/api/agi/model-status` returns Vertex model id |
| Voyage analysis insight | Hardcoded paragraph | dynamic AI output |
| `voyageApi.ts` | All 13 mock functions | live HTTP calls |

## 6. Expected Interactions (per page)

| Page | Interaction |
|---|---|
| `/login` | submit credentials |
| `/dashboard` | passive watch + click into voyage / fleet from cards |
| `/fleet` | filter, sort, search, select row → see AGI rec |
| `/ports` | filter, view chart |
| `/risk` | screen entity, filter alerts, expand alert, create alert |
| `/trade` | filter, select doc, create doc, approve doc |
| `/agi` | filter, expand decision, execute decision, run analysis |
| `/voyage` | open voyage, start new |
| `/voyage/new` | fill draft, search ports, validate IMO, submit |
| `/voyage/{id}` | watch live; ack alert; ask chat; navigate to analysis/report |
| `/voyage/{id}/analysis` | inspect attribution, scrub timeline |
| `/voyage/{id}/report` | print, share |

## 7. Inferred Backend API Needs (consolidated)

> Master list. The Phase 2 mapping document fleshes each into request/response/error contracts.

```
# Auth
POST   /api/auth/login                         { email, password } -> { access_token, refresh_token, user }
POST   /api/auth/refresh                       { refresh_token } -> { access_token }
POST   /api/auth/logout
GET    /api/auth/me                            -> User

# Dashboard
GET    /api/dashboard/kpis
GET    /api/dashboard/risk-snapshot
GET    /api/dashboard/congestion
GET    /api/dashboard/agi-feed

# Fleet
GET    /api/fleet/vessels                      ?status=&q=&sort=&page=
GET    /api/fleet/vessels/{id}
POST   /api/fleet/route-optimize               { vesselId, alternativeWaypoints? }

# Ports
GET    /api/ports                              ?status=&region=
GET    /api/ports/{id}
GET    /api/ports/search                       ?q=               # used by voyage/new

# Risk
POST   /api/risk/sanctions/screen              { query } -> match envelope
GET    /api/risk/alerts                        ?type=&severity=
POST   /api/risk/alerts
GET    /api/risk/regions

# Trade
GET    /api/trade/documents                    ?status=
POST   /api/trade/documents
GET    /api/trade/documents/{id}
POST   /api/trade/documents/{id}/approve

# AGI
GET    /api/agi/decisions                      ?category=&priority=
POST   /api/agi/decisions/{id}/execute
POST   /api/agi/analyze
GET    /api/agi/model-status

# Voyages
GET    /api/voyages
POST   /api/voyages                            { draft }
GET    /api/voyages/{id}
GET    /api/voyages/{id}/live
GET    /api/voyages/{id}/events
GET    /api/voyages/{id}/alerts
POST   /api/voyages/{id}/alerts/{aid}/acknowledge
GET    /api/voyages/{id}/brief
POST   /api/voyages/{id}/brief/refresh
GET    /api/voyages/{id}/eta-series
GET    /api/voyages/{id}/attribution
GET    /api/voyages/{id}/milestones
GET    /api/voyages/{id}/report
POST   /api/voyages/{id}/chat                  { message } -> grounded answer
GET    /api/voyages/{id}/stream                (SSE)
GET    /api/ships/lookup                       ?imo=

# Health / meta
GET    /api/health
GET    /api/version
```

## 8. Gaps Between Current UI and Desired Product Behavior

1. **Voyage tree not in middleware route map.** [middleware.ts:3-10](../frontend/middleware.ts#L3-L10) protects `/dashboard, /fleet, /ports, /risk, /trade, /agi` only. Add `/voyage` to allowlist for all roles.
2. **`/voyage/new` submits empty payload.** Form state isn't packed before `voyageApi.createVoyage({})`. Will fix when wiring real backend (Phase 6, voyages module).
3. **Single hardcoded voyage in `/voyage`.** Replace with real list endpoint.
4. **No streaming today.** `applyStream` plumbing exists but no consumer. Add SSE wiring on `/voyage/{id}` pages.
5. **Auth is localStorage-only.** No JWT, no refresh, no logout endpoint. Backend must take over with cookie + bearer.
6. **`InsightSummaryCard` static text.** Replace with backend-supplied AI summary.
7. **Sanctions screening is client-side regex.** Replace with `POST /api/risk/sanctions/screen` going through OpenSanctions adapter.
8. **Trade approval is no-op.** Wire to real backend with audit log entry.
9. **AGI model literal string.** Display value should come from `/api/agi/model-status` (returns Gemini model id).
10. **`congestionHistory` imported and unused on `/ports`.** Either render or stop importing.
11. **No error boundaries.** Voyage pages run 6 fetches in `Promise.all`; one failure = blank page. Recommend per-call try/catch or React Suspense + error UI. Backend can help by returning structured `{ data, error }` envelopes for non-critical reads.
12. **No pagination on fleet/ports/AGI/trade lists.** Backend supports it; frontend can adopt incrementally.
13. **No correlation between alerts and dashboard `RiskBanner`.** Banner is local to dashboard; `risk_intel` endpoint should serve it.
14. **AGI page's "Execute recommendation" button is unwired.** Will wire when AGI module lands.

---

## 9. Pages Strong / Passive / Lacking Interactivity

| Page | Strong | Passive | Lacking |
|---|---|---|---|
| `/dashboard` | KPI density, banner | most charts read-only | Click-through from KPI tile to filtered fleet view |
| `/fleet` | filter+sort+search+detail | — | bulk select, watchlist toggle |
| `/ports` | chart, status grid | most of page | drill-down drawer per port |
| `/risk` | screening tool | map, alerts feed | map click → filtered alerts |
| `/trade` | doc list + contract panel | — | doc upload widget |
| `/agi` | feature card, expand-on-click | — | thumbs up/down (feedback loop) |
| `/voyage/{id}` | live shell composition | needs live wiring | streaming, chat send |
| `/voyage/{id}/analysis` | attribution + chart | hardcoded insight | scrub timeline |
| `/voyage/{id}/report` | clean printable | — | export PDF |

---

This document is the contract for Phase 2 (frontend → backend mapping) and the input for Phase 4 (architecture). All endpoint contracts are detailed in [PHASE_2_FRONTEND_BACKEND_MAPPING.md](PHASE_2_FRONTEND_BACKEND_MAPPING.md).
