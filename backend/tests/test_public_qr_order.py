import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_public_menu_and_order_accept_restaurant_slug(client: AsyncClient):
    reg_res = await client.post("/api/v1/auth/register-owner", json={
        "restaurant_name": "Northwind Bistro",
        "email": "northwind@bistro.com",
        "password": "Password123!",
        "full_name": "Jane Doe",
        "phone": "+15551239999"
    })
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    cat_res = await client.post("/api/v1/menu/categories", headers=headers, json={
        "name": "Breakfast",
        "description": "Morning menu"
    })
    category_id = cat_res.json()["data"]["id"]

    item_res = await client.post("/api/v1/menu/items", headers=headers, json={
        "category_id": category_id,
        "name": "Avocado Toast",
        "description": "Toasted sourdough with avocado",
        "price": 8.50,
        "is_veg": True,
        "is_spicy": False
    })
    item_id = item_res.json()["data"]["id"]

    table_res = await client.post("/api/v1/tables", headers=headers, json={
        "table_number": "T-07",
        "capacity": 2,
        "section": "Indoor"
    })
    table_data = table_res.json()["data"]
    table_id = table_data["id"]

    menu_res = await client.get("/api/v1/public/menu/northwind-bistro")
    assert menu_res.status_code == 200
    assert menu_res.json()["data"]["restaurant_name"] == "Northwind Bistro"

    order_res = await client.post("/api/v1/public/orders", json={
        "restaurant_id": "northwind-bistro",
        "table_id": table_id,
        "order_type": "DINE_IN",
        "items": [{"menu_item_id": item_id, "quantity": 1}]
    })
    assert order_res.status_code == 200
    assert order_res.json()["data"]["restaurant_id"] is not None


@pytest.mark.asyncio
async def test_full_customer_qr_ordering_flow(client: AsyncClient):
    # Setup Owner and Restaurant
    reg_res = await client.post("/api/v1/auth/register-owner", json={
        "restaurant_name": "Taco Fiesta",
        "email": "tacos@fiesta.com",
        "password": "Password123!",
        "full_name": "Maria Garcia",
        "phone": "+15551234567"
    })
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Owner creates Category
    cat_res = await client.post("/api/v1/menu/categories", headers=headers, json={
        "name": "Tacos",
        "description": "Authentic Mexican Tacos"
    })
    category_id = cat_res.json()["data"]["id"]

    # Owner creates Menu Item
    item_res = await client.post("/api/v1/menu/items", headers=headers, json={
        "category_id": category_id,
        "name": "Street Beef Taco",
        "description": "Grilled carne asada taco",
        "price": 4.50,
        "is_veg": False,
        "is_spicy": True
    })
    item_id = item_res.json()["data"]["id"]

    # Owner creates Table
    table_res = await client.post("/api/v1/tables", headers=headers, json={
        "table_number": "T-05",
        "capacity": 4,
        "section": "Patio"
    })
    table_data = table_res.json()["data"]
    table_id = table_data["id"]
    code_hash = table_data["qr_code"]["code_hash"]

    # 1. Customer Scans QR Code (No Login)
    qr_res = await client.get(f"/api/v1/public/qr/{code_hash}")
    assert qr_res.status_code == 200
    qr_info = qr_res.json()["data"]
    assert qr_info["table_number"] == "T-05"
    restaurant_id = qr_info["restaurant_id"]

    # 2. Customer Fetches Menu (No Login)
    menu_res = await client.get(f"/api/v1/public/menu/{restaurant_id}")
    assert menu_res.status_code == 200
    menu_data = menu_res.json()["data"]
    assert len(menu_data["categories"]) >= 1

    # 3. Customer Places Order (No Login)
    order_res = await client.post("/api/v1/public/orders", json={
        "restaurant_id": restaurant_id,
        "table_id": table_id,
        "order_type": "DINE_IN",
        "customer_name": "Carlos",
        "special_notes": "Extra salsa on the side",
        "items": [
            {
                "menu_item_id": item_id,
                "quantity": 3
            }
        ]
    })
    assert order_res.status_code == 200
    order_info = order_res.json()["data"]
    assert order_info["status"] == "PENDING"
    assert order_info["subtotal"] == 13.50 # 3 * 4.50

    # 4. Customer Calls Waiter (No Login)
    req_res = await client.post("/api/v1/public/request-service", json={
        "restaurant_id": restaurant_id,
        "table_id": table_id,
        "request_type": "WATER",
        "notes": "Glass of ice water please"
    })
    assert req_res.status_code == 200
    assert req_res.json()["data"]["status"] == "PENDING"
