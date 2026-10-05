"""Voyage Readiness Score — deterministic.

Computed from a draft (or a saved voyage) without writing anything. Drives the
"can we start tracking?" decision on the voyage create page.

Score breakdown (max 100):
- vessel identity:    25
- origin / destination present + valid coords:  25
- planned departure timestamp present + parseable + future-ish: 15
- planned arrival timestamp present:            10
- monitoring fields (sensitivity / alerts):     10
- route preview computable (origin != destination):  15
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .schemas import ReadinessFactor, ReadinessOut, VoyageDraftIn


def _parse_iso(s: str | None) -> datetime | None:
    if not s:
        return None
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _band(score: int) -> str:
    if score >= 80:
        return "green"
    if score >= 50:
        return "amber"
    return "red"


def compute_readiness(draft: VoyageDraftIn) -> ReadinessOut:
    factors: list[ReadinessFactor] = []
    score = 0

    # Vessel
    if draft.shipName and len(draft.shipName.strip()) >= 2:
        score += 15
        factors.append(ReadinessFactor(field="shipName", status="ok", note="Ship name supplied"))
    else:
        factors.append(ReadinessFactor(field="shipName", status="missing", note="Ship name required to start tracking"))
    if draft.imo and len(draft.imo.strip()) >= 7:
        score += 10
        factors.append(ReadinessFactor(field="imo", status="ok", note="IMO number recorded"))
    else:
        factors.append(ReadinessFactor(field="imo", status="warn", note="No IMO supplied — vessel match confidence reduced"))

    # Ports
    if draft.origin is not None:
        score += 12
        factors.append(ReadinessFactor(field="origin", status="ok", note=f"Origin {draft.origin.unlocode} validated"))
    else:
        factors.append(ReadinessFactor(field="origin", status="missing", note="Origin port required"))
    if draft.destination is not None:
        score += 13
        factors.append(ReadinessFactor(field="destination", status="ok", note=f"Destination {draft.destination.unlocode} validated"))
    else:
        factors.append(ReadinessFactor(field="destination", status="missing", note="Destination port required"))

    # Schedule
    pd = _parse_iso(draft.plannedDeparture)
    if pd:
        score += 15
        factors.append(ReadinessFactor(field="plannedDeparture", status="ok", note="Planned departure parsed"))
    else:
        factors.append(ReadinessFactor(field="plannedDeparture", status="missing", note="Planned departure required"))

    pa = _parse_iso(draft.plannedArrival)
    if pa:
        score += 10
        factors.append(ReadinessFactor(field="plannedArrival", status="ok", note="Planned arrival parsed"))
    else:
        factors.append(ReadinessFactor(field="plannedArrival", status="warn", note="Planned arrival not set — ETA will be inferred"))

    # Monitoring
    if draft.sensitivity:
        score += 5
        factors.append(ReadinessFactor(field="sensitivity", status="ok", note=f"Sensitivity = {draft.sensitivity}"))
    if draft.alertPreference:
        score += 5
        factors.append(ReadinessFactor(field="alertPreference", status="ok", note=f"Alerts = {draft.alertPreference}"))

    # Route preview
    if draft.origin is not None and draft.destination is not None and draft.origin.unlocode != draft.destination.unlocode:
        score += 15
        factors.append(ReadinessFactor(field="route", status="ok", note="Route preview computable"))
    elif draft.origin is not None and draft.destination is not None:
        factors.append(ReadinessFactor(field="route", status="warn", note="Origin and destination are the same"))

    score = max(0, min(100, score))
    can_start = bool(
        draft.shipName
        and draft.origin
        and draft.destination
        and pd
        and (draft.origin.unlocode != draft.destination.unlocode if (draft.origin and draft.destination) else False)
    )
    return ReadinessOut(score=score, band=_band(score), factors=factors, canStart=can_start)
