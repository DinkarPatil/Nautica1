import pytest


@pytest.mark.asyncio
async def test_health_no_auth(client):
    r = await client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["db"] is True
    assert body["ai_provider"] in ("vertex", "stub")


@pytest.mark.asyncio
async def test_version(client):
    r = await client.get("/api/version")
    assert r.status_code == 200
    assert "version" in r.json()
