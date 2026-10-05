from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ...db import Base


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class Ship(Base):
    __tablename__ = "ships"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    imo: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    flag: Mapped[str | None] = mapped_column(String, nullable=True)


class Voyage(Base):
    __tablename__ = "voyages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    ship_id: Mapped[str] = mapped_column(String, nullable=False)
    ship_name: Mapped[str] = mapped_column(String, nullable=False)
    ship_imo: Mapped[str | None] = mapped_column(String, nullable=True)
    ship_type: Mapped[str] = mapped_column(String, nullable=False)
    ship_flag: Mapped[str | None] = mapped_column(String, nullable=True)

    origin_id: Mapped[str] = mapped_column(String, nullable=False)
    origin_unlocode: Mapped[str] = mapped_column(String, nullable=False)
    origin_name: Mapped[str] = mapped_column(String, nullable=False)
    origin_country: Mapped[str] = mapped_column(String, nullable=False)
    origin_lat: Mapped[float] = mapped_column(Float, nullable=False)
    origin_lon: Mapped[float] = mapped_column(Float, nullable=False)

    destination_id: Mapped[str] = mapped_column(String, nullable=False)
    destination_unlocode: Mapped[str] = mapped_column(String, nullable=False)
    destination_name: Mapped[str] = mapped_column(String, nullable=False)
    destination_country: Mapped[str] = mapped_column(String, nullable=False)
    destination_lat: Mapped[float] = mapped_column(Float, nullable=False)
    destination_lon: Mapped[float] = mapped_column(Float, nullable=False)

    planned_departure: Mapped[str] = mapped_column(String, nullable=False)
    planned_arrival: Mapped[str | None] = mapped_column(String, nullable=True)
    actual_departure: Mapped[str | None] = mapped_column(String, nullable=True)
    actual_arrival: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, index=True)
    phase: Mapped[str] = mapped_column(String, nullable=False)
    sensitivity: Mapped[str] = mapped_column(String, nullable=False)
    tracking_mode: Mapped[str] = mapped_column(String, nullable=False)
    alert_preference: Mapped[str] = mapped_column(String, nullable=False)
    cargo_priority: Mapped[str | None] = mapped_column(String, nullable=True)
    delay_tolerance_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preferred_route: Mapped[str | None] = mapped_column(String, nullable=True)
    watchlist_company: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    route_planned: Mapped[list] = mapped_column(JSON, nullable=False)  # [{lat,lon}, ...]
    final_risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_conclusion: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class VoyageEvent(Base):
    __tablename__ = "voyage_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    voyage_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, nullable=False)
    ts: Mapped[str] = mapped_column(String, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Source provenance: { name, url?, fetchedAt, confidence, kind: live|derived|mock, excerpt? }
    source: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class VoyageAlert(Base):
    __tablename__ = "voyage_alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    voyage_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    raised_at: Mapped[str] = mapped_column(String, nullable=False)
    resolved_at: Mapped[str | None] = mapped_column(String, nullable=True)
    # New (alongside boolean for backward compat with existing UI consumers):
    # lifecycle: "new" | "acknowledged" | "resolved"
    lifecycle: Mapped[str] = mapped_column(String, default="new", nullable=False, index=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_by: Mapped[str | None] = mapped_column(String, nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    linked_event_id: Mapped[str | None] = mapped_column(String, nullable=True)
    # Triage explanation (auto-generated, one line)
    triage_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Source provenance, same shape as event.source
    source: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class VoyageStateTransition(Base):
    __tablename__ = "voyage_state_transitions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    voyage_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    from_state: Mapped[str | None] = mapped_column(String, nullable=True)
    to_state: Mapped[str] = mapped_column(String, nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    actor: Mapped[str | None] = mapped_column(String, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


class VoyageETASnapshot(Base):
    __tablename__ = "voyage_eta_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    voyage_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    ts: Mapped[str] = mapped_column(String, nullable=False)
    eta: Mapped[str] = mapped_column(String, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    delta_min_from_prev: Mapped[int] = mapped_column(Integer, nullable=False)
    cause: Mapped[str | None] = mapped_column(String, nullable=True)
    # ETA Drift Narrator output: one-line plain-English explanation of *this* snapshot's shift.
    narration: Mapped[str | None] = mapped_column(Text, nullable=True)


class VoyageBriefRow(Base):
    __tablename__ = "voyage_briefs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    voyage_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    prompt_version: Mapped[str] = mapped_column(String, nullable=False)


class VoyageMilestone(Base):
    __tablename__ = "voyage_milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    voyage_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    key: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    planned_ts: Mapped[str] = mapped_column(String, nullable=False)
    actual_ts: Mapped[str | None] = mapped_column(String, nullable=True)
    projected_ts: Mapped[str | None] = mapped_column(String, nullable=True)
    delta_min: Mapped[int | None] = mapped_column(Integer, nullable=True)


class VoyageLiveCache(Base):
    __tablename__ = "voyage_live_state"

    voyage_id: Mapped[str] = mapped_column(String, primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
