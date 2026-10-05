# API Reference

Base URL (dev): `http://localhost:8000`
All endpoints under `/api/`. Errors share the envelope `{ "error": { "code", "message", "detail? } }`.

Auth: `Authorization: Bearer <access_token>` OR `Cookie: glimmora_session=<urlencoded JSON {role,id}>`.

## Meta

| Verb | Path | Body | Response |
|---|---|---|---|
| GET | `/api/health` | — | `{ status, db, ai_provider, model, model_pro, version, env }` |
| GET | `/api/version` | — | `{ version, name }` |
| GET | `/api/docs` | — | OpenAPI Swagger UI |
| GET | `/api/openapi.json` | — | OpenAPI 3.1 spec |

## Auth

| Verb | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | `{ access_token, refresh_token, token_type, user }` | none |
| POST | `/api/auth/refresh` | `{ refresh_token }` | `{ access_token, token_type }` | none |
| POST | `/api/auth/logout` | — | 204 | bearer |
| GET | `/api/auth/me` | — | `User` | bearer/cookie |

## Fleet

| Verb | Path | Query / Body | Response |
|---|---|---|---|
| GET | `/api/fleet/vessels` | `?status=&q=&sort=&direction=&page=&limit=` | `{ items: Vessel[], total, page, limit }` |
| GET | `/api/fleet/vessels/{id}` | — | `Vessel` |
| POST | `/api/fleet/route-optimize` | `{ vesselId, alternatives? }` | `{ vesselId, suggestedRoute[], fuelSavingPct, etaShiftMin, rationale }` |

## Ports

| Verb | Path | Query | Response |
|---|---|---|---|
| GET | `/api/ports` | `?status=&region=` | `Port[]` |
| GET | `/api/ports/{id}` | — | `Port` |
| GET | `/api/ports/search` | `?q=` | `VoyagePort[]` (uses `lon`, not `lng`) |
| GET | `/api/dashboard/congestion` | — | `CongestionDataPoint[]` |

## Risk

| Verb | Path | Body | Response |
|---|---|---|---|
| GET | `/api/risk/alerts` | `?type=&severity=` | `Alert[]` |
| POST | `/api/risk/alerts` | `{ type, severity, title, description, location?, vesselId? }` | `Alert` (201) |
| GET | `/api/risk/regions` | — | `RiskRegion[]` |
| POST | `/api/risk/sanctions/screen` | `{ query, type? }` | `{ matched, hits[], explanation, source, _meta }` |

`POST /api/risk/alerts` requires permission in `{VIEW_ALL, CREATE_ALERT, ESCALATE}`.

## Trade

| Verb | Path | Body | Response |
|---|---|---|---|
| GET | `/api/trade/documents` | `?status=` | `TradeDocument[]` |
| GET | `/api/trade/documents/{id}` | — | `TradeDocument` |
| POST | `/api/trade/documents` | `TradeDocumentCreate` | `TradeDocument` (201) — gated `VIEW_ALL\|CREATE_TRADE\|APPROVE` |
| POST | `/api/trade/documents/{id}/approve` | — | `{ id, status, approvedBy, approvedAt }` — gated `APPROVE` |
| GET | `/api/trade/documents/{id}/contract` | — | `{ id, network, txHash, parties, note }` |

## AGI

| Verb | Path | Body | Response |
|---|---|---|---|
| GET | `/api/agi/decisions` | `?category=&priority=` | `AGIDecision[]` |
| POST | `/api/agi/decisions/{id}/execute` | — | `{ id, executed, executedAt }` — gated `RUN_AGI\|VIEW_ALL` |
| POST | `/api/agi/analyze` | — | `{ runId, decisions[], _meta }` — gated `RUN_AGI\|VIEW_ALL` |
| GET | `/api/agi/model-status` | — | `{ provider, model, proModel, lastRunAt }` |

## Voyages

| Verb | Path | Body | Response |
|---|---|---|---|
| GET | `/api/voyages` | — | `VoyageSummary[]` |
| POST | `/api/voyages` | `VoyageDraft` | `{ id }` (201) |
| POST | `/api/voyages/preview-brief` | `VoyageDraft` | `{ summary, riskBand, riskFactors[] }` |
| GET | `/api/voyages/{id}` | — | `Voyage` |
| GET | `/api/voyages/{id}/live` | — | `VoyageLiveSnapshot` |
| GET | `/api/voyages/{id}/events` | — | `VoyageEvent[]` |
| GET | `/api/voyages/{id}/alerts` | — | `VoyageAlert[]` |
| POST | `/api/voyages/{id}/alerts/{aid}/acknowledge` | — | `{ id, acknowledged: true }` |
| GET | `/api/voyages/{id}/brief` | — | `AIBrief` |
| POST | `/api/voyages/{id}/brief/refresh` | — | `AIBrief` |
| GET | `/api/voyages/{id}/eta-series` | — | `ETASnapshot[]` |
| GET | `/api/voyages/{id}/attribution` | — | `CauseAttribution` |
| GET | `/api/voyages/{id}/milestones` | — | `Milestone[]` |
| GET | `/api/voyages/{id}/insight` | — | `{ insight, _meta }` |
| GET | `/api/voyages/{id}/report` | — | `VoyageReport` |
| POST | `/api/voyages/{id}/chat` | `{ message }` | `{ answer, citations[] }` |
| GET | `/api/voyages/{id}/stream` | — | text/event-stream of `{ kind, payload }` |
| GET | `/api/ships/lookup` | `?imo=` | `{ matched, ship? }` |

## Dashboard

| Verb | Path | Response |
|---|---|---|
| GET | `/api/dashboard/kpis` | `{ activeVessels, atPort, delayed, flagged, anchored, totalVessels, congestionPct, riskAlerts, tradeVolumeBn, co2SavedTons, uptimePct }` |
| GET | `/api/dashboard/risk-snapshot` | `{ counts: {critical,high,medium,low}, top: Alert[] }` |
| GET | `/api/dashboard/agi-feed` | `AGIDecision[]` |

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `validation_error` | 422 | Request payload failed Pydantic validation |
| `unauthorized` | 401 | Missing or invalid token / cookie |
| `forbidden` | 403 | Token valid, role lacks permission |
| `not_found` | 404 | Entity not found |
| `conflict` | 409 | Duplicate / state conflict (e.g., re-approve, double-execute) |
| `provider_error` | 502 | Vertex AI or external adapter failed |
| `internal` | 500 | Uncaught server-side error |

## Examples

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admiral@glimmora.com","password":"demo"}'
```

### Voyage brief (cookie-auth)
```bash
COOKIE='glimmora_session=%7B%22role%22%3A%22executive%22%2C%22id%22%3A%22u001%22%7D'
curl -H "Cookie: $COOKIE" http://localhost:8000/api/voyages/v_001/brief
```

### Sanctions screen
```bash
curl -X POST http://localhost:8000/api/risk/sanctions/screen \
  -H 'Content-Type: application/json' \
  -H "Cookie: $COOKIE" \
  -d '{"query":"MV Volga Express","type":"vessel"}'
```

The full schemas are auto-generated and visible at `http://localhost:8000/api/docs`.
