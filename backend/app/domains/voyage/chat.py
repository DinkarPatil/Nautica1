"""Voyage chat — Q&A grounded in voyage state."""

from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...services.llm.registry import call_llm, render_prompt
from .live import compute_live_snapshot
from .models import Voyage, VoyageEvent
from .schemas import VoyageChatOut


_SCHEMA = {
    "type": "object",
    "properties": {
        "answer": {"type": "string"},
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "kind": {"type": "string", "enum": ["live", "events", "alerts", "brief"]},
                    "ref": {"type": "string"},
                },
                "required": ["kind"],
            },
        },
    },
    "required": ["answer"],
}


async def answer(db: AsyncSession, voyage: Voyage, question: str) -> VoyageChatOut:
    live = await compute_live_snapshot(db, voyage)

    events_rows = (
        await db.execute(
            select(VoyageEvent).where(VoyageEvent.voyage_id == voyage.id).order_by(desc(VoyageEvent.ts)).limit(10)
        )
    ).scalars().all()
    events_text = "\n".join(
        f"- [{e.severity}] {e.ts} {e.title}: {e.detail or ''}" for e in events_rows
    ) or "(none)"

    state = (
        f"id={voyage.id} | {voyage.origin_name}->{voyage.destination_name} | phase={live.phase} | "
        f"sog={live.sog}kn cog={live.cog}° eta={live.currentETA} delta={live.etaDeltaMin}min "
        f"risk={live.riskScore} ({live.riskBand})"
    )
    prompt = render_prompt(
        "voyage_chat", "v1",
        voyage_state=state,
        events=events_text,
        question=question,
    )

    parsed, _meta = await call_llm(
        db,
        prompt_name="voyage_chat",
        prompt_version="v1",
        prompt_body=prompt,
        schema=_SCHEMA,
        note=f"voyage={voyage.id} q={question[:60]}",
    )
    return VoyageChatOut(
        answer=parsed.get("answer") or "I couldn't synthesize an answer from the current state.",
        citations=parsed.get("citations") or [{"kind": "live"}],
    )
