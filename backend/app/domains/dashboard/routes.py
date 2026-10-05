from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...db import get_db
from ...deps import current_user
from ...domains.auth.schemas import UserOut
from .service import agi_feed, kpis, risk_snapshot

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
async def kpis_route(_user: UserOut = Depends(current_user), db: AsyncSession = Depends(get_db)) -> dict:
    return await kpis(db)


@router.get("/risk-snapshot")
async def risk_snapshot_route(_user: UserOut = Depends(current_user), db: AsyncSession = Depends(get_db)) -> dict:
    return await risk_snapshot(db)


@router.get("/agi-feed")
async def agi_feed_route(_user: UserOut = Depends(current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    return await agi_feed(db)
