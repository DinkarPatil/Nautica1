# Testing Guide

> Three layers, three commands.

---

## Layer A — Unit tests (pytest)

Lives under [`backend/tests/unit/`](../backend/tests/unit/).

Covers:
- JWT encode/decode (`test_jwt.py`)
- Password hashing (`test_password.py`)
- Permission map (`test_permissions.py`)
- LLM stub provider shape (`test_llm_stub.py`)
- Live snapshot math (haversine, interpolation, phase, risk band) (`test_voyage_live.py`)
- Cause attribution weight math (`test_attribution.py`)

Run:
```bash
cd backend
pytest tests/unit -q
```

## Layer B — Integration tests (pytest + httpx ASGI)

Lives under [`backend/tests/integration/`](../backend/tests/integration/).

Covers every domain endpoint:
- Auth flow (login, refresh, me, cookie fallback)
- Fleet (list/filter/sort/search/detail/optimize)
- Ports (list/detail/search/congestion)
- Risk (alerts list+create, regions, sanctions screen)
- Trade (list/detail/create/approve, role gates)
- AGI (list/filter/execute/analyze/model-status)
- Voyage tree (CRUD + live + brief + attribution + milestones + insight + report + chat + ship lookup)
- Dashboard (kpis / risk-snapshot / agi-feed)
- Meta (health / version)

The fixture in `conftest.py` boots the FastAPI app once per session, seeds the DB, and resets mutable tables between tests. `AI_PROVIDER=stub` is forced.

Run:
```bash
cd backend
pytest tests/integration -q
```

### Optional: live Vertex test

`tests/integration/test_vertex_live.py` exercises the **real** Vertex Gemini provider. Skipped unless `VERTEX_LIVE=1`:

```bash
cd backend
VERTEX_LIVE=1 pytest tests/integration/test_vertex_live.py -q
```

## Layer C — Playwright E2E

Lives under [`e2e/tests/`](../e2e/tests/).

Covers:
- `auth.spec.ts` — login redirect, success, bad password
- `dashboard.spec.ts` — Executive Bridge heading
- `voyage_create.spec.ts` — form renders + create endpoint round-trip
- `voyage_live.spec.ts` — `/voyage/v_001` renders ship/route + brief endpoint validates
- `voyage_report.spec.ts` — `/voyage/v_001/report` renders + endpoint validates
- `api_smoke.spec.ts` — health, login, KPIs, sanctions screen via direct API

### Prerequisites

1. Backend running: `cd backend && AI_PROVIDER=stub uvicorn app.main:app --port 8000`
2. Frontend running with `NEXT_PUBLIC_API_BASE=http://localhost:8000` set (default in `.env.local`).
3. Chromium installed: `cd e2e && npx playwright install chromium`

### Run

```bash
cd e2e
npx playwright test
```

### Headed
```bash
cd e2e
npx playwright test --headed
```

### HTML report
```bash
cd e2e
npx playwright show-report
```

## Sample test data

The seed runner ([backend/app/seed/seed_runner.py](../backend/app/seed/seed_runner.py)) loads:

| Source | Count | Notes |
|---|---|---|
| users.json | 6 | All passwords `demo` |
| vessels.json | 100 | Mirrors frontend mock |
| ports.json | 20 | Same |
| congestion_history.json | 7 | Daily |
| alerts.json | 15 | Mixed severities |
| trades.json | 10 | One per type roughly |
| agi_decisions.json | 20 | Categorized |
| risk_regions.json | 10 | For map |
| ships.json | 5 | One canonical per IMO |
| port_search.json | 25 | Broader than `ports` for the autocomplete |

Plus a single demo voyage `v_001` (Algeciras → Rotterdam) with full event/alert/eta/milestone history seeded inline.

## Validation checklist (before declaring DONE)

```
[ ] backend pytest unit:        all green
[ ] backend pytest integration: all green
[ ] e2e playwright:             all green
[ ] /api/health returns ok in dev
[ ] login as admiral demo lands on /dashboard
[ ] /voyage/v_001 renders MV Nordic Falcon, Algeciras, Rotterdam
[ ] /voyage/v_001/brief returns a non-empty `recommendation`
[ ] /voyage/v_001/report returns 4 attribution factors
[ ] AI_PROVIDER=vertex with the .env keys produces a real Gemini response (verified)
[ ] OpenSanctions adapter returns the standard envelope (offline graceful)
[ ] Frontend type-check passes (npx tsc --noEmit)
```

## Known limitations

- Sandboxed dev environments often block outbound HTTPS to OpenSanctions / Open-Meteo. Both adapters degrade to `source: "offline"` and the sanctions screening still returns a valid envelope (just empty hits).
- Playwright's `request.get` against the FastAPI server bypasses the Next.js dev server — that's intentional, since some voyage pages are server-rendered and the browser would never see those calls.
- The voyage live snapshot is deterministic from seeded route + wall time; subsequent calls drift naturally. This is by design for the MVP (no live AIS feed yet).
