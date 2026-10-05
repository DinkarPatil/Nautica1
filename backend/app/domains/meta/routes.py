from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ... import __version__
from ...config import get_settings
from ...db import get_db

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)) -> dict:
    s = get_settings()
    db_ok = True
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "db": db_ok,
        "ai_provider": s.resolved_provider,
        "model": s.GEMINI_MODEL,
        "model_pro": s.GEMINI_MODEL_PRO,
        "version": __version__,
        "env": s.ENV,
    }


@router.get("/version")
async def version() -> dict:
    return {"version": __version__, "name": "glimmora-nautica-backend"}
