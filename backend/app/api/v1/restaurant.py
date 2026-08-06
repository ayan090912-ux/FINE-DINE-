import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import DineFlowException
from app.schemas.common import APIResponse
from app.schemas.restaurant import RestaurantResponse, RestaurantUpdate
from app.services.restaurant_service import RestaurantService

router = APIRouter(prefix="/restaurant", tags=["Restaurant Management & Settings"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "restaurant")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/settings/{restaurant_id}", response_model=APIResponse[RestaurantResponse])
async def get_restaurant_settings(
    restaurant_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full restaurant profile, branding, and currency settings."""
    service = RestaurantService(db)
    restaurant = await service.restaurant_repo.get_by_identifier(restaurant_id)
    if not restaurant:
        restaurant = await service.get_restaurant("dineflow")
    return APIResponse(message="Restaurant settings fetched successfully.", data=restaurant)


@router.patch("/settings/{restaurant_id}", response_model=APIResponse[RestaurantResponse])
async def update_restaurant_settings(
    restaurant_id: str,
    data: RestaurantUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update restaurant branding, contact info, currency, tax rates, and settings."""
    service = RestaurantService(db)
    restaurant = await service.update_restaurant(restaurant_id, data)
    return APIResponse(message="Restaurant settings updated successfully.", data=restaurant)


@router.post("/upload-image", response_model=APIResponse[dict])
async def upload_restaurant_image(
    file: UploadFile = File(...)
):
    """Upload a restaurant logo, cover, banner, or brand asset image."""
    if not file.content_type.startswith("image/"):
        raise DineFlowException(status_code=400, code="INVALID_FILE_TYPE", detail="Only image files are allowed.")

    filename_ext = os.path.splitext(file.filename)[1] or ".png"
    unique_filename = f"{uuid.uuid4().hex}{filename_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    image_url = f"/uploads/restaurant/{unique_filename}"
    return APIResponse(message="Image uploaded successfully.", data={"image_url": image_url})
