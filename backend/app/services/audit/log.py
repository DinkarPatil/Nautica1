from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from .models import AuditLog


async def write_audit(
    db: AsyncSession,
    *,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor_user_id: Optional[str] = None,
    before: Optional[dict[str, Any]] = None,
    after: Optional[dict[str, Any]] = None,
    note: Optional[str] = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before=before,
            after=after,
            note=note,
        )
    )
    await db.flush()
