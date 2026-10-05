"""SSE stream — emits StreamEvent records compatible with `voyageStore.applyStream`.

For MVP we don't carry an in-process event bus; instead, the stream consumer
polls the DB-backed live cache + recent events/alerts on a 30-second tick.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncIterator

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from .live import compute_live_snapshot
from .models import Voyage, VoyageAlert, VoyageEvent


def _evt(kind: str, payload: dict) -> str:
    return f"data: {json.dumps({'kind': kind, 'payload': payload})}\n\n"


async def voyage_stream(db: AsyncSession, vid: str) -> AsyncIterator[str]:
    last_event_ts: str = ""
    last_alert_ts: str = ""

    while True:
        voyage = (await db.execute(select(Voyage).where(Voyage.id == vid))).scalar_one_or_none()
        if voyage is None:
            yield _evt("error", {"message": "voyage not found"})
            return

        snap = await compute_live_snapshot(db, voyage)
        yield _evt("snapshot", snap.model_dump())

        # New events since last tick
        ev_rows = (
            await db.execute(
                select(VoyageEvent)
                .where(VoyageEvent.voyage_id == vid, VoyageEvent.ts > last_event_ts)
                .order_by(desc(VoyageEvent.ts))
                .limit(10)
            )
        ).scalars().all()
        for e in reversed(ev_rows):
            yield _evt(
                "event",
                {
                    "id": e.id, "voyageId": e.voyage_id, "category": e.category,
                    "severity": e.severity, "ts": e.ts, "title": e.title,
                    "detail": e.detail, "position": e.position, "meta": e.meta,
                },
            )
            last_event_ts = max(last_event_ts, e.ts)

        # New alerts
        al_rows = (
            await db.execute(
                select(VoyageAlert)
                .where(VoyageAlert.voyage_id == vid, VoyageAlert.raised_at > last_alert_ts)
                .order_by(desc(VoyageAlert.raised_at))
                .limit(10)
            )
        ).scalars().all()
        for a in reversed(al_rows):
            yield _evt(
                "alert",
                {
                    "id": a.id, "voyageId": a.voyage_id, "category": a.category,
                    "severity": a.severity, "title": a.title, "detail": a.detail,
                    "raisedAt": a.raised_at, "resolvedAt": a.resolved_at,
                    "acknowledged": a.acknowledged,
                },
            )
            last_alert_ts = max(last_alert_ts, a.raised_at)

        await asyncio.sleep(30)
