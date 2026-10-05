from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...errors import APIError
from ...services.audit.log import write_audit
from .models import TradeDocument
from .schemas import TradeApprovalOut, TradeContractOut, TradeDocumentCreate, TradeDocumentOut


async def list_documents(db: AsyncSession, *, status: Optional[str] = None) -> list[TradeDocumentOut]:
    stmt = select(TradeDocument).order_by(desc(TradeDocument.issued_date))
    if status and status != "All":
        stmt = stmt.where(TradeDocument.status == status)
    rows = (await db.execute(stmt)).scalars().all()
    return [TradeDocumentOut.model_validate(r, from_attributes=True) for r in rows]


async def get_document(db: AsyncSession, did: str) -> TradeDocumentOut:
    row = (await db.execute(select(TradeDocument).where(TradeDocument.id == did))).scalar_one_or_none()
    if row is None:
        raise APIError("not_found", "Trade document not found", status_code=404)
    return TradeDocumentOut.model_validate(row, from_attributes=True)


async def create_document(
    db: AsyncSession, *, payload: TradeDocumentCreate, actor_id: str
) -> TradeDocumentOut:
    did = f"t_{uuid.uuid4().hex[:8]}"
    row = TradeDocument(
        id=did,
        type=payload.type,
        title=payload.title,
        vessel_name=payload.vesselName,
        shipper=payload.shipper,
        consignee=payload.consignee,
        port_of_loading=payload.portOfLoading,
        port_of_discharge=payload.portOfDischarge,
        commodity=payload.commodity,
        value=payload.value,
        currency=payload.currency,
        status=payload.status,
        issued_date=payload.issuedDate,
        expiry_date=payload.expiryDate,
    )
    db.add(row)
    await db.flush()
    await write_audit(
        db,
        action="trade.create",
        entity_type="trade_document",
        entity_id=did,
        actor_user_id=actor_id,
        after={"title": payload.title, "value": payload.value, "currency": payload.currency},
    )
    return TradeDocumentOut.model_validate(row, from_attributes=True)


async def approve_document(db: AsyncSession, *, did: str, actor_id: str) -> TradeApprovalOut:
    row = (await db.execute(select(TradeDocument).where(TradeDocument.id == did))).scalar_one_or_none()
    if row is None:
        raise APIError("not_found", "Trade document not found", status_code=404)
    if row.status == "Verified":
        raise APIError("conflict", "Document already verified", status_code=409)
    row.status = "Verified"
    row.approved_by = actor_id
    row.approved_at = datetime.now(tz=timezone.utc)
    await db.flush()
    await write_audit(
        db,
        action="trade.approve",
        entity_type="trade_document",
        entity_id=did,
        actor_user_id=actor_id,
        after={"status": "Verified"},
    )
    return TradeApprovalOut(
        id=row.id, status="Verified", approvedBy=row.approved_by, approvedAt=row.approved_at
    )


async def get_contract(db: AsyncSession, did: str) -> TradeContractOut:
    row = (await db.execute(select(TradeDocument).where(TradeDocument.id == did))).scalar_one_or_none()
    if row is None:
        raise APIError("not_found", "Trade document not found", status_code=404)
    return TradeContractOut(
        id=row.id,
        network=row.blockchain_network,
        txHash=row.smart_contract_hash,
        parties={"shipper": row.shipper, "consignee": row.consignee},
    )
