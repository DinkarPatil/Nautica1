"""ETA Drift Narrator — fast, one-line auto-generated narration per snapshot.

We try Vertex first (when AI_PROVIDER=vertex); otherwise produce a deterministic
sentence. Either way the snapshot row gets a `narration` so the live page can
render it without any user interaction.
"""

from __future__ import annotations

import json

from sqlalchemy.ext.asyncio import AsyncSession

from ...services.llm.registry import call_llm, render_prompt
from .models import VoyageETASnapshot


_SCHEMA = {
    "type": "object",
    "properties": {"narration": {"type": "string"}},
    "required": ["narration"],
}


def _deterministic(prev: VoyageETASnapshot | None, curr: VoyageETASnapshot) -> str:
    delta = curr.delta_min_from_prev
    cause = curr.cause or "operational change"
    if delta == 0:
        return f"ETA holding at {curr.eta} — no material change since last snapshot."
    sign = "later" if delta > 0 else "earlier"
    return f"ETA shifted {abs(delta)} min {sign} due to {cause}; new ETA {curr.eta}."


async def narrate(
    db: AsyncSession,
    *,
    voyage_id: str,
    prev: VoyageETASnapshot | None,
    curr: VoyageETASnapshot,
    recent_events: list[str] | None = None,
) -> str:
    """Returns the narration string. Persists it onto `curr.narration`."""
    body = render_prompt(
        "eta_narration", "v1",
        voyage_id=voyage_id,
        prev=json.dumps(
            {
                "ts": prev.ts, "eta": prev.eta, "confidence": prev.confidence,
                "deltaMinFromPrev": prev.delta_min_from_prev, "cause": prev.cause,
            } if prev else None,
            default=str,
        ),
        curr=json.dumps(
            {
                "ts": curr.ts, "eta": curr.eta, "confidence": curr.confidence,
                "deltaMinFromPrev": curr.delta_min_from_prev, "cause": curr.cause,
            },
            default=str,
        ),
        events="\n".join(recent_events or []) or "(none)",
    )
    parsed, _meta = await call_llm(
        db,
        prompt_name="eta_narration",
        prompt_version="v1",
        prompt_body=body,
        schema=_SCHEMA,
        note=f"voyage={voyage_id}",
    )
    text = (parsed.get("narration") or "").strip()
    if not text:
        text = _deterministic(prev, curr)
    text = text[:240]
    curr.narration = text
    return text


async def backfill_narrations(db: AsyncSession, voyage_id: str, snapshots: list[VoyageETASnapshot]) -> None:
    """Fill any missing narrations for an existing voyage's snapshots.

    To keep the request fast we:
      - cap LLM calls at the most-recent 6 *non-zero-delta* snapshots
      - everything else gets the deterministic fallback so every row still
        has a sentence
    """
    snapshots = sorted(snapshots, key=lambda s: s.ts)
    interesting = [s for s in snapshots if s.delta_min_from_prev != 0 and not s.narration]
    interesting = interesting[-6:]
    interesting_ids = {id(s) for s in interesting}
    prev: VoyageETASnapshot | None = None
    for s in snapshots:
        if not s.narration:
            if id(s) in interesting_ids:
                try:
                    await narrate(db, voyage_id=voyage_id, prev=prev, curr=s)
                except Exception:  # noqa: BLE001 — never block the request
                    s.narration = _deterministic(prev, s)
            else:
                s.narration = _deterministic(prev, s)
        prev = s
    await db.flush()
    return


async def _legacy_backfill_full(db: AsyncSession, voyage_id: str, snapshots: list[VoyageETASnapshot]) -> None:
    snapshots = sorted(snapshots, key=lambda s: s.ts)
    prev: VoyageETASnapshot | None = None
    for s in snapshots:
        if not s.narration:
            await narrate(db, voyage_id=voyage_id, prev=prev, curr=s)
        prev = s
    await db.flush()
