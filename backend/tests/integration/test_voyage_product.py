"""Integration tests for the voyage-only product endpoints."""

import pytest


# ─── Readiness ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_readiness_requires_origin_destination(auth_client):
    r = await auth_client.post(
        "/api/voyages/readiness",
        json={
            "shipName": "MV Test",
            "imo": "",
            "voyageType": "Container",
            "plannedDeparture": "",
            "plannedArrival": "",
            "sensitivity": "Strict",
            "trackingMode": "Real-time",
            "alertPreference": "Full intelligence",
            "cargoPriority": "",
            "delayToleranceMin": "",
            "preferredRoute": "",
            "watchlistCompany": "",
            "notes": "",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["canStart"] is False
    fields = {f["field"]: f["status"] for f in body["factors"]}
    assert fields["origin"] == "missing"
    assert fields["destination"] == "missing"


@pytest.mark.asyncio
async def test_readiness_complete_draft(auth_client):
    r = await auth_client.post(
        "/api/voyages/readiness",
        json={
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
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["canStart"] is True
    assert body["band"] == "green"
    assert body["score"] >= 90


# ─── Setup Copilot ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_copilot_returns_envelope(auth_client):
    r = await auth_client.post(
        "/api/voyages/copilot",
        json={
            "shipName": "MV Copilot",
            "imo": "",
            "voyageType": "",
            "plannedDeparture": "2026-04-26T04:00:00Z",
            "plannedArrival": "",
            "sensitivity": "",
            "trackingMode": "",
            "alertPreference": "",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert "suggestions" in body
    # nextQuestion may be None or a string in the stub; the field exists either way.
    assert isinstance(body["suggestions"], list)


# ─── State machine ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_voyage_records_state_transitions(auth_client):
    payload = _full_draft(shipName="MV State")
    r = await auth_client.post("/api/voyages", json=payload)
    assert r.status_code == 201
    vid = r.json()["id"]

    r = await auth_client.get(f"/api/voyages/{vid}")
    assert r.json()["status"] == "in_transit"

    r = await auth_client.get(f"/api/voyages/{vid}/transitions")
    assert r.status_code == 200
    rows = r.json()
    assert [t["toState"] for t in rows] == ["ready", "active", "in_transit"]


@pytest.mark.asyncio
async def test_start_endpoint_idempotent_reject_after_transit(auth_client):
    payload = _full_draft(shipName="MV Already Active")
    vid = (await auth_client.post("/api/voyages", json=payload)).json()["id"]
    # Already in_transit — start should 409
    r = await auth_client.post(f"/api/voyages/{vid}/start")
    assert r.status_code == 409


# ─── Alert lifecycle + resolve ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_alert_resolve_lifecycle(auth_client):
    # The seed inserted v_001 with alerts a_1, a_2, a_3.
    r = await auth_client.post("/api/voyages/v_001/alerts/a_1/resolve")
    assert r.status_code == 200
    assert r.json()["lifecycle"] == "resolved"

    # Second resolve is a conflict
    r = await auth_client.post("/api/voyages/v_001/alerts/a_1/resolve")
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_alerts_list_includes_lifecycle(auth_client):
    r = await auth_client.get("/api/voyages/v_001/alerts")
    assert r.status_code == 200
    items = r.json()
    for a in items:
        assert "lifecycle" in a
        assert a["lifecycle"] in ("new", "acknowledged", "resolved")


# ─── ETA narrator ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_eta_series_has_narrations(auth_client):
    r = await auth_client.get("/api/voyages/v_001/eta-series")
    assert r.status_code == 200
    arr = r.json()
    assert len(arr) >= 2
    for s in arr:
        assert "narration" in s


# ─── Storyline ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_storyline_has_envelope(auth_client):
    r = await auth_client.get("/api/voyages/v_001/storyline")
    assert r.status_code == 200
    body = r.json()
    assert body["voyageId"] == "v_001"
    assert "chapters" in body
    assert "generatedAt" in body


# ─── Triage ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_triage_envelope_for_seed_voyage(auth_client):
    r = await auth_client.get("/api/voyages/v_001/alerts/triage")
    assert r.status_code == 200
    body = r.json()
    assert body["voyageId"] == "v_001"
    assert "items" in body


# ─── Scorecard ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_scorecard_returns_three_components(auth_client):
    r = await auth_client.get("/api/voyages/v_001/scorecard")
    assert r.status_code == 200
    body = r.json()
    assert body["voyageId"] == "v_001"
    assert body["grade"] in ("A", "B", "C", "D", "F")
    assert 0 <= body["overall"] <= 100
    assert len(body["components"]) == 3
    names = {c["name"] for c in body["components"]}
    assert names == {"punctuality", "routeAdherence", "operationalSmoothness"}


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _full_draft(**overrides):
    base = {
        "shipName": "MV Default",
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
    base.update(overrides)
    return base
