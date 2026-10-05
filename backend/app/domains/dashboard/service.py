from __future__ import annotations

from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...domains.agi.models import AGIDecision
from ...domains.fleet.models import Vessel
from ...domains.ports.models import Port
from ...domains.risk.models import Alert


async def kpis(db: AsyncSession) -> dict[str, Any]:
    by_status = dict(
        (
            await db.execute(select(Vessel.status, func.count(Vessel.id)).group_by(Vessel.status))
        ).all()
    )
    avg_congestion = (
        await db.execute(select(func.avg(Port.congestion_pct)))
    ).scalar_one()
    alerts_count = (await db.execute(select(func.count(Alert.id)))).scalar_one()

    total_vessels = sum(by_status.values()) or 0

    return {
        "activeVessels": int(by_status.get("En Route", 0)),
        "atPort": int(by_status.get("At Port", 0)),
        "delayed": int(by_status.get("Delayed", 0)),
        "flagged": int(by_status.get("Flagged", 0)),
        "anchored": int(by_status.get("Anchored", 0)),
        "totalVessels": int(total_vessels),
        "congestionPct": int(round(avg_congestion or 0)),
        "riskAlerts": int(alerts_count or 0),
        "tradeVolumeBn": 184.6,  # static for KPI tile (no commodity API in MVP)
        "co2SavedTons": 12480,   # static for KPI tile
        "uptimePct": 99.97,
    }


async def risk_snapshot(db: AsyncSession) -> dict[str, Any]:
    sev_counts = dict(
        (
            await db.execute(select(Alert.severity, func.count(Alert.id)).group_by(Alert.severity))
        ).all()
    )
    top = (
        await db.execute(select(Alert).order_by(desc(Alert.timestamp)).limit(5))
    ).scalars().all()

    return {
        "counts": {
            "critical": int(sev_counts.get("critical", 0)),
            "high": int(sev_counts.get("high", 0)),
            "medium": int(sev_counts.get("medium", 0)),
            "low": int(sev_counts.get("low", 0)),
        },
        "top": [
            {
                "id": a.id, "type": a.type, "severity": a.severity,
                "title": a.title, "description": a.description,
                "location": a.location, "vesselId": a.vessel_id, "timestamp": a.timestamp,
                "isRead": a.is_read,
            }
            for a in top
        ],
    }


async def agi_feed(db: AsyncSession) -> list[dict[str, Any]]:
    rows = (
        await db.execute(select(AGIDecision).order_by(desc(AGIDecision.timestamp)).limit(8))
    ).scalars().all()
    return [
        {
            "id": d.id,
            "category": d.category,
            "title": d.title,
            "summary": d.summary,
            "reasoning": d.reasoning,
            "confidence": d.confidence,
            "priority": d.priority,
            "affectedVessels": d.affected_vessels or [],
            "affectedPorts": d.affected_ports or [],
            "estimatedSaving": d.estimated_saving,
            "timestamp": d.timestamp,
            "isActioned": d.is_actioned,
        }
        for d in rows
    ]
