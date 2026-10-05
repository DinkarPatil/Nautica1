import pytest


@pytest.mark.asyncio
async def test_trade_list(auth_client):
    r = await auth_client.get("/api/trade/documents")
    assert r.status_code == 200
    assert len(r.json()) == 10


@pytest.mark.asyncio
async def test_trade_detail(auth_client):
    items = (await auth_client.get("/api/trade/documents")).json()
    did = items[0]["id"]
    r = await auth_client.get(f"/api/trade/documents/{did}")
    assert r.status_code == 200
    assert r.json()["id"] == did


@pytest.mark.asyncio
async def test_trade_create(auth_client):
    payload = {
        "type": "Bill of Lading",
        "title": "Test BL",
        "vesselName": "MV Test",
        "shipper": "X",
        "consignee": "Y",
        "portOfLoading": "Singapore",
        "portOfDischarge": "Rotterdam",
        "commodity": "Test",
        "value": 10000.0,
        "currency": "USD",
        "status": "Pending",
        "issuedDate": "2026-04-30",
    }
    r = await auth_client.post("/api/trade/documents", json=payload)
    assert r.status_code == 201
    assert r.json()["title"] == "Test BL"


@pytest.mark.asyncio
async def test_trade_approve_admiral_only(auth_client, client):
    items = (await auth_client.get("/api/trade/documents?status=Pending")).json()
    did = items[0]["id"]

    # Admiral can approve
    r = await auth_client.post(f"/api/trade/documents/{did}/approve")
    assert r.status_code == 200
    assert r.json()["status"] == "Verified"

    # A second approval is a conflict
    r = await auth_client.post(f"/api/trade/documents/{did}/approve")
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_trade_approve_forbidden_for_fleet_ops(client):
    r = await client.post(
        "/api/auth/login", json={"email": "manager@glimmora.com", "password": "demo"}
    )
    token = r.json()["access_token"]
    items = (
        await client.get("/api/trade/documents", headers={"Authorization": f"Bearer {token}"})
    ).json()
    did = items[0]["id"]
    r = await client.post(
        f"/api/trade/documents/{did}/approve",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_trade_contract_metadata(auth_client):
    items = (await auth_client.get("/api/trade/documents")).json()
    did = items[0]["id"]
    r = await auth_client.get(f"/api/trade/documents/{did}/contract")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == did
    assert "parties" in body
