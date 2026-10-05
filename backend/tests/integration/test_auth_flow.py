import pytest


@pytest.mark.asyncio
async def test_login_with_demo_account_succeeds(client):
    r = await client.post("/api/auth/login", json={"email": "admiral@glimmora.com", "password": "demo"})
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["role"] == "executive"
    assert body["user"]["email"] == "admiral@glimmora.com"
    assert body["access_token"] and body["refresh_token"]


@pytest.mark.asyncio
async def test_login_with_bad_credentials_fails(client):
    r = await client.post("/api/auth/login", json={"email": "admiral@glimmora.com", "password": "wrong"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "unauthorized"


@pytest.mark.asyncio
async def test_login_unknown_email_fails(client):
    r = await client.post("/api/auth/login", json={"email": "nobody@glimmora.com", "password": "demo"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    r = await client.get("/api/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_refresh_returns_access_token(client):
    r = await client.post("/api/auth/login", json={"email": "admiral@glimmora.com", "password": "demo"})
    refresh = r.json()["refresh_token"]
    r = await client.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 200
    assert r.json()["access_token"]


@pytest.mark.asyncio
async def test_refresh_rejects_garbage(client):
    r = await client.post("/api/auth/refresh", json={"refresh_token": "nope"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_session_cookie_works_when_no_bearer(client):
    r = await client.post("/api/auth/login", json={"email": "admiral@glimmora.com", "password": "demo"})
    user = r.json()["user"]
    # Simulate the existing frontend cookie
    import json
    from urllib.parse import quote
    cookie_value = quote(json.dumps({"role": user["role"], "id": user["id"]}))
    r = await client.get("/api/auth/me", cookies={"glimmora_session": cookie_value})
    assert r.status_code == 200
    assert r.json()["id"] == user["id"]
