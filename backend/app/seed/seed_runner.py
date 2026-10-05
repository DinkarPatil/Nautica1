"""Idempotent seed runner. Loads JSON fixtures into the database on startup.

Each entity is loaded only when its table is empty, so repeated boots are cheap.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import session_scope
from ..domains.agi.models import AGIDecision
from ..domains.auth.models import User
from ..domains.auth.password import hash_password
from ..domains.fleet.models import Vessel
from ..domains.ports.models import CongestionPoint, Port, PortDirectoryEntry
from ..domains.risk.models import Alert, RiskRegion
from ..domains.trade.models import TradeDocument
from ..domains.voyage.models import Ship


_DATA = Path(__file__).parent / "data"


def _load(name: str):
    return json.loads((_DATA / name).read_text(encoding="utf-8"))


async def _seed_users(db: AsyncSession) -> None:
    if (await db.execute(select(User.id).limit(1))).first():
        return
    pwd = hash_password("demo")
    for u in _load("users.json"):
        db.add(
            User(
                id=u["id"],
                email=u["email"],
                password_hash=pwd,
                name=u["name"],
                role=u["role"],
                organization=u["organization"],
                avatar=u["avatar"],
            )
        )


async def _seed_vessels(db: AsyncSession) -> None:
    if (await db.execute(select(Vessel.id).limit(1))).first():
        return
    for v in _load("vessels.json"):
        db.add(
            Vessel(
                id=v["id"],
                name=v["name"],
                imo=v["imo"],
                flag=v["flag"],
                flag_emoji=v.get("flagEmoji", ""),
                type=v["type"],
                lat=v["lat"],
                lng=v["lng"],
                speed=v["speed"],
                heading=v["heading"],
                status=v["status"],
                risk_score=v["riskScore"],
                port_of_origin=v["portOfOrigin"],
                port_of_destination=v["portOfDestination"],
                eta=v["eta"],
                cargo=v["cargo"],
                dwt=v["dwt"],
                draught=v["draught"],
                agi_recommendation=v.get("agiRecommendation"),
            )
        )


async def _seed_ports(db: AsyncSession) -> None:
    if (await db.execute(select(Port.id).limit(1))).first():
        return
    for p in _load("ports.json"):
        db.add(
            Port(
                id=p["id"],
                name=p["name"],
                country=p["country"],
                country_code=p["countryCode"],
                unlocode=p["unlocode"],
                lat=p["lat"],
                lng=p["lng"],
                congestion_pct=p["congestionPct"],
                queue_count=p["queueCount"],
                avg_wait_hours=p["avgWaitHours"],
                throughput_teu=p["throughputTEU"],
                status=p["status"],
                region=p["region"],
            )
        )


async def _seed_congestion_history(db: AsyncSession) -> None:
    if (await db.execute(select(CongestionPoint.id).limit(1))).first():
        return
    for c in _load("congestion_history.json"):
        db.add(
            CongestionPoint(
                date=c["date"],
                global_pct=c["global"],
                pacific_pct=c["pacific"],
                atlantic_pct=c["atlantic"],
            )
        )


async def _seed_alerts(db: AsyncSession) -> None:
    if (await db.execute(select(Alert.id).limit(1))).first():
        return
    for a in _load("alerts.json"):
        db.add(
            Alert(
                id=a["id"],
                type=a["type"],
                severity=a["severity"],
                title=a["title"],
                description=a["description"],
                location=a.get("location"),
                vessel_id=a.get("vesselId"),
                timestamp=a["timestamp"],
                is_read=bool(a.get("isRead", False)),
            )
        )


async def _seed_regions(db: AsyncSession) -> None:
    if (await db.execute(select(RiskRegion.id).limit(1))).first():
        return
    for r in _load("risk_regions.json"):
        db.add(RiskRegion(**r))


async def _seed_trades(db: AsyncSession) -> None:
    if (await db.execute(select(TradeDocument.id).limit(1))).first():
        return
    for t in _load("trades.json"):
        db.add(
            TradeDocument(
                id=t["id"],
                type=t["type"],
                title=t["title"],
                vessel_name=t["vesselName"],
                shipper=t["shipper"],
                consignee=t["consignee"],
                port_of_loading=t["portOfLoading"],
                port_of_discharge=t["portOfDischarge"],
                commodity=t["commodity"],
                value=t["value"],
                currency=t["currency"],
                status=t["status"],
                issued_date=t["issuedDate"],
                expiry_date=t.get("expiryDate"),
                smart_contract_hash=t.get("smartContractHash"),
                blockchain_network=t.get("blockchainNetwork"),
            )
        )


async def _seed_agi(db: AsyncSession) -> None:
    if (await db.execute(select(AGIDecision.id).limit(1))).first():
        return
    for d in _load("agi_decisions.json"):
        db.add(
            AGIDecision(
                id=d["id"],
                category=d["category"],
                title=d["title"],
                summary=d["summary"],
                reasoning=d["reasoning"],
                confidence=d["confidence"],
                priority=d["priority"],
                affected_vessels=d.get("affectedVessels") or [],
                affected_ports=d.get("affectedPorts") or [],
                estimated_saving=d.get("estimatedSaving"),
                timestamp=d["timestamp"],
                is_actioned=bool(d.get("isActioned", False)),
            )
        )


async def _seed_ships_and_directory(db: AsyncSession) -> None:
    if not (await db.execute(select(Ship.id).limit(1))).first():
        for s in _load("ships.json"):
            db.add(
                Ship(id=s["id"], name=s["name"], imo=s.get("imo"), type=s["type"], flag=s.get("flag"))
            )
    if not (await db.execute(select(PortDirectoryEntry.id).limit(1))).first():
        for p in _load("port_search.json"):
            db.add(
                PortDirectoryEntry(
                    id=p["id"], unlocode=p["unlocode"], name=p["name"],
                    country=p["country"], lat=p["lat"], lon=p["lon"],
                )
            )


async def _seed_demo_voyage(db: AsyncSession) -> None:
    """Insert a single demo voyage v_001 so /voyage/v_001 always works."""
    from ..domains.voyage.models import Voyage, VoyageEvent, VoyageMilestone, VoyageETASnapshot

    if (await db.execute(select(Voyage.id).limit(1))).first():
        return

    route = [
        {"lat": 36.1408, "lon": -5.4533},
        {"lat": 36.0, "lon": -2.0},
        {"lat": 37.5, "lon": 4.0},
        {"lat": 41.0, "lon": 9.5},
        {"lat": 43.5, "lon": 8.0},
        {"lat": 47.0, "lon": -2.0},
        {"lat": 50.2, "lon": 1.5},
        {"lat": 51.9244, "lon": 4.4777},
    ]
    db.add(
        Voyage(
            id="v_001",
            ship_id="s_falcon",
            ship_name="MV Nordic Falcon",
            ship_imo="9876543",
            ship_type="container",
            ship_flag="BS",
            origin_id="p_alg", origin_unlocode="ESALG", origin_name="Algeciras",
            origin_country="ES", origin_lat=36.1408, origin_lon=-5.4533,
            destination_id="p_rtm", destination_unlocode="NLRTM", destination_name="Rotterdam",
            destination_country="NL", destination_lat=51.9244, destination_lon=4.4777,
            planned_departure="2026-04-26T04:00:00Z",
            planned_arrival="2026-05-02T12:24:00Z",
            actual_departure="2026-04-26T04:12:00Z",
            status="in_transit",
            phase="in_transit",
            sensitivity="strict",
            tracking_mode="realtime",
            alert_preference="full",
            cargo_priority="high",
            delay_tolerance_min=60,
            route_planned=route,
            created_at=datetime.now(tz=timezone.utc),
            updated_at=datetime.now(tz=timezone.utc),
        )
    )

    # Seed events
    events_seed = [
        ("e_1", "departure", "info", "2026-04-26T04:12:00Z", "Departed Algeciras", "Pilot disembarked 04:08 · all cargo manifested"),
        ("e_2", "weather", "warning", "2026-04-29T07:00:00Z", "Weather warning issued", "BF6 expected next 4h, sector E of Sardinia"),
        ("e_3", "speed", "warning", "2026-04-29T09:47:00Z", "Speed reduced to 11.4 kn", "BF6 winds from 240° · master discretion"),
        ("e_4", "route", "info", "2026-04-29T13:42:00Z", "Track 1.2 nm south of plan", "Within tolerance · auto-correcting"),
        ("e_5", "eta", "warning", "2026-04-29T14:08:00Z", "ETA revised +1h 50m", "Congestion forecast: Strait of Bonifacio · 6 vessels queued"),
    ]
    for eid, cat, sev, ts, title, detail in events_seed:
        db.add(VoyageEvent(id=eid, voyage_id="v_001", category=cat, severity=sev, ts=ts, title=title, detail=detail))

    # Seed ETA snapshots
    eta_seed = [
        ("2026-04-26T04:12:00Z", "2026-05-02T12:24:00Z", 0.92, 0, None),
        ("2026-04-29T09:47:00Z", "2026-05-02T13:08:00Z", 0.81, 44, "weather"),
        ("2026-04-29T14:08:00Z", "2026-05-02T14:58:00Z", 0.74, 110, "congestion"),
        ("2026-04-29T18:30:00Z", "2026-05-02T14:38:00Z", 0.78, -20, "weather"),
    ]
    for ts, eta, conf, dmin, cause in eta_seed:
        db.add(VoyageETASnapshot(voyage_id="v_001", ts=ts, eta=eta, confidence=conf, delta_min_from_prev=dmin, cause=cause))

    # Seed milestones
    ms_seed = [
        ("m_dep", "Departure Algeciras", "2026-04-26T04:00:00Z", "2026-04-26T04:12:00Z", None, 12),
        ("m_gib", "Gibraltar transit", "2026-04-26T18:00:00Z", "2026-04-26T18:14:00Z", None, 14),
        ("m_bon", "Bonifacio transit", "2026-04-28T06:30:00Z", "2026-04-28T09:08:00Z", None, 158),
        ("m_app", "Approach Rotterdam", "2026-05-02T12:00:00Z", None, "2026-05-02T14:00:00Z", 120),
        ("m_dock", "Docking Rotterdam", "2026-05-02T12:24:00Z", None, "2026-05-02T14:38:00Z", 134),
    ]
    for k, n, p, a, pj, dmin in ms_seed:
        db.add(VoyageMilestone(voyage_id="v_001", key=k, name=n, planned_ts=p, actual_ts=a, projected_ts=pj, delta_min=dmin))

    # Seed alerts
    from ..domains.voyage.models import VoyageAlert as VA
    alerts_seed = [
        ("a_1", "delay", "warning", "ETA shifted +2h 14m", "Weather + congestion · 14:08 UTC", "2026-04-29T14:08:00Z"),
        ("a_2", "deviation", "info", "Track 1.2 nm south of plan", "Within tolerance · 13:42 UTC", "2026-04-29T13:42:00Z"),
        ("a_3", "weather", "warning", "BF6 winds expected next 4h", "Sector E of Sardinia", "2026-04-29T07:00:00Z"),
    ]
    for aid, cat, sev, title, detail, ts in alerts_seed:
        db.add(VA(id=aid, voyage_id="v_001", category=cat, severity=sev, title=title, detail=detail, raised_at=ts, acknowledged=False))


async def run_seed() -> None:
    async with session_scope() as db:
        await _seed_users(db)
        await _seed_vessels(db)
        await _seed_ports(db)
        await _seed_congestion_history(db)
        await _seed_alerts(db)
        await _seed_regions(db)
        await _seed_trades(db)
        await _seed_agi(db)
        await _seed_ships_and_directory(db)
        await _seed_demo_voyage(db)
