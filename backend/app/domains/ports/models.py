from __future__ import annotations

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ...db import Base


class Port(Base):
    __tablename__ = "ports"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    country: Mapped[str] = mapped_column(String, nullable=False)
    country_code: Mapped[str] = mapped_column(String, nullable=False)
    unlocode: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    congestion_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    queue_count: Mapped[int] = mapped_column(Integer, nullable=False)
    avg_wait_hours: Mapped[float] = mapped_column(Float, nullable=False)
    throughput_teu: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, index=True)
    region: Mapped[str] = mapped_column(String, nullable=False)


class CongestionPoint(Base):
    __tablename__ = "congestion_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[str] = mapped_column(String, nullable=False, index=True)
    global_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    pacific_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    atlantic_pct: Mapped[int] = mapped_column(Integer, nullable=False)


class PortDirectoryEntry(Base):
    """Lightweight directory used by /voyage/new port autocomplete (separate from
    main `ports` because the search list is broader and uses lat/lon (not lng)."""

    __tablename__ = "ports_directory"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    unlocode: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
