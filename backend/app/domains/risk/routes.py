from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...db import get_db
from ...deps import current_user, require_any_permission
from ...domains.auth.schemas import UserOut
from .schemas import (
    AlertCreate,
    AlertOut,
    RiskRegionOut,
    SanctionsScreenIn,
    SanctionsScreenOut,
)
from .service import create_alert, list_alerts, list_regions, screen_sanctions

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/alerts", response_model=list[AlertOut])
async def alerts(
    type: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AlertOut]:
    return await list_alerts(db, type_=type, severity=severity)


@router.post(
    "/alerts",
    response_model=AlertOut,
    status_code=201,
    dependencies=[Depends(require_any_permission(["VIEW_ALL", "CREATE_ALERT", "ESCALATE"]))],
)
async def alerts_create(
    payload: AlertCreate,
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> AlertOut:
    return await create_alert(db, payload=payload, actor_id=user.id)


@router.get("/regions", response_model=list[RiskRegionOut])
async def regions(
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[RiskRegionOut]:
    return await list_regions(db)


@router.post("/sanctions/screen", response_model=SanctionsScreenOut)
async def sanctions_screen_route(
    payload: SanctionsScreenIn,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> SanctionsScreenOut:
    return await screen_sanctions(db, payload)
