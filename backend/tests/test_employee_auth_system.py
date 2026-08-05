import io
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_employee_auth_and_attendance_lifecycle(client: AsyncClient):
    # 1. Verify no demo employees pre-seeded
    list_resp = await client.get("/api/v1/employees?restaurant_id=dineflow")
    assert list_resp.status_code == 200
    employees = list_resp.json()
    assert len(employees) == 0, "Expected zero pre-seeded demo employees in clean database"

    # 2. Owner creates a Waiter employee
    create_waiter_payload = {
        "restaurant_id": "dineflow",
        "full_name": "Rahul Das",
        "role": "WAITER",
        "position": "Head Waiter",
        "username": "rahul_waiter",
        "password": "Password123!",
        "shift": "FULL_TIME",
        "phone_number": "+91 9876543210",
        "email": "rahul@restaurant.com"
    }
    create_resp = await client.post("/api/v1/employees", json=create_waiter_payload)
    assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
    waiter_data = create_resp.json()
    waiter_id = waiter_data["id"]
    assert waiter_data["full_name"] == "Rahul Das"
    assert waiter_data["username"] == "rahul_waiter"
    assert waiter_data["online_status"] == "OFFLINE"
    assert "password_hash" not in waiter_data
    assert "password" not in waiter_data

    # 3. Owner uploads Waiter photo
    fake_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01")
    upload_resp = await client.post(
        f"/api/v1/employees/{waiter_id}/photo",
        files={"file": ("waiter_photo.png", fake_image, "image/png")}
    )
    assert upload_resp.status_code == 200, f"Upload photo failed: {upload_resp.text}"
    upload_data = upload_resp.json()
    assert "photo_url" in upload_data
    assert upload_data["photo_url"].startswith("/uploads/employees/")

    # 4. Waiter logs in using assigned credentials
    login_payload = {
        "username": "rahul_waiter",
        "password": "Password123!",
        "role": "WAITER"
    }
    login_resp = await client.post("/api/v1/employees/auth", json=login_payload)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    logged_waiter = login_resp.json()
    assert logged_waiter["online_status"] == "ONLINE"
    assert logged_waiter["last_login_at"] is not None
    assert logged_waiter["current_session_start"] is not None

    # 5. Owner checks status: Waiter is ONLINE & timer running
    get_waiter_resp = await client.get(f"/api/v1/employees/{waiter_id}")
    assert get_waiter_resp.status_code == 200
    current_waiter = get_waiter_resp.json()
    assert current_waiter["online_status"] == "ONLINE"
    assert current_waiter["current_session_start"] is not None

    # 6. Waiter logs out
    logout_resp = await client.post(f"/api/v1/employees/{waiter_id}/logout")
    assert logout_resp.status_code == 200
    offline_waiter = logout_resp.json()
    assert offline_waiter["online_status"] == "OFFLINE"
    assert offline_waiter["last_logout_at"] is not None

    # 7. Owner creates Kitchen Staff employee
    create_kitchen_payload = {
        "restaurant_id": "dineflow",
        "full_name": "Marcus Vance",
        "role": "KITCHEN",
        "position": "Head Chef",
        "username": "marcus_chef",
        "password": "ChefPassword123!",
        "shift": "FULL_TIME"
    }
    kitchen_create_resp = await client.post("/api/v1/employees", json=create_kitchen_payload)
    assert kitchen_create_resp.status_code == 201
    kitchen_id = kitchen_create_resp.json()["id"]

    # 8. Role Mismatch Prevention: Kitchen account cannot log in on Waiter terminal
    mismatch_login_resp = await client.post("/api/v1/employees/auth", json={
        "username": "marcus_chef",
        "password": "ChefPassword123!",
        "role": "WAITER"
    })
    assert mismatch_login_resp.status_code in (401, 403), "Kitchen user should not log in as WAITER"

    # 9. Kitchen staff logs into Kitchen terminal successfully
    kitchen_login_resp = await client.post("/api/v1/employees/auth", json={
        "username": "marcus_chef",
        "password": "ChefPassword123!",
        "role": "KITCHEN"
    })
    assert kitchen_login_resp.status_code == 200
    assert kitchen_login_resp.json()["online_status"] == "ONLINE"
