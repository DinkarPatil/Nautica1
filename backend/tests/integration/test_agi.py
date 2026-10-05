import pytest


@pytest.mark.asyncio
async def test_agi_decisions_list(auth_client):
    r = await auth_client.get("/api/agi/decisions")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 20
    for d in items:
        assert "category" in d and "priority" in d and "confidence" in d


@pytest.mark.asyncio
async def test_agi_filter_by_category(auth_client):
    r = await auth_client.get("/api/agi/decisions?category=Risk Warning")
    assert r.status_code == 200
    assert all(d["category"] == "Risk Warning" for d in r.json())


@pytest.mark.asyncio
async def test_agi_model_status(auth_client):
    r = await auth_client.get("/api/agi/model-status")
    assert r.status_code == 200
    body = r.json()
    assert body["provider"] in ("vertex", "stub")
    assert body["model"]


@pytest.mark.asyncio
async def test_agi_execute(auth_client):
    decisions = (await auth_client.get("/api/agi/decisions")).json()
    did = decisions[0]["id"]
    r = await auth_client.post(f"/api/agi/decisions/{did}/execute")
    assert r.status_code == 200
    assert r.json()["executed"] is True

    # Second execute is a conflict
    r = await auth_client.post(f"/api/agi/decisions/{did}/execute")
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_agi_analyze_creates_run_and_decisions(auth_client):
    r = await auth_client.post("/api/agi/analyze")
    assert r.status_code == 200
    body = r.json()
    assert body["runId"]
    assert isinstance(body["decisions"], list) and len(body["decisions"]) >= 1
    for d in body["decisions"]:
        assert d["confidence"] >= 0


@pytest.mark.asyncio
async def test_agi_analyze_forbidden_for_trade_intel(client):
    r = await client.post(
        "/api/auth/login", json={"email": "trader@glimmora.com", "password": "demo"}
    )
    token = r.json()["access_token"]
    r = await client.post("/api/agi/analyze", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403
