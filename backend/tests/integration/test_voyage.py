import pytest


@pytest.mark.asyncio
async def test_voyage_list_includes_seed(auth_client):
    r = await auth_client.get("/api/voyages")
    assert r.status_code == 200
    items = r.json()
    assert any(v["id"] == "v_001" for v in items)


@pytest.mark.asyncio
async def test_voyage_detail_shape(auth_client):
    r = await auth_client.get("/api/voyages/v_001")
    assert r.status_code == 200
    body = r.json()
    for k in (
        "id", "ship", "origin", "destination", "plannedDeparture",
        "status", "phase", "sensitivity", "trackingMode", "alertPreference",
        "routePlanned", "createdAt", "updatedAt",
    ):
        assert k in body, k
    assert body["origin"]["unlocode"] == "ESALG"
    assert body["destination"]["unlocode"] == "NLRTM"


@pytest.mark.asyncio
async def test_voyage_live(auth_client):
    r = await auth_client.get("/api/voyages/v_001/live")
    assert r.status_code == 200
    body = r.json()
    for k in ("voyageId", "position", "sog", "currentETA", "etaDeltaMin", "riskScore", "riskBand", "phase", "asOf"):
        assert k in body
    assert body["riskBand"] in ("low", "medium", "high")


@pytest.mark.asyncio
async def test_voyage_events(auth_client):
    r = await auth_client.get("/api/voyages/v_001/events")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 5
    assert all("category" in e and "title" in e for e in items)


@pytest.mark.asyncio
async def test_voyage_alerts_and_ack(auth_client):
    r = await auth_client.get("/api/voyages/v_001/alerts")
    assert r.status_code == 200
    items = r.json()
    aid = items[0]["id"]
    r = await auth_client.post(f"/api/voyages/v_001/alerts/{aid}/acknowledge")
    assert r.status_code == 200
    assert r.json()["acknowledged"] is True


@pytest.mark.asyncio
async def test_voyage_brief_validates_schema(auth_client):
    r = await auth_client.get("/api/voyages/v_001/brief")
    assert r.status_code == 200
    body = r.json()
    for k in ("voyageId", "asOf", "whatIsHappening", "whatChanged", "whyETAMoved", "riskBand", "recommendation", "riskFactors"):
        assert k in body
    assert body["riskBand"] in ("low", "medium", "high")
    assert isinstance(body["riskFactors"], list)


@pytest.mark.asyncio
async def test_voyage_eta_series(auth_client):
    r = await auth_client.get("/api/voyages/v_001/eta-series")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 2
    for s in items:
        assert "ts" in s and "eta" in s


@pytest.mark.asyncio
async def test_voyage_attribution(auth_client):
    r = await auth_client.get("/api/voyages/v_001/attribution")
    assert r.status_code == 200
    body = r.json()
    factors = body["factors"]
    keys = {f["key"] for f in factors}
    assert keys == {"weather", "congestion", "speed", "routing"}
    assert sum(f["weightPct"] for f in factors) == 100


@pytest.mark.asyncio
async def test_voyage_milestones(auth_client):
    r = await auth_client.get("/api/voyages/v_001/milestones")
    assert r.status_code == 200
    assert len(r.json()) >= 3


@pytest.mark.asyncio
async def test_voyage_insight(auth_client):
    r = await auth_client.get("/api/voyages/v_001/insight")
    assert r.status_code == 200
    assert r.json()["insight"]


@pytest.mark.asyncio
async def test_voyage_report(auth_client):
    r = await auth_client.get("/api/voyages/v_001/report")
    assert r.status_code == 200
    body = r.json()
    for k in ("voyage", "routeNm", "summary", "etaSeries", "events", "alerts", "attribution", "milestones", "finalRiskScore", "aiConclusion"):
        assert k in body


@pytest.mark.asyncio
async def test_voyage_chat(auth_client):
    r = await auth_client.post("/api/voyages/v_001/chat", json={"message": "When will we arrive?"})
    assert r.status_code == 200
    body = r.json()
    assert body["answer"]
    assert isinstance(body["citations"], list)


@pytest.mark.asyncio
async def test_ship_lookup(auth_client):
    r = await auth_client.get("/api/ships/lookup?imo=9876543")
    assert r.status_code == 200
    body = r.json()
    assert body["matched"] is True
    assert body["ship"]["name"]


@pytest.mark.asyncio
async def test_ship_lookup_no_match(auth_client):
    r = await auth_client.get("/api/ships/lookup?imo=0000000")
    assert r.status_code == 200
    assert r.json()["matched"] is False


@pytest.mark.asyncio
async def test_voyage_create_round_trip(auth_client):
    payload = {
        "shipName": "MV Test",
        "imo": "1234567",
        "voyageType": "Container",
        "origin": {"id": "p_alg", "unlocode": "ESALG", "name": "Algeciras", "country": "ES", "lat": 36.14, "lon": -5.45},
        "destination": {"id": "p_rtm", "unlocode": "NLRTM", "name": "Rotterdam", "country": "NL", "lat": 51.92, "lon": 4.48},
        "plannedDeparture": "2026-04-26T04:00:00Z",
        "plannedArrival": "2026-05-02T12:24:00Z",
        "sensitivity": "Strict",
        "trackingMode": "Real-time",
        "alertPreference": "Full intelligence",
        "cargoPriority": "High",
        "delayToleranceMin": "60",
    }
    r = await auth_client.post("/api/voyages", json=payload)
    assert r.status_code == 201
    new_id = r.json()["id"]

    r = await auth_client.get(f"/api/voyages/{new_id}")
    assert r.status_code == 200
    body = r.json()
    assert body["ship"]["name"] == "MV Test"
    assert body["sensitivity"] == "strict"
