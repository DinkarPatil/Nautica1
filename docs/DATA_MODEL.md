# Data Model

> Conceptual schema. SQLite in dev, Postgres in prod. Field types are SQLite-compatible; Alembic upgrades convert to native Postgres types where it matters.

---

## Entities

### users
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | u001 … u999 |
| email | TEXT unique | login key |
| password_hash | TEXT | bcrypt |
| name | TEXT | |
| role | TEXT | one of `ai_core, executive, fleet_ops, trade_intel, risk_intel, port_ops` |
| organization | TEXT | |
| avatar | TEXT | initials |
| created_at | TIMESTAMP | |
| last_login_at | TIMESTAMP | |

### auth_events
| Column | Type | Notes |
|---|---|---|
| id | INT PK auto | |
| user_id | TEXT FK users(id) | nullable when login fails |
| email | TEXT | |
| action | TEXT | `login`, `refresh`, `logout` |
| success | BOOL | |
| ip / user_agent / ts | meta | |

### vessels
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | v001 … v100 (seed) |
| name, imo, flag, flag_emoji, type | TEXT | |
| lat, lng, speed | REAL | last known telemetry |
| heading | INT | degrees |
| status | TEXT | `En Route, At Port, Delayed, Flagged, Anchored` |
| risk_score | INT | 0–100 |
| port_of_origin, port_of_destination | TEXT | |
| eta | TEXT | ISO date |
| cargo, agi_recommendation | TEXT | |
| dwt, draught | INT/REAL | |
| updated_at | TIMESTAMP | |

### ports
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | p001 … p020 |
| name, country, country_code, region | TEXT | |
| unlocode | TEXT unique | |
| lat, lng | REAL | |
| congestion_pct, queue_count, throughput_teu | INT | |
| avg_wait_hours | REAL | |
| status | TEXT | `Operational, Congested, Critical, Maintenance` |

### congestion_points
| Column | Type | Notes |
|---|---|---|
| id | INT PK auto | |
| date | TEXT | "Mar 30" etc. |
| global_pct, pacific_pct, atlantic_pct | INT | |

### ports_directory (separate from ports — broader autocomplete)
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | p_alg, p_rtm, … |
| unlocode | TEXT unique | |
| name, country | TEXT | |
| lat, lon | REAL | uses `lon` not `lng` to match voyage shape |

### alerts
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | a001 … |
| type | TEXT | `sanctions, weather, geopolitical, route, cyber` |
| severity | TEXT | `critical, high, medium, low` |
| title, description, location | TEXT | |
| vessel_id | TEXT | optional FK |
| timestamp | TEXT | ISO |
| is_read | BOOL | |

### risk_regions
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | rr_redsea etc. |
| name, summary | TEXT | |
| lat, lng | REAL | |
| level | TEXT | `critical, high, medium, low` |

### sanctions_screens
| Column | Type | Notes |
|---|---|---|
| id | INT PK auto | |
| query, type | TEXT | |
| matched | BOOL | |
| hits | JSON | normalized hit list |
| explanation | TEXT | AI-generated |
| source | TEXT | `opensanctions, offline` |
| model, prompt_version | TEXT | provenance |
| generated_at | TIMESTAMP | |

### trade_documents
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | t001 … |
| type | TEXT | `Bill of Lading`, etc. |
| title, vessel_name, shipper, consignee | TEXT | |
| port_of_loading, port_of_discharge, commodity | TEXT | |
| value | REAL | |
| currency | TEXT | |
| status | TEXT | `Pending, Processed, Verified, Flagged` |
| issued_date, expiry_date | TEXT | ISO date |
| smart_contract_hash, blockchain_network | TEXT | opaque |
| approved_by | TEXT | user id |
| approved_at | TIMESTAMP | |

### agi_runs
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | r_xxxxx |
| kind | TEXT | `fleet_analysis` |
| status | TEXT | `ok, error` |
| created_at, finished_at | TIMESTAMP | |
| model, prompt_version | TEXT | provenance |
| summary, triggered_by | TEXT | |

### agi_decisions
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | agi001 … |
| run_id | TEXT FK agi_runs(id) | nullable for seed records |
| category, priority | TEXT | |
| title, summary, reasoning | TEXT | |
| confidence | INT | 0–100 |
| affected_vessels, affected_ports | JSON | array of ids |
| estimated_saving | TEXT | human-readable |
| timestamp | TEXT | ISO |
| is_actioned | BOOL | |
| actioned_at, actioned_by | TIMESTAMP/TEXT | audit |

### voyage tree

#### ships
| id PK | name | imo unique | type | flag |

#### voyages
Holds a denormalized snapshot of ship + origin/destination ports for quick reads. Full fields:

`id, ship_id, ship_name, ship_imo, ship_type, ship_flag,
 origin_id/unlocode/name/country/lat/lon,
 destination_id/unlocode/name/country/lat/lon,
 planned_departure, planned_arrival, actual_departure, actual_arrival,
 status, phase, sensitivity, tracking_mode, alert_preference,
 cargo_priority, delay_tolerance_min, preferred_route, watchlist_company,
 notes, route_planned (JSON), final_risk_score, ai_conclusion,
 created_by, created_at, updated_at`

#### voyage_events
`id, voyage_id, category, severity, ts, title, detail, position?, meta?`

#### voyage_alerts
`id, voyage_id, category, severity, title, detail, raised_at, resolved_at?, acknowledged, acknowledged_at?, acknowledged_by?`

#### voyage_eta_snapshots
`id, voyage_id, ts, eta, confidence, delta_min_from_prev, cause?`

#### voyage_briefs
`id, voyage_id, generated_at, payload (JSON), model, prompt_version`

#### voyage_milestones
`id, voyage_id, key, name, planned_ts, actual_ts?, projected_ts?, delta_min?`

#### voyage_live_state (cache)
`voyage_id PK, payload (JSON), updated_at`

### audit_log (cross-domain)
`id, actor_user_id?, action, entity_type, entity_id?, before?, after?, ts, ip?, note?`

### ai_calls (LLM call log)
`id, prompt_name, prompt_version, model, request_hash, latency_ms,
 prompt_tokens, completion_tokens, status, error_code?, raw_response?, parsed?, ts`

---

## Lifecycle States

| Entity | States | Transitions |
|---|---|---|
| voyage | `created → in_transit → approaching → docked → completed`; or `aborted` | seed comes in `in_transit`; no auto-transition logic in MVP |
| voyage_alert | `unack → acknowledged` | manual `POST .../acknowledge` |
| trade_document | `Pending → Verified` (via approve) — also `Processed`, `Flagged` (set on create) | `POST .../approve` flips to `Verified` |
| agi_decision | `unactioned → actioned` | `POST .../execute` flips |
| sanctions_screens | append-only — every screen produces a new row | n/a |

## Audit & Traceability

- Every mutating endpoint writes an `audit_log` row with actor, before/after.
- Every Vertex AI call writes an `ai_calls` row (hashes prompt body for fingerprinting).
- Every voyage AI brief is persisted in `voyage_briefs` so the report can replay history.

## Relationships (informal)

```
users (1) ──< auth_events
users (1) ──< audit_log (actor)
voyages (1) ──< voyage_events
voyages (1) ──< voyage_alerts
voyages (1) ──< voyage_eta_snapshots
voyages (1) ──< voyage_milestones
voyages (1) ──< voyage_briefs
voyages (1) ─── voyage_live_state (1)
voyages (n) >── ships (1)
voyages (n) >── ports_directory (origin)
voyages (n) >── ports_directory (destination)
agi_runs (1) ──< agi_decisions
```
