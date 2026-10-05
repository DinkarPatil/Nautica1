from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ...db import Base


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class Vessel(Base):
    __tablename__ = "vessels"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    imo: Mapped[str] = mapped_column(String, nullable=False, index=True)
    flag: Mapped[str] = mapped_column(String, nullable=False)
    flag_emoji: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    speed: Mapped[float] = mapped_column(Float, nullable=False)
    heading: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, index=True)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    port_of_origin: Mapped[str] = mapped_column(String, nullable=False)
    port_of_destination: Mapped[str] = mapped_column(String, nullable=False)
    eta: Mapped[str] = mapped_column(String, nullable=False)
    cargo: Mapped[str] = mapped_column(String, nullable=False)
    dwt: Mapped[int] = mapped_column(Integer, nullable=False)
    draught: Mapped[float] = mapped_column(Float, nullable=False)
    agi_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
