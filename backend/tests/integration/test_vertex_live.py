"""Optional live test against Vertex Gemini.

Skipped unless VERTEX_LIVE=1 in env. Used to validate the real provider in CI.
"""

from __future__ import annotations

import os

import pytest


pytestmark = pytest.mark.skipif(
    os.environ.get("VERTEX_LIVE") != "1",
    reason="VERTEX_LIVE not set; skipping live Vertex test",
)


@pytest.mark.asyncio
async def test_voyage_brief_against_vertex(client):
    # Override provider to vertex for this test only.
    os.environ["AI_PROVIDER"] = "vertex"
    from app.config import reset_settings_cache
    from app.services.llm.registry import reset_provider_for_tests

    reset_settings_cache()
    reset_provider_for_tests()

    r = await client.post(
        "/api/auth/login", json={"email": "admiral@glimmora.com", "password": "demo"}
    )
    token = r.json()["access_token"]
    r = await client.get(
        "/api/voyages/v_001/brief", headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["riskBand"] in ("low", "medium", "high")
    assert isinstance(body["recommendation"], str) and len(body["recommendation"]) > 0
