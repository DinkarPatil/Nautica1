from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...services.adapters.opensanctions import screen as opensanctions_screen
from ...services.audit.log import write_audit
from ...services.llm.envelope import with_meta
from ...services.llm.registry import call_llm
from .models import Alert, RiskRegion, SanctionsScreen
from .schemas import (
    AlertCreate,
    AlertOut,
    RiskRegionOut,
    SanctionsHit,
    SanctionsScreenIn,
    SanctionsScreenOut,
)


async def list_alerts(
    db: AsyncSession, *, type_: Optional[str] = None, severity: Optional[str] = None
) -> list[AlertOut]:
    stmt = select(Alert).order_by(desc(Alert.timestamp))
    if type_ and type_ != "all":
        stmt = stmt.where(Alert.type == type_)
    if severity and severity != "all":
        stmt = stmt.where(Alert.severity == severity)
    rows = (await db.execute(stmt)).scalars().all()
    return [AlertOut.model_validate(r, from_attributes=True) for r in rows]


async def create_alert(db: AsyncSession, *, payload: AlertCreate, actor_id: str) -> AlertOut:
    aid = f"a_{uuid.uuid4().hex[:8]}"
    row = Alert(
        id=aid,
        type=payload.type,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        vessel_id=payload.vesselId,
        timestamp=datetime.now(tz=timezone.utc).isoformat(),
        is_read=False,
    )
    db.add(row)
    await db.flush()
    await write_audit(
        db,
        action="alert.create",
        entity_type="alert",
        entity_id=aid,
        actor_user_id=actor_id,
        after={
            "type": payload.type,
            "severity": payload.severity,
            "title": payload.title,
        },
    )
    return AlertOut.model_validate(row, from_attributes=True)


async def list_regions(db: AsyncSession) -> list[RiskRegionOut]:
    rows = (await db.execute(select(RiskRegion))).scalars().all()
    return [RiskRegionOut.model_validate(r, from_attributes=True) for r in rows]


async def screen_sanctions(db: AsyncSession, payload: SanctionsScreenIn) -> SanctionsScreenOut:
    res = await opensanctions_screen(payload.query, kind=payload.type or "any")
    hits_raw = res.get("hits", [])
    matched = bool(hits_raw)
    source = res.get("source", "opensanctions")

    # Generate a one-line explanation via Vertex (or stub).
    prompt_body = (
        f"Query: {payload.query}\n"
        f"Type: {payload.type}\n"
        f"Hits: {hits_raw[:5]}\n\n"
        "If matched, write ONE plain sentence explaining what the user should do. "
        "If not matched, write ONE sentence stating the entity appears clean against this list. "
        "Return JSON: {\"explanation\": string}."
    )
    schema = {"type": "object", "properties": {"explanation": {"type": "string"}}, "required": ["explanation"]}
    parsed, meta = await call_llm(
        db,
        prompt_name="sanctions_explain",
        prompt_version="v1",
        prompt_body=prompt_body,
        schema=schema,
        note=f"query={payload.query[:50]}",
    )
    explanation = parsed.get("explanation") or (
        "Entity appears in OpenSanctions match results — review hits."
        if matched
        else "No matches found in OpenSanctions; entity appears clean."
    )

    db.add(
        SanctionsScreen(
            query=payload.query,
            type=payload.type,
            matched=matched,
            hits=hits_raw,
            explanation=explanation,
            source=source,
            model=meta.get("model"),
            prompt_version=meta.get("promptVersion"),
        )
    )
    await db.flush()

    return SanctionsScreenOut(
        matched=matched,
        hits=[SanctionsHit(**h) for h in hits_raw],
        explanation=explanation,
        source=source,
        _meta=meta,
    )
