import pytest


@pytest.mark.asyncio
async def test_alerts_list(auth_client):
    r = await auth_client.get("/api/risk/alerts")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 15
    assert items[0]["severity"] in ("critical", "high", "medium", "low")


@pytest.mark.asyncio
async def test_alerts_create_audited(auth_client):
    r = await auth_client.post(
        "/api/risk/alerts",
        json={"type": "cyber", "severity": "medium", "title": "Test", "description": "x"},
    )
    assert r.status_code == 201
    assert r.json()["title"] == "Test"


@pytest.mark.asyncio
async def test_alerts_create_forbidden_for_port_ops(client):
    r = await client.post(
        "/api/auth/login", json={"email": "port@glimmora.com", "password": "demo"}
    )
    token = r.json()["access_token"]
    r = await client.post(
        "/api/risk/alerts",
        headers={"Authorization": f"Bearer {token}"},
        json={"type": "cyber", "severity": "low", "title": "x", "description": "y"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_risk_regions(auth_client):
    r = await auth_client.get("/api/risk/regions")
    assert r.status_code == 200
    assert len(r.json()) == 10


@pytest.mark.asyncio
async def test_sanctions_screen_returns_envelope(auth_client):
    r = await auth_client.post(
        "/api/risk/sanctions/screen", json={"query": "MV Volga Express", "type": "vessel"}
    )
    assert r.status_code == 200
    body = r.json()
    assert "matched" in body
    assert "hits" in body
    assert "explanation" in body
    assert "source" in body
