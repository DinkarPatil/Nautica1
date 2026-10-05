from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...db import get_db
from ...deps import current_user
from ...domains.auth.schemas import UserOut
from .schemas import RouteOptimizeIn, RouteOptimizeOut, VesselListOut, VesselOut
from .service import get_vessel, list_vessels, route_optimize

router = APIRouter(prefix="/api/fleet", tags=["fleet"])


@router.get("/vessels", response_model=VesselListOut)
async def vessels(
    status: str | None = Query(default=None),
    q: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    direction: str = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=200, ge=1, le=500),
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VesselListOut:
    return await list_vessels(db, status=status, q=q, sort=sort, direction=direction, page=page, limit=limit)


@router.get("/vessels/{vid}", response_model=VesselOut)
async def vessel_detail(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VesselOut:
    return await get_vessel(db, vid)


@router.post("/route-optimize", response_model=RouteOptimizeOut)
async def optimize(
    payload: RouteOptimizeIn,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> RouteOptimizeOut:
    return await route_optimize(db, payload)
