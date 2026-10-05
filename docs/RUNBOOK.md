# Runbook / Deployment

> Local dev + Render / DigitalOcean / similar managed environments.

---

## Local startup

### Prerequisites
- Python 3.11+ (3.13 tested).
- Node.js 18+ for the frontend and Playwright.
- A `.env` at the repo root with `JWT_SECRET`, `DATABASE_URL`, `GCP_SERVICE_ACCOUNT_JSON_B64`, etc. (See [.env.example pattern in the existing .env](../.env)).

### Backend

```bash
cd backend
# (optional) create a venv
python -m venv .venv && source .venv/bin/activate
pip install -e .[dev]

# AI_PROVIDER=auto resolves to vertex if creds present, else stub.
ENV_FILE=../.env uvicorn app.main:app --reload --port 8000
```

The first boot:
1. Reads `../.env`.
2. Validates required env (fails fast if `JWT_SECRET` is missing or `vertex` is selected without creds).
3. Creates the SQLite tables (or runs Alembic in prod).
4. Seeds reference data idempotently (skips tables that are non-empty).
5. Mounts every domain router on `/api/...`.

Health check:
```bash
curl http://localhost:8000/api/health
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE=http://localhost:8000
npm run dev
```

Frontend is served on `http://localhost:3000`. Login with any of the demo accounts (password `demo`):
- `admiral@glimmora.com` (executive)
- `manager@glimmora.com` (fleet_ops)
- `trader@glimmora.com` (trade_intel)
- `analyst@glimmora.com` (risk_intel)
- `port@glimmora.com` (port_ops)
- `core@glimmora.com` (ai_core)

### Service startup order

1. Backend (port 8000)
2. Frontend (port 3000)
3. (Tests) Playwright

The frontend will work without the backend in mock mode (`NEXT_PUBLIC_USE_MOCK=1`).

---

## Environment variables

Read the [.env](../.env) file. Required:

| Var | Required | Notes |
|---|---|---|
| `JWT_SECRET` | yes | ≥32 chars |
| `DATABASE_URL` | yes | `sqlite:///glimmora.db` (dev) or `postgresql://...` (prod) |
| `AI_PROVIDER` | no | `auto` (default), `stub`, `vertex` |
| `GCP_SERVICE_ACCOUNT_JSON_B64` | when vertex | Base64-encoded service-account JSON |
| `GCP_LOCATION` | no | default `us-central1` |
| `GEMINI_MODEL` | no | default `gemini-2.5-flash` |
| `GEMINI_MODEL_PRO` | no | falls back to `GEMINI_MODEL` |
| `LLM_MAX_RETRIES` / `LLM_INITIAL_BACKOFF` / `LLM_REQUEST_TIMEOUT_S` | no | retry budget |
| `CORS_ORIGINS` | no | comma-separated; defaults to `http://localhost:3000` |
| `APP_PORT` | no | default 8000 |
| `LOG_LEVEL` | no | default INFO |
| `ENV` / `DEBUG` | no | informational |

---

## Production deployment

### Render

1. New Web Service → connect repo → select `backend/` as the working dir.
2. Build command: `pip install -e .`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment vars: copy from `.env`, but switch `DATABASE_URL` to a managed Postgres URL and rotate `JWT_SECRET`.
5. Add a managed Postgres add-on; Render injects `DATABASE_URL`.

### DigitalOcean App Platform

1. New App → from this repo → backend component.
2. Run command: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
3. Add Postgres database; bind via `${db.DATABASE_URL}`.
4. Frontend component: select `frontend/`, build command `npm run build`, run `npm start`.
5. Set `NEXT_PUBLIC_API_BASE=https://<backend-url>`.

### Docker (any platform)

A minimal Dockerfile is acceptable for both:

```dockerfile
# Backend
FROM python:3.11-slim
WORKDIR /app
COPY backend/pyproject.toml .
RUN pip install -e .
COPY backend/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Smoke tests on a fresh deployment

1. `GET /api/health` → `{ status: ok, db: true, ai_provider: vertex }` (assuming creds set).
2. `POST /api/auth/login` with a demo account → token pair.
3. `GET /api/voyages/v_001/brief` → AI brief.
4. Open `<frontend>/login` → log in → land on `/dashboard`.
5. Open `<frontend>/voyage/v_001` → see ship name + AI brief card.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Boot fails "JWT_SECRET ... too short" | env wasn't loaded or value < 32 chars | check ENV_FILE path, regenerate with `openssl rand -hex 32` |
| Boot fails "AI_PROVIDER=vertex requires GCP_SERVICE_ACCOUNT_JSON_B64" | creds env not set in deploy panel | add `GCP_SERVICE_ACCOUNT_JSON_B64` |
| Dashboard renders but no live data | frontend `NEXT_PUBLIC_API_BASE` points at wrong host | set in deploy env or `.env.local` |
| Voyage brief returns `_meta.errorCode` | Vertex throttled / 429 / network issue | retry, or set `LLM_MAX_RETRIES` higher; falls back via stub if `AI_PROVIDER=auto` and creds disappear |
| Sanctions screen returns `source: "offline"` | egress blocked from sandbox | expected in restricted environments; envelope is still valid |
| Ack alert POST returns 200 but page still shows unack | frontend cache | reload the voyage page; new state is persisted |
| `Authentication required` from a server-component page | cookie not forwarded | confirm the user logged in via the frontend (sets `glimmora_session` cookie); backend accepts the cookie as auth |

---

## Failure recovery

- **DB corruption (sqlite)**: stop the server, delete `glimmora.db`, restart. Seed re-runs idempotently.
- **AI provider down**: switch `AI_PROVIDER=stub` and restart; pages keep working with deterministic fallback.
- **OpenSanctions throttled**: adapter returns `source: "offline"`. Restart not needed.
- **Vertex creds rotated**: replace `GCP_SERVICE_ACCOUNT_JSON_B64`, restart. The provider singleton rebuilds on cold start.

---

## Logs to watch

- `boot` — single line on startup with provider, model, project, db.
- `vertex_call_failed` — Vertex error with attempt count.
- `opensanctions_http_error` / `opensanctions_network_error` — adapter degraded.
- `audit_log` table — every mutating endpoint adds a row.
- `ai_calls` table — every Vertex call logged with latency + tokens.
