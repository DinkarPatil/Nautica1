from __future__ import annotations

from typing import Optional

from sqlalchemy import asc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...errors import APIError
from .models import CongestionPoint, Port, PortDirectoryEntry
from .schemas import CongestionPointOut, PortOut, VoyagePortOut


async def list_ports(db: AsyncSession, *, status: Optional[str] = None, region: Optional[str] = None) -> list[PortOut]:
    stmt = select(Port).order_by(asc(Port.name))
    if status and status != "All":
        stmt = stmt.where(Port.status == status)
    if region:
        stmt = stmt.where(Port.region == region)
    rows = (await db.execute(stmt)).scalars().all()
    return [PortOut.model_validate(r, from_attributes=True) for r in rows]


async def get_port(db: AsyncSession, pid: str) -> PortOut:
    p = (await db.execute(select(Port).where(Port.id == pid))).scalar_one_or_none()
    if p is None:
        raise APIError("not_found", "Port not found", status_code=404)
    return PortOut.model_validate(p, from_attributes=True)


async def congestion_history(db: AsyncSession) -> list[CongestionPointOut]:
    rows = (await db.execute(select(CongestionPoint).order_by(asc(CongestionPoint.id)))).scalars().all()
    out: list[CongestionPointOut] = []
    for r in rows:
        out.append(CongestionPointOut(date=r.date, global_=r.global_pct, pacific=r.pacific_pct, atlantic=r.atlantic_pct))  # type: ignore[arg-type]
    return out


async def search_ports(db: AsyncSession, q: str, *, limit: int = 8) -> list[VoyagePortOut]:
    """Backed by the directory table (broader than `ports`).

    Empty `q` returns the first `limit` entries (sorted by name) — matches the
    mock `voyageApi.searchPorts("")` behavior.
    """
    stmt = select(PortDirectoryEntry).order_by(asc(PortDirectoryEntry.name)).limit(limit)
    needle = (q or "").strip().lower()
    if needle:
        like = f"%{needle}%"
        stmt = (
            select(PortDirectoryEntry)
            .where(
                or_(
                    func.lower(PortDirectoryEntry.name).like(like),
                    func.lower(PortDirectoryEntry.unlocode).like(like),
                    func.lower(PortDirectoryEntry.country).like(like),
                )
            )
            .order_by(asc(PortDirectoryEntry.name))
            .limit(limit)
        )
    rows = (await db.execute(stmt)).scalars().all()
    return [VoyagePortOut.model_validate(r, from_attributes=True) for r in rows]
