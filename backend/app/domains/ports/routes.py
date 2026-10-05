from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...db import get_db
from ...deps import current_user
from ...domains.auth.schemas import UserOut
from .schemas import CongestionPointOut, PortOut, VoyagePortOut
from .service import congestion_history, get_port, list_ports, search_ports

router = APIRouter(prefix="/api", tags=["ports"])


@router.get("/ports", response_model=list[PortOut])
async def ports(
    status: str | None = Query(default=None),
    region: str | None = Query(default=None),
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PortOut]:
    return await list_ports(db, status=status, region=region)


@router.get("/ports/search", response_model=list[VoyagePortOut])
async def ports_search(
    q: str = Query(default=""),
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[VoyagePortOut]:
    return await search_ports(db, q)


@router.get("/ports/{pid}", response_model=PortOut)
async def port_detail(
    pid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> PortOut:
    return await get_port(db, pid)


@router.get("/dashboard/congestion", response_model=list[CongestionPointOut])
async def dashboard_congestion(
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CongestionPointOut]:
    return await congestion_history(db)
