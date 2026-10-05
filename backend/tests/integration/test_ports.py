import pytest


@pytest.mark.asyncio
async def test_ports_list(auth_client):
    r = await auth_client.get("/api/ports")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 20
    p = items[0]
    for k in ("id", "name", "country", "unlocode", "lat", "lng", "congestionPct", "throughputTEU"):
        assert k in p


@pytest.mark.asyncio
async def test_port_detail(auth_client):
    r = await auth_client.get("/api/ports/p001")
    assert r.status_code == 200
    assert r.json()["id"] == "p001"


@pytest.mark.asyncio
async def test_port_search_returns_directory(auth_client):
    r = await auth_client.get("/api/ports/search?q=rot")
    assert r.status_code == 200
    items = r.json()
    assert any("Rotterdam" in p["name"] for p in items)
    # Voyage shape uses `lon`, not `lng`
    for p in items:
        assert "lon" in p
        assert "lat" in p


@pytest.mark.asyncio
async def test_port_search_empty_q_returns_first_n(auth_client):
    r = await auth_client.get("/api/ports/search?q=")
    assert r.status_code == 200
    items = r.json()
    assert 1 <= len(items) <= 8


@pytest.mark.asyncio
async def test_dashboard_congestion(auth_client):
    r = await auth_client.get("/api/dashboard/congestion")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 7
    assert all("global" in p and "pacific" in p and "atlantic" in p for p in items)
