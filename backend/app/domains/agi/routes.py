from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...db import get_db
from ...deps import current_user, require_any_permission
from ...domains.auth.schemas import UserOut
from .schemas import AGIAnalyzeOut, AGIDecisionOut, AGIExecuteOut, AGIModelStatus
from .service import execute_decision, list_decisions, model_status, run_analysis

router = APIRouter(prefix="/api/agi", tags=["agi"])


@router.get("/decisions", response_model=list[AGIDecisionOut])
async def decisions(
    category: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AGIDecisionOut]:
    return await list_decisions(db, category=category, priority=priority)


@router.post(
    "/decisions/{did}/execute",
    response_model=AGIExecuteOut,
    dependencies=[Depends(require_any_permission(["RUN_AGI", "VIEW_ALL"]))],
)
async def execute(
    did: str,
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> AGIExecuteOut:
    return await execute_decision(db, did=did, actor_id=user.id)


@router.post(
    "/analyze",
    response_model=AGIAnalyzeOut,
    dependencies=[Depends(require_any_permission(["RUN_AGI", "VIEW_ALL"]))],
)
async def analyze(
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> AGIAnalyzeOut:
    return await run_analysis(db, actor_id=user.id)


@router.get("/model-status", response_model=AGIModelStatus)
async def status(
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> AGIModelStatus:
    return await model_status(db)
