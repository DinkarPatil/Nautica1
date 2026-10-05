"""Alert Triage Assistant — auto-rank + per-alert explanation."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import asc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...services.llm.registry import call_llm, render_prompt
from .models import Voyage, VoyageAlert
from .schemas import TriageItem, TriageOut


_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "alertId": {"type": "string"},
                    "rank": {"type": "integer", "minimum": 1},
                    "severity": {"type": "string", "enum": ["info", "warning", "danger"]},
                    "title": {"type": "string"},
                    "actionNow": {"type": "boolean"},
                    "explanation": {"type": "string"},
                },
                "required": ["alertId", "rank", "severity", "title", "actionNow", "explanation"],
            },
        }
    },
    "required": ["items"],
}


def _short_alert(a: VoyageAlert) -> str:
    return (
        f"id={a.id}\tsev={a.severity}\tcat={a.category}\t"
        f"raisedAt={a.raised_at}\tlifecycle={a.lifecycle}\t"
        f"title={a.title} | detail={a.detail}"
    )


def _persist_triage_notes(rows: list[VoyageAlert], items: list[TriageItem]) -> None:
    by_id = {it.alertId: it for it in items}
    for r in rows:
        match = by_id.get(r.id)
        if match:
            r.triage_note = match.explanation


async def build_triage(db: AsyncSession, voyage: Voyage) -> TriageOut:
    rows = (
        await db.execute(
            select(VoyageAlert).where(VoyageAlert.voyage_id == voyage.id).order_by(asc(VoyageAlert.raised_at))
        )
    ).scalars().all()

    if not rows:
        return TriageOut(
            voyageId=voyage.id,
            items=[],
            generatedAt=datetime.now(tz=timezone.utc).isoformat(),
            _meta={"empty": True},
        )

    voyage_state = (
        f"id={voyage.id} state={voyage.status} phase={voyage.phase} "
        f"sensitivity={voyage.sensitivity} cargoPriority={voyage.cargo_priority or '—'}"
    )
    body = render_prompt(
        "alert_triage", "v1",
        voyage_state=voyage_state,
        alerts="\n".join(_short_alert(a) for a in rows),
    )

    parsed, meta = await call_llm(
        db,
        prompt_name="alert_triage",
        prompt_version="v1",
        prompt_body=body,
        schema=_SCHEMA,
        note=f"voyage={voyage.id} count={len(rows)}",
    )

    valid_ids = {a.id for a in rows}
    items: list[TriageItem] = []
    for it in parsed.get("items") or []:
        if not isinstance(it, dict):
            continue
        aid = str(it.get("alertId") or "")
        if aid not in valid_ids:
            continue
        try:
            items.append(
                TriageItem(
                    alertId=aid,
                    rank=int(it.get("rank", 99)),
                    severity=it.get("severity") if it.get("severity") in ("info", "warning", "danger") else "info",
                    title=str(it.get("title", "Alert")),
                    actionNow=bool(it.get("actionNow", False)),
                    explanation=str(it.get("explanation", ""))[:240],
                )
            )
        except Exception:  # noqa: BLE001
            continue

    items.sort(key=lambda x: x.rank)

    _persist_triage_notes(rows, items)
    await db.flush()

    return TriageOut(
        voyageId=voyage.id,
        items=items,
        generatedAt=datetime.now(tz=timezone.utc).isoformat(),
        _meta=meta,
    )
