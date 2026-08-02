from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.order import OrderCreateRequest, OrderResponse, OrderStatusUpdate
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Order Management (Staff & Kitchen)"])


@router.post("", response_model=APIResponse[OrderResponse])
async def create_order(
    data: OrderCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a new order from the customer app or staff POS workflow."""
    service = OrderService(db)
    result = await service.create_order(data)
    return APIResponse(message="Order placed successfully.", data=result)


@router.get("", response_model=APIResponse[List[OrderResponse]])
async def list_orders(
    restaurant_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve active orders for a restaurant without requiring staff login."""
    service = OrderService(db)
    if restaurant_id:
        orders = await service.get_active_orders(restaurant_id)
    else:
        orders = []
    return APIResponse(message="Active orders retrieved.", data=orders)


@router.get("/active", response_model=APIResponse[List[OrderResponse]])
async def get_active_orders(
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.KITCHEN, UserRole.WAITER, UserRole.CASHIER])),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all live/active orders for the restaurant kitchen display and staff."""
    service = OrderService(db)
    orders = await service.get_active_orders(current_user.restaurant_id)
    return APIResponse(message="Active orders retrieved.", data=orders)


@router.patch("/{order_id}/status", response_model=APIResponse[OrderResponse])
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.KITCHEN, UserRole.WAITER, UserRole.CASHIER])),
    db: AsyncSession = Depends(get_db)
):
    """Update order status (PENDING -> CONFIRMED -> PREPARING -> READY -> SERVED -> COMPLETED)."""
    service = OrderService(db)
    updated_order = await service.update_status(order_id, data)
    return APIResponse(message=f"Order status updated to {data.status.value}.", data=updated_order)
