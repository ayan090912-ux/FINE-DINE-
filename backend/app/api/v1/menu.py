from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.menu import CategoryCreate, CategoryResponse, CategoryUpdate, MenuItemCreate, MenuItemResponse, MenuItemUpdate
from app.services.menu_service import MenuService

router = APIRouter(prefix="/menu", tags=["Menu Management"])


@router.post("/categories", response_model=APIResponse[CategoryResponse])
async def create_category(
    data: CategoryCreate,
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """Create a new menu category."""
    service = MenuService(db)
    category = await service.create_category(restaurant_id, data)
    return APIResponse(message="Category created.", data=category)


@router.patch("/categories/{category_id}", response_model=APIResponse[CategoryResponse])
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing category."""
    service = MenuService(db)
    category = await service.update_category(category_id, data)
    return APIResponse(message="Category updated.", data=category)


@router.delete("/categories/{category_id}", response_model=APIResponse[bool])
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a menu category."""
    service = MenuService(db)
    success = await service.delete_category(category_id)
    return APIResponse(message="Category deleted.", data=success)


@router.post("/items", response_model=APIResponse[MenuItemResponse])
async def create_menu_item(
    data: MenuItemCreate,
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """Create a new menu item with optional variants and addons."""
    service = MenuService(db)
    item = await service.create_menu_item(restaurant_id, data)
    return APIResponse(message="Menu item created.", data=item)


@router.patch("/items/{item_id}", response_model=APIResponse[MenuItemResponse])
async def update_menu_item(
    item_id: str,
    data: MenuItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a menu item."""
    service = MenuService(db)
    item = await service.update_menu_item(item_id, data)
    return APIResponse(message="Menu item updated.", data=item)


@router.delete("/items/{item_id}", response_model=APIResponse[bool])
async def delete_menu_item(
    item_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a menu item."""
    service = MenuService(db)
    success = await service.delete_menu_item(item_id)
    return APIResponse(message="Menu item deleted.", data=success)


import os
import uuid
from fastapi import File, UploadFile
from app.core.exceptions import DineFlowException
from app.core.storage import save_or_upload_media


@router.post("/upload-image", response_model=APIResponse[dict])
async def upload_menu_image(
    file: UploadFile = File(...)
):
    """Upload a food dish image directly."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise DineFlowException(status_code=400, code="INVALID_FILE_TYPE", detail="Only image files are allowed.")

    image_url = await save_or_upload_media(file, "menu")
    return APIResponse(message="Dish image uploaded successfully.", data={"image_url": image_url})

