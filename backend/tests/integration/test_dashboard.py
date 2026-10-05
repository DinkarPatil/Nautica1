import pytest


@pytest.mark.asyncio
async def test_kpis_returns_aggregates(auth_client):
    r = await auth_client.get("/api/dashboard/kpis")
    assert r.status_code == 200
    body = r.json()
    for k in ("activeVessels", "atPort", "delayed", "flagged", "totalVessels",
              "congestionPct", "riskAlerts", "uptimePct"):
        assert k in body
    assert body["totalVessels"] == 100
    assert body["riskAlerts"] == 15


@pytest.mark.asyncio
async def test_risk_snapshot(auth_client):
    r = await auth_client.get("/api/dashboard/risk-snapshot")
    assert r.status_code == 200
    body = r.json()
    counts = body["counts"]
    assert sum(counts.values()) == 15
    assert isinstance(body["top"], list) and len(body["top"]) <= 5


@pytest.mark.asyncio
async def test_agi_feed(auth_client):
    r = await auth_client.get("/api/dashboard/agi-feed")
    assert r.status_code == 200
    items = r.json()
    assert 1 <= len(items) <= 8
