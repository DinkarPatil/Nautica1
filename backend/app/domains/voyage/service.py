"""Voyage CRUD + read services. AI/derived flows live in their own files."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import asc, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...errors import APIError
from ...services.audit.log import write_audit
from .live import compute_live_snapshot
from .models import (
    Ship,
    Voyage,
    VoyageAlert,
    VoyageETASnapshot,
    VoyageEvent,
    VoyageLiveCache,
    VoyageMilestone,
)
from .narrator import backfill_narrations
from .state_machine import normalise_state, transition
from .schemas import (
    Coordinate,
    ETASnapshot,
    Milestone,
    PortMini,
    PreviewBriefIn,
    PreviewBriefOut,
    AIBriefRiskFactor,
    ShipMini,
    VoyageAlertAck,
    VoyageAlertOut,
    VoyageDraftIn,
    VoyageEventOut,
    VoyageLiveSnapshot,
    VoyageOut,
    VoyageSummary,
)
from ...services.llm.registry import call_llm


# ---------- mappers ----------


def _voyage_to_out(v: Voyage) -> VoyageOut:
    sensitivity_map = {"normal": "normal", "strict": "strict", "critical": "critical"}
    tracking_map = {"realtime": "realtime", "real-time": "realtime", "scheduled": "scheduled", "manual": "manual"}
    alert_map = {
        "full": "full",
        "full intelligence": "full",
        "eta only": "eta_only",
        "eta_only": "eta_only",
        "route only": "route_only",
        "route_only": "route_only",
    }
    return VoyageOut(
        id=v.id,
        ship=ShipMini(id=v.ship_id, name=v.ship_name, imo=v.ship_imo, type=v.ship_type, flag=v.ship_flag),  # type: ignore[arg-type]
        origin=PortMini(
            id=v.origin_id, unlocode=v.origin_unlocode, name=v.origin_name,
            country=v.origin_country, lat=v.origin_lat, lon=v.origin_lon,
        ),
        destination=PortMini(
            id=v.destination_id, unlocode=v.destination_unlocode, name=v.destination_name,
            country=v.destination_country, lat=v.destination_lat, lon=v.destination_lon,
        ),
        plannedDeparture=v.planned_departure,
        plannedArrival=v.planned_arrival,
        actualDeparture=v.actual_departure,
        actualArrival=v.actual_arrival,
        status=normalise_state(v.status),  # type: ignore[arg-type]
        phase=v.phase,  # type: ignore[arg-type]
        sensitivity=sensitivity_map.get(v.sensitivity.lower(), "normal"),  # type: ignore[arg-type]
        trackingMode=tracking_map.get(v.tracking_mode.lower(), "realtime"),  # type: ignore[arg-type]
        alertPreference=alert_map.get(v.alert_preference.lower(), "full"),  # type: ignore[arg-type]
        cargoPriority=v.cargo_priority.lower() if v.cargo_priority else None,  # type: ignore[arg-type]
        delayToleranceMin=v.delay_tolerance_min,
        preferredRoute=v.preferred_route,
        watchlistCompany=v.watchlist_company,
        notes=v.notes,
        routePlanned=[Coordinate(lat=p["lat"], lon=p["lon"]) for p in (v.route_planned or [])],
        createdAt=v.created_at.isoformat() if v.created_at else "",
        updatedAt=v.updated_at.isoformat() if v.updated_at else "",
    )


def _great_circle_route(o: dict, d: dict, n: int = 6) -> list[dict]:
    """Cheap rhumb-line interpolation between origin and destination."""
    return [
        {"lat": o["lat"] + (d["lat"] - o["lat"]) * (i / n), "lon": o["lon"] + (d["lon"] - o["lon"]) * (i / n)}
        for i in range(n + 1)
    ]


def _normalize_sensitivity(v: str) -> str:
    return {"normal": "normal", "strict": "strict", "critical": "critical"}.get(v.strip().lower(), "normal")


def _normalize_tracking(v: str) -> str:
    return {"real-time": "realtime", "realtime": "realtime", "scheduled": "scheduled", "manual": "manual"}.get(
        v.strip().lower(), "realtime"
    )


def _normalize_alerts(v: str) -> str:
    return {
        "full intelligence": "full",
        "full": "full",
        "eta only": "eta_only",
        "eta_only": "eta_only",
        "route only": "route_only",
        "route_only": "route_only",
    }.get(v.strip().lower(), "full")


def _normalize_priority(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    return {"standard": "standard", "high": "high", "critical": "critical"}.get(v.strip().lower())


def _normalize_voyage_type(v: str) -> str:
    return {"cargo": "cargo", "container": "container", "tanker": "tanker", "other": "other"}.get(
        v.strip().lower(), "container"
    )


# ---------- CRUD ----------


async def list_voyages(db: AsyncSession) -> list[VoyageSummary]:
    rows = (await db.execute(select(Voyage).order_by(desc(Voyage.updated_at)))).scalars().all()
    out: list[VoyageSummary] = []
    for v in rows:
        live = await compute_live_snapshot(db, v)
        out.append(
            VoyageSummary(
                id=v.id,
                ship=ShipMini(id=v.ship_id, name=v.ship_name, imo=v.ship_imo, type=v.ship_type, flag=v.ship_flag),  # type: ignore[arg-type]
                origin=PortMini(
                    id=v.origin_id, unlocode=v.origin_unlocode, name=v.origin_name,
                    country=v.origin_country, lat=v.origin_lat, lon=v.origin_lon,
                ),
                destination=PortMini(
                    id=v.destination_id, unlocode=v.destination_unlocode, name=v.destination_name,
                    country=v.destination_country, lat=v.destination_lat, lon=v.destination_lon,
                ),
                status=v.status,  # type: ignore[arg-type]
                phase=v.phase,  # type: ignore[arg-type]
                progressPct=live.progressPct,
                etaDeltaMin=live.etaDeltaMin,
                riskBand=live.riskBand,
                updatedAt=v.updated_at.isoformat() if v.updated_at else "",
            )
        )
    # sort: in_transit/delayed first by absolute eta delta, completed last
    def _key(s: VoyageSummary) -> tuple:
        bucket = 0 if s.status in ("in_transit", "approaching") else (1 if s.status == "departed" else 2)
        return (bucket, -abs(s.etaDeltaMin))
    out.sort(key=_key)
    return out


async def get_voyage(db: AsyncSession, vid: str) -> Voyage:
    v = (await db.execute(select(Voyage).where(Voyage.id == vid))).scalar_one_or_none()
    if v is None:
        raise APIError("not_found", "Voyage not found", status_code=404)
    return v


async def get_voyage_out(db: AsyncSession, vid: str) -> VoyageOut:
    return _voyage_to_out(await get_voyage(db, vid))


async def list_events(db: AsyncSession, vid: str) -> list[VoyageEventOut]:
    rows = (
        await db.execute(
            select(VoyageEvent).where(VoyageEvent.voyage_id == vid).order_by(desc(VoyageEvent.ts)).limit(200)
        )
    ).scalars().all()
    out: list[VoyageEventOut] = []
    for e in rows:
        out.append(
            VoyageEventOut(
                id=e.id, voyageId=e.voyage_id, category=e.category, severity=e.severity,
                ts=e.ts, title=e.title, detail=e.detail,
                position=Coordinate(**e.position) if e.position else None,
                meta=e.meta,
                source=e.source,  # type: ignore[arg-type]
            )
        )
    return out


async def list_alerts(db: AsyncSession, vid: str) -> list[VoyageAlertOut]:
    rows = (
        await db.execute(select(VoyageAlert).where(VoyageAlert.voyage_id == vid).order_by(desc(VoyageAlert.raised_at)))
    ).scalars().all()
    out: list[VoyageAlertOut] = []
    for a in rows:
        # Lifecycle column may be unset on legacy rows — derive it.
        lifecycle = a.lifecycle or ("resolved" if a.resolved_at else ("acknowledged" if a.acknowledged else "new"))
        out.append(
            VoyageAlertOut(
                id=a.id, voyageId=a.voyage_id, category=a.category, severity=a.severity,
                title=a.title, detail=a.detail, raisedAt=a.raised_at, resolvedAt=a.resolved_at,
                acknowledged=a.acknowledged,
                lifecycle=lifecycle,  # type: ignore[arg-type]
                confidence=a.confidence,
                linkedEventId=a.linked_event_id,
                triageNote=a.triage_note,
                source=a.source,  # type: ignore[arg-type]
            )
        )
    return out


async def ack_alert(db: AsyncSession, *, voyage_id: str, alert_id: str, actor_id: str) -> VoyageAlertAck:
    row = (
        await db.execute(
            select(VoyageAlert).where(VoyageAlert.id == alert_id, VoyageAlert.voyage_id == voyage_id)
        )
    ).scalar_one_or_none()
    if row is None:
        raise APIError("not_found", "Alert not found", status_code=404)
    if row.lifecycle == "resolved":
        raise APIError("conflict", "Alert is already resolved", status_code=409)
    row.acknowledged = True
    row.acknowledged_at = datetime.now(tz=timezone.utc)
    row.acknowledged_by = actor_id
    if row.lifecycle != "resolved":
        row.lifecycle = "acknowledged"
    await db.flush()
    await write_audit(
        db,
        action="voyage_alert.ack",
        entity_type="voyage_alert",
        entity_id=alert_id,
        actor_user_id=actor_id,
    )
    return VoyageAlertAck(id=alert_id)


async def resolve_alert(db: AsyncSession, *, voyage_id: str, alert_id: str, actor_id: str):
    from .schemas import VoyageAlertResolve

    row = (
        await db.execute(
            select(VoyageAlert).where(VoyageAlert.id == alert_id, VoyageAlert.voyage_id == voyage_id)
        )
    ).scalar_one_or_none()
    if row is None:
        raise APIError("not_found", "Alert not found", status_code=404)
    if row.lifecycle == "resolved":
        raise APIError("conflict", "Alert is already resolved", status_code=409)
    now = datetime.now(tz=timezone.utc)
    row.resolved_at = now.isoformat()
    row.resolved_by = actor_id
    row.lifecycle = "resolved"
    if not row.acknowledged:
        row.acknowledged = True
        row.acknowledged_at = now
        row.acknowledged_by = actor_id
    await db.flush()
    await write_audit(
        db,
        action="voyage_alert.resolve",
        entity_type="voyage_alert",
        entity_id=alert_id,
        actor_user_id=actor_id,
    )
    return VoyageAlertResolve(id=alert_id, resolvedAt=row.resolved_at)


async def start_voyage(db: AsyncSession, *, voyage_id: str, actor_id: str):
    """Move a voyage from draft/ready into active."""
    voyage = await get_voyage(db, voyage_id)
    current = normalise_state(voyage.status)
    target = "active"
    if current == "active":
        # Already started — idempotent.
        target = "in_transit" if "in_transit" in {"in_transit"} else "active"
    if current in {"in_transit", "approaching_destination", "delayed", "completed", "archived"}:
        raise APIError(
            "conflict",
            f"Voyage already {current}; cannot start again.",
            status_code=409,
        )
    t = await transition(db, voyage, to_state="active", actor=actor_id, note="start_voyage")
    await write_audit(
        db,
        action="voyage.start",
        entity_type="voyage",
        entity_id=voyage.id,
        actor_user_id=actor_id,
        after={"state": "active"},
    )
    return voyage, t


async def list_eta_series(db: AsyncSession, vid: str) -> list[ETASnapshot]:
    rows = (
        await db.execute(
            select(VoyageETASnapshot).where(VoyageETASnapshot.voyage_id == vid).order_by(asc(VoyageETASnapshot.ts))
        )
    ).scalars().all()
    # Auto-narrate any rows that don't have narration yet.
    needs_narration = [r for r in rows if not r.narration]
    if needs_narration:
        await backfill_narrations(db, vid, list(rows))
    return [
        ETASnapshot(
            ts=r.ts, eta=r.eta, confidence=r.confidence,
            deltaMinFromPrev=r.delta_min_from_prev, cause=r.cause,
            narration=r.narration,
        )
        for r in rows
    ]


async def list_milestones(db: AsyncSession, vid: str) -> list[Milestone]:
    rows = (
        await db.execute(
            select(VoyageMilestone).where(VoyageMilestone.voyage_id == vid).order_by(asc(VoyageMilestone.planned_ts))
        )
    ).scalars().all()
    return [
        Milestone(
            key=r.key, name=r.name, plannedTs=r.planned_ts, actualTs=r.actual_ts,
            projectedTs=r.projected_ts, deltaMin=r.delta_min,
        )
        for r in rows
    ]


# ---------- Live read with cache ----------


async def get_or_refresh_live(db: AsyncSession, vid: str) -> VoyageLiveSnapshot:
    v = await get_voyage(db, vid)
    snap = await compute_live_snapshot(db, v)

    # Persist as cache row
    cache = (
        await db.execute(select(VoyageLiveCache).where(VoyageLiveCache.voyage_id == vid))
    ).scalar_one_or_none()
    if cache is None:
        db.add(VoyageLiveCache(voyage_id=vid, payload=snap.model_dump()))
    else:
        cache.payload = snap.model_dump()
        cache.updated_at = datetime.now(tz=timezone.utc)
    await db.flush()
    return snap


# ---------- Create voyage ----------


async def create_voyage(db: AsyncSession, *, draft: VoyageDraftIn, actor_id: str) -> str:
    if draft.origin is None or draft.destination is None:
        raise APIError("validation_error", "origin and destination are required", status_code=422)
    if not draft.plannedDeparture:
        raise APIError("validation_error", "plannedDeparture is required", status_code=422)

    vid = f"v_{uuid.uuid4().hex[:8]}"

    ship_id = f"s_{uuid.uuid4().hex[:6]}"
    if draft.imo:
        existing = (await db.execute(select(Ship).where(Ship.imo == draft.imo))).scalar_one_or_none()
        if existing:
            ship_id = existing.id
        else:
            db.add(Ship(id=ship_id, name=draft.shipName, imo=draft.imo, type=_normalize_voyage_type(draft.voyageType), flag=None))
    else:
        db.add(Ship(id=ship_id, name=draft.shipName, imo=None, type=_normalize_voyage_type(draft.voyageType), flag=None))

    o = draft.origin
    d = draft.destination
    route = _great_circle_route({"lat": o.lat, "lon": o.lon}, {"lat": d.lat, "lon": d.lon}, n=8)

    delay_tol = None
    if draft.delayToleranceMin:
        try:
            delay_tol = int(str(draft.delayToleranceMin).strip())
        except ValueError:
            delay_tol = None

    voyage = Voyage(
        id=vid,
        ship_id=ship_id,
        ship_name=draft.shipName,
        ship_imo=draft.imo,
        ship_type=_normalize_voyage_type(draft.voyageType),
        ship_flag=None,
        origin_id=o.id, origin_unlocode=o.unlocode, origin_name=o.name,
        origin_country=o.country, origin_lat=o.lat, origin_lon=o.lon,
        destination_id=d.id, destination_unlocode=d.unlocode, destination_name=d.name,
        destination_country=d.country, destination_lat=d.lat, destination_lon=d.lon,
        planned_departure=draft.plannedDeparture,
        planned_arrival=draft.plannedArrival,
        actual_departure=draft.plannedDeparture,
        status="draft",
        phase="departure",
        sensitivity=_normalize_sensitivity(draft.sensitivity),
        tracking_mode=_normalize_tracking(draft.trackingMode),
        alert_preference=_normalize_alerts(draft.alertPreference),
        cargo_priority=_normalize_priority(draft.cargoPriority),
        delay_tolerance_min=delay_tol,
        preferred_route=draft.preferredRoute,
        watchlist_company=draft.watchlistCompany,
        notes=draft.notes,
        route_planned=route,
        created_by=actor_id,
    )
    db.add(voyage)
    await db.flush()

    # State machine: draft → ready (validation passed) → active (auto-start).
    # The user only interacts at "the very start", so we auto-progress here.
    await transition(db, voyage, to_state="ready", actor=actor_id, note="validation passed")
    await transition(db, voyage, to_state="active", actor=actor_id, note="auto-start on create")
    await transition(db, voyage, to_state="in_transit", actor=actor_id, note="tracking begun")

    # Seed a departure event so the timeline has a root.
    now_iso = datetime.now(tz=timezone.utc).isoformat()
    db.add(
        VoyageEvent(
            id=f"e_{uuid.uuid4().hex[:8]}",
            voyage_id=vid,
            category="departure",
            severity="info",
            ts=draft.plannedDeparture,
            title=f"Departed {o.name}",
            detail=f"Voyage {vid} created and tracking begun",
            source={
                "name": "GlimmoraNautica voyage state machine",
                "url": None,
                "fetchedAt": now_iso,
                "confidence": 1.0,
                "kind": "derived",
                "excerpt": "Auto-generated departure event on voyage creation.",
            },
        )
    )

    # Seed milestones (departure, mid, arrival) — adjust later as voyage matures.
    db.add(VoyageMilestone(voyage_id=vid, key="m_dep", name=f"Departure {o.name}", planned_ts=draft.plannedDeparture, actual_ts=draft.plannedDeparture, delta_min=0))
    if draft.plannedArrival:
        db.add(VoyageMilestone(voyage_id=vid, key="m_arr", name=f"Arrival {d.name}", planned_ts=draft.plannedArrival, projected_ts=draft.plannedArrival, delta_min=0))

    await db.flush()
    await write_audit(
        db,
        action="voyage.create",
        entity_type="voyage",
        entity_id=vid,
        actor_user_id=actor_id,
        after={"shipName": draft.shipName, "origin": o.unlocode, "destination": d.unlocode, "state": "in_transit"},
    )

    return vid


# ---------- Ship lookup ----------


async def lookup_ship(db: AsyncSession, imo: str) -> dict:
    s = (await db.execute(select(Ship).where(Ship.imo == imo))).scalars().first()
    if s is None:
        return {"matched": False}
    return {"matched": True, "ship": {"name": s.name, "type": s.type, "flag": s.flag or ""}}


# ---------- Preview brief (voyage/new sidebar) ----------


_PREVIEW_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "riskBand": {"type": "string", "enum": ["low", "medium", "high"]},
        "riskFactors": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "key": {"type": "string", "enum": ["weather", "traffic", "routing"]},
                    "value": {"type": "integer", "minimum": 0, "maximum": 100},
                },
                "required": ["key", "value"],
            },
        },
    },
    "required": ["summary", "riskBand", "riskFactors"],
}


async def preview_brief(db: AsyncSession, draft: PreviewBriefIn) -> PreviewBriefOut:
    o = draft.origin
    d = draft.destination
    if o is None or d is None:
        raise APIError("validation_error", "origin and destination required", status_code=422)
    body = (
        f"Draft voyage: {draft.shipName} ({draft.voyageType}); "
        f"{o.name} ({o.unlocode}) → {d.name} ({d.unlocode}); "
        f"departs {draft.plannedDeparture}, arrives {draft.plannedArrival or 'unspecified'}; "
        f"sensitivity={draft.sensitivity}, alerts={draft.alertPreference}, cargo={draft.cargoPriority}. "
        "Produce JSON: {summary, riskBand, riskFactors[]}."
    )
    parsed, _meta = await call_llm(
        db,
        prompt_name="voyage_assistant_preview",
        prompt_version="v1",
        prompt_body=body,
        schema=_PREVIEW_SCHEMA,
        note=f"draft={o.unlocode}->{d.unlocode}",
    )
    factors = []
    for f in parsed.get("riskFactors") or []:
        if isinstance(f, dict) and f.get("key") in ("weather", "traffic", "routing"):
            factors.append(AIBriefRiskFactor(key=f["key"], value=int(f.get("value", 30))))
    if not factors:
        factors = [
            AIBriefRiskFactor(key="weather", value=30),
            AIBriefRiskFactor(key="traffic", value=25),
            AIBriefRiskFactor(key="routing", value=15),
        ]
    return PreviewBriefOut(
        summary=parsed.get("summary", "Draft is consistent."),
        riskBand=parsed.get("riskBand", "low"),  # type: ignore[arg-type]
        riskFactors=factors,
    )
