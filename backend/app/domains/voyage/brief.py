"""Voyage AI brief — calls Vertex via the LLM registry."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...services.adapters.open_meteo import get_weather
from ...services.llm.registry import call_llm, render_prompt
from .models import Voyage, VoyageBriefRow, VoyageEvent
from .schemas import AIBrief, AIBriefRiskFactor, RiskBand


_BRIEF_SCHEMA = {
    "type": "object",
    "properties": {
        "whatIsHappening": {"type": "string"},
        "whatChanged": {"type": "string"},
        "whyETAMoved": {"type": "string"},
        "riskBand": {"type": "string", "enum": ["low", "medium", "high"]},
        "recommendation": {"type": "string"},
        "riskFactors": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "key": {"type": "string", "enum": ["weather", "traffic", "routing"]},
                    "value": {"type": "integer", "minimum": 0, "maximum": 100},
                },
                "required": ["key", "value"],
            },
        },
    },
    "required": ["whatIsHappening", "whatChanged", "whyETAMoved", "riskBand", "recommendation", "riskFactors"],
}


def _eta_delta_word(min_delta: int) -> str:
    if min_delta == 0:
        return "on plan"
    if min_delta > 0:
        return f"{min_delta} min behind plan"
    return f"{abs(min_delta)} min ahead of plan"


async def generate_brief(db: AsyncSession, voyage: Voyage, live) -> AIBrief:
    weather = await get_weather(live.position.lat, live.position.lon)

    events_rows = (
        await db.execute(
            select(VoyageEvent).where(VoyageEvent.voyage_id == voyage.id).order_by(desc(VoyageEvent.ts)).limit(8)
        )
    ).scalars().all()
    events_text = "\n".join(
        f"- [{e.severity}] {e.ts} {e.title}: {e.detail or ''}" for e in events_rows
    ) or "(no recent events)"

    prompt_body = render_prompt(
        "voyage_brief", "v1",
        voyage_id=voyage.id,
        ship_name=voyage.ship_name,
        ship_type=voyage.ship_type,
        ship_flag=voyage.ship_flag or "n/a",
        origin_name=voyage.origin_name,
        destination_name=voyage.destination_name,
        planned_departure=voyage.planned_departure,
        planned_arrival=voyage.planned_arrival or "n/a",
        phase=live.phase,
        lat=round(live.position.lat, 4),
        lon=round(live.position.lon, 4),
        sog=live.sog,
        cog=live.cog,
        distance_remaining_nm=live.distanceRemainingNm,
        distance_total_nm=live.distanceTotalNm,
        progress_pct=live.progressPct,
        current_eta=live.currentETA,
        eta_delta_min=live.etaDeltaMin,
        eta_delta_word=_eta_delta_word(live.etaDeltaMin),
        eta_confidence=live.etaConfidence,
        risk_score=live.riskScore,
        wind_kn=round(weather.wind_speed_kn, 1),
        wind_dir=round(weather.wind_dir_deg, 0),
        events=events_text,
    )

    parsed, meta = await call_llm(
        db,
        prompt_name="voyage_brief",
        prompt_version="v1",
        prompt_body=prompt_body,
        schema=_BRIEF_SCHEMA,
        note=f"voyage={voyage.id}",
    )

    rb = parsed.get("riskBand")
    if rb not in ("low", "medium", "high"):
        rb = live.riskBand
    raw_factors = parsed.get("riskFactors") or []
    factors = []
    for f in raw_factors:
        if not isinstance(f, dict):
            continue
        k = f.get("key")
        if k in ("weather", "traffic", "routing"):
            try:
                factors.append(AIBriefRiskFactor(key=k, value=int(f.get("value", 0))))
            except Exception:  # pragma: no cover
                continue
    if not factors:
        factors = [
            AIBriefRiskFactor(key="weather", value=min(100, int(weather.wind_speed_kn * 3))),
            AIBriefRiskFactor(key="traffic", value=40),
            AIBriefRiskFactor(key="routing", value=20),
        ]

    asof = datetime.now(tz=timezone.utc).isoformat()
    brief = AIBrief(
        voyageId=voyage.id,
        asOf=asof,
        whatIsHappening=parsed.get("whatIsHappening", "Voyage is in progress."),
        whatChanged=parsed.get("whatChanged", "No notable changes in the most recent telemetry."),
        whyETAMoved=parsed.get("whyETAMoved", "ETA reflects current speed and remaining distance."),
        riskBand=rb,  # type: ignore[arg-type]
        recommendation=parsed.get("recommendation", "Hold current routing."),
        riskFactors=factors,
    )

    db.add(
        VoyageBriefRow(
            voyage_id=voyage.id,
            payload=brief.model_dump(),
            model=meta.get("model", "?"),
            prompt_version=meta.get("promptVersion", "voyage_brief.v1"),
        )
    )
    await db.flush()
    return brief
