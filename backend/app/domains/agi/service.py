from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...config import get_settings
from ...errors import APIError
from ...services.audit.log import write_audit
from ...services.llm.envelope import with_meta
from ...services.llm.registry import call_llm, render_prompt
from ...domains.fleet.models import Vessel
from ...domains.ports.models import Port
from ...domains.risk.models import Alert
from .models import AGIDecision, AGIRun
from .schemas import AGIAnalyzeOut, AGIDecisionOut, AGIExecuteOut, AGIModelStatus


def _row_to_out(d: AGIDecision) -> AGIDecisionOut:
    return AGIDecisionOut.model_validate(d, from_attributes=True)


async def list_decisions(
    db: AsyncSession, *, category: Optional[str] = None, priority: Optional[str] = None
) -> list[AGIDecisionOut]:
    stmt = select(AGIDecision).order_by(desc(AGIDecision.timestamp))
    if category and category != "All":
        stmt = stmt.where(AGIDecision.category == category)
    if priority and priority != "all":
        stmt = stmt.where(AGIDecision.priority == priority)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_out(r) for r in rows]


async def execute_decision(db: AsyncSession, *, did: str, actor_id: str) -> AGIExecuteOut:
    row = (await db.execute(select(AGIDecision).where(AGIDecision.id == did))).scalar_one_or_none()
    if row is None:
        raise APIError("not_found", "Decision not found", status_code=404)
    if row.is_actioned:
        raise APIError("conflict", "Decision already executed", status_code=409)
    row.is_actioned = True
    row.actioned_at = datetime.now(tz=timezone.utc)
    row.actioned_by = actor_id
    await db.flush()
    await write_audit(
        db,
        action="agi.execute",
        entity_type="agi_decision",
        entity_id=did,
        actor_user_id=actor_id,
        after={"is_actioned": True},
    )
    return AGIExecuteOut(id=row.id, executed=True, executedAt=row.actioned_at)


async def model_status(db: AsyncSession) -> AGIModelStatus:
    s = get_settings()
    last_run = (await db.execute(select(AGIRun).order_by(desc(AGIRun.created_at)).limit(1))).scalar_one_or_none()
    return AGIModelStatus(
        provider=s.resolved_provider,
        model=s.GEMINI_MODEL,
        proModel=s.GEMINI_MODEL_PRO or s.GEMINI_MODEL,
        lastRunAt=last_run.created_at if last_run else None,
    )


async def run_analysis(db: AsyncSession, *, actor_id: str) -> AGIAnalyzeOut:
    """Run a full-fleet analysis using Vertex Pro model."""
    s = get_settings()

    # Build context (compact summaries; we keep prompt small)
    vessels = (await db.execute(select(Vessel).limit(20))).scalars().all()
    ports = (await db.execute(select(Port).order_by(desc(Port.congestion_pct)).limit(8))).scalars().all()
    alerts = (await db.execute(select(Alert).order_by(desc(Alert.timestamp)).limit(10))).scalars().all()

    fleet_summary = "\n".join(
        f"- {v.id} {v.name} ({v.flag}) {v.status} {v.port_of_origin}->{v.port_of_destination} risk={v.risk_score}"
        for v in vessels
    )
    ports_summary = "\n".join(
        f"- {p.id} {p.name} {p.country_code} {p.status} congestion={p.congestion_pct}% queue={p.queue_count}"
        for p in ports
    )
    alerts_summary = "\n".join(
        f"- {a.severity}/{a.type} {a.title} ({a.location or 'n/a'})" for a in alerts
    )

    prompt_body = render_prompt(
        "fleet_analysis", "v1",
        fleet_summary=fleet_summary or "(empty)",
        ports_summary=ports_summary or "(empty)",
        alerts_summary=alerts_summary or "(empty)",
    )

    schema = {
        "type": "object",
        "properties": {
            "decisions": {
                "type": "array",
                "minItems": 1,
                "maxItems": 5,
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "category": {"type": "string"},
                        "summary": {"type": "string"},
                        "reasoning": {"type": "string"},
                        "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                        "priority": {"type": "string"},
                        "affectedVessels": {"type": "array", "items": {"type": "string"}},
                        "affectedPorts": {"type": "array", "items": {"type": "string"}},
                        "estimatedSaving": {"type": "string"},
                    },
                    "required": ["title", "category", "summary", "reasoning", "confidence", "priority"],
                },
            }
        },
        "required": ["decisions"],
    }

    parsed, meta = await call_llm(
        db,
        prompt_name="fleet_analysis",
        prompt_version="v1",
        prompt_body=prompt_body,
        schema=schema,
        model=s.GEMINI_MODEL_PRO,
        note=f"actor={actor_id}",
    )

    run_id = f"r_{uuid.uuid4().hex[:8]}"
    db.add(
        AGIRun(
            id=run_id,
            kind="fleet_analysis",
            status="ok" if parsed.get("decisions") else "error",
            finished_at=datetime.now(tz=timezone.utc),
            model=meta.get("model", s.GEMINI_MODEL_PRO),
            prompt_version="fleet_analysis.v1",
            summary=f"Generated {len(parsed.get('decisions', []))} decisions",
            triggered_by=actor_id,
        )
    )

    out_decisions: list[AGIDecisionOut] = []
    for idx, item in enumerate(parsed.get("decisions", []) or []):
        did = f"agi_{run_id[2:]}_{idx}"
        row = AGIDecision(
            id=did,
            run_id=run_id,
            category=item.get("category", "Route Optimization"),
            title=str(item.get("title", "Untitled"))[:120],
            summary=item.get("summary", ""),
            reasoning=item.get("reasoning", ""),
            confidence=int(item.get("confidence", 70)),
            priority=item.get("priority", "medium"),
            affected_vessels=item.get("affectedVessels") or [],
            affected_ports=item.get("affectedPorts") or [],
            estimated_saving=item.get("estimatedSaving"),
            timestamp=datetime.now(tz=timezone.utc).isoformat(),
            is_actioned=False,
        )
        db.add(row)
        out_decisions.append(_row_to_out(row))
    await db.flush()

    await write_audit(
        db,
        action="agi.analyze",
        entity_type="agi_run",
        entity_id=run_id,
        actor_user_id=actor_id,
        after={"count": len(out_decisions), "model": meta.get("model")},
    )

    return AGIAnalyzeOut(runId=run_id, decisions=out_decisions, _meta=meta)
