from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_roles
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.menu import CategoryCreate, CategoryResponse, CategoryUpdate, MenuItemCreate, MenuItemResponse, MenuItemUpdate
from app.services.menu_service import MenuService

router = APIRouter(prefix="/menu", tags=["Menu Management"])


@router.post("/categories", response_model=APIResponse[CategoryResponse])
async def create_category(
    data: CategoryCreate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """Create a new menu category."""
    service = MenuService(db)
    category = await service.create_category(current_user.restaurant_id, data)
    return APIResponse(message="Category created.", data=category)


@router.patch("/categories/{category_id}", response_model=APIResponse[CategoryResponse])
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing category."""
    service = MenuService(db)
    category = await service.update_category(category_id, data)
    return APIResponse(message="Category updated.", data=category)


@router.post("/items", response_model=APIResponse[MenuItemResponse])
async def create_menu_item(
    data: MenuItemCreate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """Create a new menu item with optional variants and addons."""
    service = MenuService(db)
    item = await service.create_menu_item(current_user.restaurant_id, data)
    return APIResponse(message="Menu item created.", data=item)


@router.patch("/items/{item_id}", response_model=APIResponse[MenuItemResponse])
async def update_menu_item(
    item_id: str,
    data: MenuItemUpdate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """Update a menu item."""
    service = MenuService(db)
    item = await service.update_menu_item(item_id, data)
    return APIResponse(message="Menu item updated.", data=item)


@router.delete("/items/{item_id}", response_model=APIResponse[bool])
async def delete_menu_item(
    item_id: str,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a menu item."""
    service = MenuService(db)
    success = await service.delete_menu_item(item_id)
    return APIResponse(message="Menu item deleted.", data=success)
