import pytest


@pytest.mark.asyncio
async def test_fleet_list_returns_seeded_vessels(auth_client):
    r = await auth_client.get("/api/fleet/vessels?limit=200")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 100
    assert len(body["items"]) == 100
    sample = body["items"][0]
    for k in ("id", "name", "imo", "flag", "status", "riskScore", "type"):
        assert k in sample


@pytest.mark.asyncio
async def test_fleet_filter_by_status(auth_client):
    r = await auth_client.get("/api/fleet/vessels?status=Delayed")
    assert r.status_code == 200
    items = r.json()["items"]
    assert all(v["status"] == "Delayed" for v in items)


@pytest.mark.asyncio
async def test_fleet_search_by_name(auth_client):
    r = await auth_client.get("/api/fleet/vessels?q=glimmora")
    assert r.status_code == 200
    items = r.json()["items"]
    assert any("glimmora" in v["name"].lower() for v in items)


@pytest.mark.asyncio
async def test_vessel_detail_404(auth_client):
    r = await auth_client.get("/api/fleet/vessels/nonexistent")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "not_found"


@pytest.mark.asyncio
async def test_route_optimize(auth_client):
    items = (await auth_client.get("/api/fleet/vessels?limit=1")).json()["items"]
    vid = items[0]["id"]
    r = await auth_client.post("/api/fleet/route-optimize", json={"vesselId": vid})
    assert r.status_code == 200
    body = r.json()
    assert body["vesselId"] == vid
    assert body["suggestedRoute"]
    assert isinstance(body["fuelSavingPct"], (int, float))
