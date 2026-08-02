import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_public_order_creation_via_orders_endpoint(client: AsyncClient):
    reg_res = await client.post(
        "/api/v1/auth/register-owner",
        json={
            "restaurant_name": "Northwind",
            "email": "northwind@example.com",
            "password": "Password123!",
            "full_name": "Ada Lovelace",
            "phone": "+15551234567",
        },
    )
    assert reg_res.status_code == 200
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    category_res = await client.post(
        "/api/v1/menu/categories",
        headers=headers,
        json={"name": "Dinner", "description": "Dinner service"},
    )
    assert category_res.status_code == 200
    category_id = category_res.json()["data"]["id"]

    item_res = await client.post(
        "/api/v1/menu/items",
        headers=headers,
        json={
            "category_id": category_id,
            "name": "Seasonal Pasta",
            "description": "Pasta bowl",
            "price": 12.5,
            "is_veg": True,
            "is_spicy": False,
        },
    )
    assert item_res.status_code == 200
    item_id = item_res.json()["data"]["id"]

    table_res = await client.post(
        "/api/v1/tables",
        headers=headers,
        json={"table_number": "B-08", "capacity": 4, "section": "Indoor"},
    )
    assert table_res.status_code == 200
    table_id = table_res.json()["data"]["id"]
    restaurant_id = reg_res.json()["data"]["restaurant_id"]

    order_res = await client.post(
        "/api/v1/orders",
        json={
            "restaurant_id": restaurant_id,
            "table_id": table_id,
            "order_type": "DINE_IN",
            "customer_name": "Guest",
            "items": [{"menu_item_id": item_id, "quantity": 2}],
        },
    )

    assert order_res.status_code == 200
    assert order_res.json()["data"]["restaurant_id"] == restaurant_id
    assert order_res.json()["data"]["items"][0]["quantity"] == 2
