"""Cause attribution: pure logic + AI-augmented notes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...services.llm.registry import call_llm, render_prompt
from .models import Voyage, VoyageETASnapshot, VoyageEvent
from .schemas import CauseAttribution, CauseFactor


_NOTES_SCHEMA = {
    "type": "object",
    "properties": {
        "factors": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "key": {"type": "string", "enum": ["weather", "congestion", "speed", "routing"]},
                    "weightPct": {"type": "integer", "minimum": 0, "maximum": 100},
                    "note": {"type": "string"},
                },
                "required": ["key", "weightPct"],
            },
        },
    },
    "required": ["factors"],
}


def _compute_weights_from_eta_series(snapshots: list[VoyageETASnapshot]) -> dict[str, int]:
    """Sum positive ETA deltas attributed to each cause and convert to %."""
    by_cause: dict[str, float] = {"weather": 0.0, "congestion": 0.0, "speed": 0.0, "routing": 0.0}
    for s in snapshots:
        if s.delta_min_from_prev <= 0:
            continue
        cause = (s.cause or "routing").lower()
        if cause not in by_cause:
            cause = "routing"
        by_cause[cause] += s.delta_min_from_prev
    total = sum(by_cause.values())
    if total <= 0:
        # Fallback: even split with weather slightly favored.
        return {"weather": 40, "congestion": 30, "speed": 20, "routing": 10}
    return {k: int(round(v / total * 100)) for k, v in by_cause.items()}


def _normalize_to_100(weights: dict[str, int]) -> dict[str, int]:
    s = sum(weights.values())
    if s == 100 or s <= 0:
        return weights
    diff = 100 - s
    # Add diff to the largest bucket
    biggest = max(weights, key=lambda k: weights[k])
    weights[biggest] += diff
    return weights


async def compute_attribution(db: AsyncSession, voyage: Voyage) -> CauseAttribution:
    snapshots = (
        await db.execute(
            select(VoyageETASnapshot).where(VoyageETASnapshot.voyage_id == voyage.id).order_by(VoyageETASnapshot.ts)
        )
    ).scalars().all()

    weights = _normalize_to_100(_compute_weights_from_eta_series(snapshots))

    # Recent events for the AI to cite in `note`s.
    events_rows = (
        await db.execute(
            select(VoyageEvent).where(VoyageEvent.voyage_id == voyage.id).order_by(desc(VoyageEvent.ts)).limit(8)
        )
    ).scalars().all()
    events_text = "\n".join(f"- {e.ts} [{e.category}] {e.title}: {e.detail or ''}" for e in events_rows)

    weights_text = "\n".join(f"- {k}: {v}%" for k, v in weights.items())

    prompt_body = render_prompt(
        "attribution_notes", "v1",
        voyage_id=voyage.id,
        weights=weights_text,
        events=events_text or "(no events)",
    )

    parsed, _meta = await call_llm(
        db,
        prompt_name="attribution_notes",
        prompt_version="v1",
        prompt_body=prompt_body,
        schema=_NOTES_SCHEMA,
        note=f"voyage={voyage.id}",
    )

    factors_out: list[CauseFactor] = []
    notes_by_key: dict[str, Any] = {}
    for f in parsed.get("factors", []) or []:
        if not isinstance(f, dict):
            continue
        notes_by_key[f.get("key")] = f.get("note")

    for k in ("weather", "congestion", "speed", "routing"):
        factors_out.append(
            CauseFactor(
                key=k,  # type: ignore[arg-type]
                weightPct=weights[k],
                note=notes_by_key.get(k),
            )
        )

    return CauseAttribution(
        voyageId=voyage.id,
        factors=factors_out,
        generatedAt=datetime.now(tz=timezone.utc).isoformat(),
    )
