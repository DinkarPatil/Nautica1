from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...db import get_db
from ...deps import current_user, require_any_permission, require_permission
from ...domains.auth.schemas import UserOut
from .schemas import (
    TradeApprovalOut,
    TradeContractOut,
    TradeDocumentCreate,
    TradeDocumentOut,
)
from .service import (
    approve_document,
    create_document,
    get_contract,
    get_document,
    list_documents,
)

router = APIRouter(prefix="/api/trade", tags=["trade"])


@router.get("/documents", response_model=list[TradeDocumentOut])
async def documents(
    status: str | None = Query(default=None),
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TradeDocumentOut]:
    return await list_documents(db, status=status)


@router.get("/documents/{did}", response_model=TradeDocumentOut)
async def document_detail(
    did: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TradeDocumentOut:
    return await get_document(db, did)


@router.post(
    "/documents",
    response_model=TradeDocumentOut,
    status_code=201,
    dependencies=[Depends(require_any_permission(["VIEW_ALL", "CREATE_TRADE", "APPROVE"]))],
)
async def documents_create(
    payload: TradeDocumentCreate,
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TradeDocumentOut:
    return await create_document(db, payload=payload, actor_id=user.id)


@router.post(
    "/documents/{did}/approve",
    response_model=TradeApprovalOut,
    dependencies=[Depends(require_permission("APPROVE"))],
)
async def documents_approve(
    did: str,
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TradeApprovalOut:
    return await approve_document(db, did=did, actor_id=user.id)


@router.get("/documents/{did}/contract", response_model=TradeContractOut)
async def documents_contract(
    did: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TradeContractOut:
    return await get_contract(db, did)
