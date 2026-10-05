"""Pytest fixtures shared across unit + integration tests.

Forces AI_PROVIDER=stub and uses an in-memory SQLite DB per test session.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio


def pytest_collection_modifyitems(config, items):  # noqa: ARG001
    pass


# Force test environment BEFORE settings/cache are read.
os.environ["ENV_FILE"] = str(Path(__file__).resolve().parents[2] / ".env")
os.environ["AI_PROVIDER"] = "stub"
os.environ["DATABASE_URL"] = "sqlite:///./test_glimmora.db"
os.environ["JWT_SECRET"] = os.environ.get("JWT_SECRET", "x" * 48)

# Ensure backend/ is importable
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest_asyncio.fixture(scope="session")
async def _app_db_session():
    """Session-scoped: create tables and seed once."""
    from app.config import reset_settings_cache
    reset_settings_cache()

    db_path = Path("./test_glimmora.db")
    if db_path.exists():
        db_path.unlink()

    from app.db import create_all
    from app.seed.seed_runner import run_seed
    from app.services.llm.registry import reset_provider_for_tests

    reset_provider_for_tests()
    await create_all()
    await run_seed()
    yield
    if db_path.exists():
        try:
            db_path.unlink()
        except OSError:
            pass


@pytest_asyncio.fixture(scope="function")
async def app_db(_app_db_session):
    """Function-scoped: roll back any per-test mutations.

    We restore mutable tables (alerts, voyages, ai_calls, audit_log, etc.) by
    truncating then re-seeding the seed-backed ones; non-seeded mutable tables
    (audit_log, ai_calls, sanctions_screens, agi_runs, voyage_briefs, voyage
    eta snapshots beyond the seed) are simply truncated. This keeps isolation
    cheap and avoids re-creating the engine.
    """
    from sqlalchemy import delete, select
    from app.db import session_scope
    from app.domains.agi.models import AGIDecision, AGIRun
    from app.domains.auth.models import AuthEvent, User
    from app.domains.risk.models import Alert, RiskRegion, SanctionsScreen
    from app.domains.trade.models import TradeDocument
    from app.domains.voyage.models import (
        Ship,
        Voyage,
        VoyageAlert,
        VoyageBriefRow,
        VoyageETASnapshot,
        VoyageEvent,
        VoyageLiveCache,
        VoyageMilestone,
    )
    from app.services.audit.models import AuditLog
    from app.services.llm.models import AICall

    async with session_scope() as db:
        # Always-clean (no seed)
        await db.execute(delete(AuditLog))
        await db.execute(delete(AICall))
        await db.execute(delete(SanctionsScreen))
        await db.execute(delete(AuthEvent))
        await db.execute(delete(VoyageBriefRow))
        await db.execute(delete(VoyageLiveCache))
        await db.execute(delete(AGIRun))

        # Reset seed-backed: alerts, agi_decisions, trades, voyage tree
        await db.execute(delete(Alert))
        await db.execute(delete(AGIDecision))
        await db.execute(delete(TradeDocument))
        await db.execute(delete(VoyageEvent))
        await db.execute(delete(VoyageAlert))
        await db.execute(delete(VoyageETASnapshot))
        await db.execute(delete(VoyageMilestone))
        await db.execute(delete(Voyage))
        # Ships and Users and Ports are read-only references — leave them.

    # Re-seed
    from app.seed.seed_runner import run_seed
    await run_seed()
    yield


@pytest_asyncio.fixture(scope="function")
async def client(app_db):
    """Async HTTP client wired to the FastAPI app, no real network."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(scope="function")
async def auth_client(client):
    """Logged-in client (admiral). Returns the same client with bearer header set."""
    r = await client.post("/api/auth/login", json={"email": "admiral@glimmora.com", "password": "demo"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
