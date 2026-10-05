"""Voyage state machine.

draft  → ready  → active  → in_transit  → approaching_destination
                                            ↘  delayed  ↗
                                                       → completed → archived

State transitions are explicit: services must call `transition()` rather than
mutating `voyage.status` directly. Each transition writes a
`voyage_state_transitions` row.

Backwards compatibility: legacy values like `created/departed/approaching/docked`
are mapped onto the new states for read APIs and accepted as inputs.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.ext.asyncio import AsyncSession

from ...errors import APIError
from .models import Voyage, VoyageStateTransition


VALID_STATES: set[str] = {
    "draft",
    "ready",
    "active",
    "in_transit",
    "approaching_destination",
    "delayed",
    "completed",
    "archived",
}

# Transitions allowed (from -> {to, ...})
TRANSITIONS: dict[str, set[str]] = {
    "draft": {"ready", "active", "archived"},
    "ready": {"active", "draft", "archived"},
    "active": {"in_transit", "delayed", "completed", "archived"},
    "in_transit": {"approaching_destination", "delayed", "completed", "archived"},
    "approaching_destination": {"completed", "delayed", "archived"},
    "delayed": {"in_transit", "approaching_destination", "completed", "archived"},
    "completed": {"archived"},
    "archived": set(),
}

# Legacy → canonical mapping (read-side normalisation)
LEGACY_MAP = {
    "created": "draft",
    "departed": "active",
    "approaching": "approaching_destination",
    "docked": "completed",
    "aborted": "archived",
}


def normalise_state(s: str | None) -> str:
    if not s:
        return "draft"
    if s in VALID_STATES:
        return s
    return LEGACY_MAP.get(s, "draft")


def can_transition(from_state: str, to_state: str) -> bool:
    f = normalise_state(from_state)
    if to_state not in VALID_STATES:
        return False
    return to_state in TRANSITIONS.get(f, set())


async def transition(
    db: AsyncSession,
    voyage: Voyage,
    *,
    to_state: str,
    actor: str | None = None,
    note: str | None = None,
) -> VoyageStateTransition:
    current = normalise_state(voyage.status)
    if not can_transition(current, to_state):
        raise APIError(
            "conflict",
            f"Cannot transition voyage from `{current}` to `{to_state}`.",
            status_code=409,
        )
    voyage.status = to_state
    # Phase derivation: align with the existing live snapshot phase semantics.
    if to_state == "approaching_destination":
        voyage.phase = "approach"
    elif to_state == "completed":
        voyage.phase = "docking"
        if not voyage.actual_arrival:
            voyage.actual_arrival = datetime.now(tz=timezone.utc).isoformat()
    elif to_state == "active":
        voyage.phase = "departure"
        if not voyage.actual_departure:
            voyage.actual_departure = datetime.now(tz=timezone.utc).isoformat()
    elif to_state == "in_transit":
        voyage.phase = "in_transit"
    transition = VoyageStateTransition(
        voyage_id=voyage.id,
        from_state=current,
        to_state=to_state,
        actor=actor,
        note=note,
    )
    db.add(transition)
    await db.flush()
    return transition


async def transitions_for(db: AsyncSession, voyage_id: str) -> list[VoyageStateTransition]:
    from sqlalchemy import asc, select
    rows = (
        await db.execute(
            select(VoyageStateTransition)
            .where(VoyageStateTransition.voyage_id == voyage_id)
            .order_by(asc(VoyageStateTransition.ts))
        )
    ).scalars().all()
    return list(rows)
