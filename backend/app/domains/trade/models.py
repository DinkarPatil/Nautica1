from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ...db import Base


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class TradeDocument(Base):
    __tablename__ = "trade_documents"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    vessel_name: Mapped[str] = mapped_column(String, nullable=False)
    shipper: Mapped[str] = mapped_column(String, nullable=False)
    consignee: Mapped[str] = mapped_column(String, nullable=False)
    port_of_loading: Mapped[str] = mapped_column(String, nullable=False)
    port_of_discharge: Mapped[str] = mapped_column(String, nullable=False)
    commodity: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, index=True)
    issued_date: Mapped[str] = mapped_column(String, nullable=False)
    expiry_date: Mapped[str | None] = mapped_column(String, nullable=True)
    smart_contract_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    blockchain_network: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
