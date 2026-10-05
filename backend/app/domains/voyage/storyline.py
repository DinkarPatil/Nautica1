"""Voyage Storyline — chronological narrative."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...services.llm.registry import call_llm, render_prompt
from .models import Voyage, VoyageAlert, VoyageETASnapshot, VoyageEvent
from .schemas import StorylineChapter, StorylineOut


_SCHEMA = {
    "type": "object",
    "properties": {
        "chapters": {
            "type": "array",
            "minItems": 1,
            "maxItems": 12,
            "items": {
                "type": "object",
                "properties": {
                    "ts": {"type": "string"},
                    "label": {"type": "string"},
                    "narration": {"type": "string"},
                    "severity": {"type": "string", "enum": ["info", "warning", "danger"]},
                    "sourceRef": {"type": "string"},
                },
                "required": ["ts", "label", "narration"],
            },
        }
    },
    "required": ["chapters"],
}


def _short_event(e: VoyageEvent) -> str:
    return f"{e.ts}\t[{e.severity}/{e.category}]\t{e.id}\t{e.title} | {e.detail or ''}"


def _short_alert(a: VoyageAlert) -> str:
    return f"{a.raised_at}\t[{a.severity}/{a.category}]\t{a.id}\t{a.title} | {a.detail}"


def _short_eta(s: VoyageETASnapshot) -> str:
    cause = f" cause={s.cause}" if s.cause else ""
    return f"{s.ts}\teta={s.eta}\tdelta={s.delta_min_from_prev}min{cause}"


async def build_storyline(db: AsyncSession, voyage: Voyage) -> StorylineOut:
    events = (
        await db.execute(
            select(VoyageEvent).where(VoyageEvent.voyage_id == voyage.id).order_by(asc(VoyageEvent.ts))
        )
    ).scalars().all()
    alerts = (
        await db.execute(
            select(VoyageAlert).where(VoyageAlert.voyage_id == voyage.id).order_by(asc(VoyageAlert.raised_at))
        )
    ).scalars().all()
    eta_series = (
        await db.execute(
            select(VoyageETASnapshot)
            .where(VoyageETASnapshot.voyage_id == voyage.id)
            .order_by(asc(VoyageETASnapshot.ts))
        )
    ).scalars().all()

    summary = (
        f"id={voyage.id} | ship={voyage.ship_name} ({voyage.ship_imo or '—'}) | "
        f"{voyage.origin_name} → {voyage.destination_name} | "
        f"plannedDep={voyage.planned_departure} plannedArr={voyage.planned_arrival or '—'} | "
        f"state={voyage.status}"
    )
    body = render_prompt(
        "storyline", "v1",
        voyage_summary=summary,
        events="\n".join(_short_event(e) for e in events) or "(none)",
        eta_series="\n".join(_short_eta(s) for s in eta_series) or "(none)",
        alerts="\n".join(_short_alert(a) for a in alerts) or "(none)",
    )

    parsed, meta = await call_llm(
        db,
        prompt_name="storyline",
        prompt_version="v1",
        prompt_body=body,
        schema=_SCHEMA,
        note=f"voyage={voyage.id}",
    )

    chapters: list[StorylineChapter] = []
    for c in parsed.get("chapters") or []:
        if not isinstance(c, dict):
            continue
        try:
            sev = c.get("severity") if c.get("severity") in ("info", "warning", "danger") else "info"
            chapters.append(
                StorylineChapter(
                    ts=str(c.get("ts", "")),
                    label=str(c.get("label", "Moment")),
                    narration=str(c.get("narration", "")),
                    severity=sev,  # type: ignore[arg-type]
                    sourceRef=(str(c.get("sourceRef")).strip() or None) if c.get("sourceRef") else None,
                )
            )
        except Exception:  # noqa: BLE001 — skip malformed entries, never crash the page
            continue

    chapters.sort(key=lambda c: c.ts)

    return StorylineOut(
        voyageId=voyage.id,
        chapters=chapters,
        generatedAt=datetime.now(tz=timezone.utc).isoformat(),
        _meta=meta,
    )
