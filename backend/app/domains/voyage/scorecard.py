"""Voyage Scorecard — auto-graded final scoring."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...services.llm.registry import call_llm, render_prompt
from .attribution import compute_attribution
from .live import compute_live_snapshot
from .models import Voyage, VoyageAlert
from .schemas import ScorecardComponent, ScorecardOut


_SCHEMA = {
    "type": "object",
    "properties": {
        "overall": {"type": "integer", "minimum": 0, "maximum": 100},
        "grade": {"type": "string", "enum": ["A", "B", "C", "D", "F"]},
        "components": {
            "type": "array",
            "minItems": 3,
            "maxItems": 3,
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "enum": ["punctuality", "routeAdherence", "operationalSmoothness"]},
                    "score": {"type": "integer", "minimum": 0, "maximum": 100},
                    "note": {"type": "string"},
                },
                "required": ["name", "score", "note"],
            },
        },
        "summary": {"type": "string"},
    },
    "required": ["overall", "grade", "components", "summary"],
}


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


async def build_scorecard(db: AsyncSession, voyage: Voyage) -> ScorecardOut:
    live = await compute_live_snapshot(db, voyage)
    attribution = await compute_attribution(db, voyage)

    alerts = (
        await db.execute(select(VoyageAlert).where(VoyageAlert.voyage_id == voyage.id))
    ).scalars().all()
    danger = sum(1 for a in alerts if a.severity == "danger")
    warning = sum(1 for a in alerts if a.severity == "warning")
    info = sum(1 for a in alerts if a.severity == "info")

    pd = _parse_iso(voyage.planned_departure)
    pa = _parse_iso(voyage.planned_arrival) or pd
    ad = _parse_iso(voyage.actual_departure) or pd
    aa = _parse_iso(voyage.actual_arrival) or datetime.now(tz=timezone.utc)
    duration_planned_min = max(60, int(((pa - pd).total_seconds() // 60) if pd and pa else 0))
    duration_actual_min = max(60, int(((aa - ad).total_seconds() // 60) if ad and aa else 0))

    metrics = {
        "etaDeltaMin": live.etaDeltaMin,
        "riskScore": live.riskScore,
        "routeNm": live.distanceTotalNm,
        "durationPlannedMin": duration_planned_min,
        "durationActualMin": duration_actual_min,
        "deviationMinutes": max(0, duration_actual_min - duration_planned_min),
    }
    alerts_summary = {"danger": danger, "warning": warning, "info": info}

    body = render_prompt(
        "scorecard", "v1",
        voyage_summary=(
            f"id={voyage.id} ship={voyage.ship_name} {voyage.origin_name}->{voyage.destination_name} "
            f"state={voyage.status}"
        ),
        metrics=json.dumps(metrics, indent=2),
        attribution=json.dumps([f.model_dump() for f in attribution.factors], indent=2),
        alerts_summary=json.dumps(alerts_summary, indent=2),
    )

    parsed, _meta = await call_llm(
        db,
        prompt_name="scorecard",
        prompt_version="v1",
        prompt_body=body,
        schema=_SCHEMA,
        note=f"voyage={voyage.id}",
    )

    components: list[ScorecardComponent] = []
    seen: set[str] = set()
    for c in parsed.get("components") or []:
        if not isinstance(c, dict):
            continue
        name = c.get("name")
        if name not in {"punctuality", "routeAdherence", "operationalSmoothness"} or name in seen:
            continue
        seen.add(name)
        components.append(
            ScorecardComponent(
                name=name,  # type: ignore[arg-type]
                score=int(c.get("score", 0)),
                note=str(c.get("note", "")),
            )
        )

    if len(components) < 3:
        # Fill any missing components with conservative scores so the schema validates.
        defaults = {
            "punctuality": (max(0, 100 - max(0, abs(live.etaDeltaMin) // 6)), "Derived from current ETA delta."),
            "routeAdherence": (max(0, 100 - int(attribution.factors[3].weightPct if len(attribution.factors) > 3 else 0)), "Derived from routing share of cause attribution."),
            "operationalSmoothness": (max(0, 100 - (danger * 25 + warning * 10 + info * 2)), "Derived from alert volume by severity."),
        }
        for k, (s, note) in defaults.items():
            if k not in seen:
                components.append(ScorecardComponent(name=k, score=int(s), note=note))  # type: ignore[arg-type]

    overall_raw = parsed.get("overall")
    if isinstance(overall_raw, int):
        overall = max(0, min(100, overall_raw))
    else:
        overall = int(round(sum(c.score for c in components) / max(1, len(components))))

    grade = parsed.get("grade")
    if grade not in {"A", "B", "C", "D", "F"}:
        grade = "A" if overall >= 90 else "B" if overall >= 75 else "C" if overall >= 60 else "D" if overall >= 40 else "F"

    return ScorecardOut(
        voyageId=voyage.id,
        overall=overall,
        grade=grade,  # type: ignore[arg-type]
        components=components,
        summary=str(parsed.get("summary") or "Voyage closed within tolerance."),
        generatedAt=datetime.now(tz=timezone.utc).isoformat(),
    )
