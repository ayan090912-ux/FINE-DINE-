import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_owner_and_login(client: AsyncClient):
    # 1. Register Owner
    payload = {
        "restaurant_name": "Gourmet Bistro",
        "email": "owner@gourmet.com",
        "password": "Password123!",
        "full_name": "Chef Auguste",
        "phone": "+15550192834",
        "currency": "USD"
    }

    res = await client.post("/api/v1/auth/register-owner", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["email"] == "owner@gourmet.com"
    assert data["data"]["role"] == "OWNER"

    # 2. Login
    login_payload = {
        "email": "owner@gourmet.com",
        "password": "Password123!"
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert "access_token" in login_data["data"]


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    login_payload = {
        "email": "nonexistent@gourmet.com",
        "password": "WrongPassword!"
    }
    res = await client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 401
    assert res.json()["code"] == "UNAUTHORIZED"
