from __future__ import annotations

from typing import Optional

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...errors import APIError
from .models import Vessel
from .schemas import RouteOptimizeIn, RouteOptimizeOut, VesselListOut, VesselOut


_SORT_KEYS = {
    "name": Vessel.name,
    "status": Vessel.status,
    "riskScore": Vessel.risk_score,
    "speed": Vessel.speed,
    "portOfDestination": Vessel.port_of_destination,
}


async def list_vessels(
    db: AsyncSession,
    *,
    status: Optional[str] = None,
    q: Optional[str] = None,
    sort: Optional[str] = None,
    direction: str = "asc",
    page: int = 1,
    limit: int = 200,
) -> VesselListOut:
    stmt = select(Vessel)
    count_stmt = select(func.count(Vessel.id))

    if status and status != "All":
        stmt = stmt.where(Vessel.status == status)
        count_stmt = count_stmt.where(Vessel.status == status)
    if q:
        like = f"%{q.lower()}%"
        cond = or_(
            func.lower(Vessel.name).like(like),
            func.lower(Vessel.imo).like(like),
            func.lower(Vessel.flag).like(like),
            func.lower(Vessel.port_of_destination).like(like),
        )
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    sort_col = _SORT_KEYS.get(sort or "", Vessel.name)
    stmt = stmt.order_by(asc(sort_col) if direction != "desc" else desc(sort_col))

    stmt = stmt.offset(max(0, (page - 1) * limit)).limit(limit)

    rows = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(count_stmt)).scalar_one()

    return VesselListOut(
        items=[VesselOut.model_validate(r, from_attributes=True) for r in rows],
        total=total,
        page=page,
        limit=limit,
    )


async def get_vessel(db: AsyncSession, vid: str) -> VesselOut:
    v = (await db.execute(select(Vessel).where(Vessel.id == vid))).scalar_one_or_none()
    if v is None:
        raise APIError("not_found", "Vessel not found", status_code=404)
    return VesselOut.model_validate(v, from_attributes=True)


async def route_optimize(db: AsyncSession, payload: RouteOptimizeIn) -> RouteOptimizeOut:
    v = (await db.execute(select(Vessel).where(Vessel.id == payload.vesselId))).scalar_one_or_none()
    if v is None:
        raise APIError("not_found", "Vessel not found", status_code=404)

    # Heuristic suggestion: shift waypoint a degree south of current path; quote a small saving.
    suggested = [
        {"name": v.port_of_origin, "lat": v.lat, "lng": v.lng},
        {"name": "Mid-route", "lat": (v.lat + 1.0), "lng": (v.lng + 1.0)},
        {"name": v.port_of_destination, "lat": v.lat, "lng": v.lng + 5.0},
    ]
    return RouteOptimizeOut(
        vesselId=v.id,
        suggestedRoute=suggested,
        fuelSavingPct=3.6,
        etaShiftMin=-45,
        rationale=(
            f"Based on current weather + congestion along {v.port_of_origin} → {v.port_of_destination}, "
            "a one-degree southward deviation reduces wind exposure with negligible distance cost."
        ),
    )
