"""Async SQLAlchemy engine + session factory."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings


class Base(DeclarativeBase):
    """Single declarative base shared by every domain."""

    pass


_settings = get_settings()


def _engine_kwargs() -> dict:
    """Tuned SQLAlchemy engine config.

    For SQLite we enable WAL + a generous busy_timeout so concurrent
    read+write traffic (from Vertex AI loggers running in parallel) doesn't
    trip the "database is locked" error.
    """
    kwargs: dict = {"echo": False, "future": True}
    if _settings.DATABASE_URL.startswith("sqlite"):
        # `timeout` here = sqlite3 busy_timeout in seconds. Long enough to
        # absorb a slow Vertex round-trip while another writer holds the lock.
        kwargs["connect_args"] = {"timeout": 60}
    else:
        kwargs["pool_pre_ping"] = True
    return kwargs


engine = create_async_engine(_settings.DATABASE_URL, **_engine_kwargs())


# Apply WAL + sane pragmas on every fresh connection (SQLite only).
# Using async iter so the very first connection has WAL active before any
# transaction begins.
from sqlalchemy import event  # noqa: E402


@event.listens_for(engine.sync_engine, "connect")
def _enable_sqlite_wal(dbapi_connection, _connection_record):  # noqa: ARG001
    if not _settings.DATABASE_URL.startswith("sqlite"):
        return
    cur = dbapi_connection.cursor()
    try:
        cur.execute("PRAGMA journal_mode=WAL;")
        cur.execute("PRAGMA busy_timeout=60000;")
        cur.execute("PRAGMA synchronous=NORMAL;")
        cur.execute("PRAGMA wal_autocheckpoint=200;")
    finally:
        cur.close()

SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency. Commits on a successful request, rolls back on error."""
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        else:
            await session.commit()
        finally:
            await session.close()


async def create_all() -> None:
    """Lightweight create_all — used when Alembic isn't run (dev/SQLite)."""
    # Import inside the function so models register their metadata first.
    from .domains.auth import models as _auth  # noqa: F401
    from .domains.fleet import models as _fleet  # noqa: F401
    from .domains.ports import models as _ports  # noqa: F401
    from .domains.risk import models as _risk  # noqa: F401
    from .domains.trade import models as _trade  # noqa: F401
    from .domains.agi import models as _agi  # noqa: F401
    from .domains.voyage import models as _voyage  # noqa: F401
    from .services.audit import models as _audit  # noqa: F401
    from .services.llm import models as _llm  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
