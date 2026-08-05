from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field
from app.models.enums import OrderStatus, OrderType, PaymentStatus


class SelectedAddonSchema(BaseModel):
    addon_id: str
    name: str
    price: float
    quantity: int = 1


class OrderItemCreate(BaseModel):
    menu_item_id: str
    variant_id: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    notes: Optional[str] = None
    selected_addons: Optional[List[SelectedAddonSchema]] = []


class OrderCreateRequest(BaseModel):
    restaurant_id: str
    table_id: Optional[str] = None
    order_type: OrderType = OrderType.DINE_IN
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    special_notes: Optional[str] = None
    coupon_code: Optional[str] = None
    items: List[OrderItemCreate] = Field(..., min_items=1)


class OrderItemResponse(BaseModel):
    id: str
    menu_item_id: str
    variant_id: Optional[str] = None
    item_name: str
    variant_name: Optional[str] = None
    unit_price: float
    quantity: int
    total_price: float
    notes: Optional[str] = None
    selected_addons: Optional[Any] = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    reason: Optional[str] = None
    estimated_time_minutes: Optional[int] = None


class FeedbackCreate(BaseModel):
    order_id: str
    overall_rating: int = Field(..., ge=1, le=5)
    food_rating: Optional[int] = Field(None, ge=1, le=5)
    service_rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class FeedbackResponse(FeedbackCreate):
    id: str
    restaurant_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: str
    restaurant_id: str
    branch_id: Optional[str] = None
    table_id: Optional[str] = None
    order_number: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    status: OrderStatus
    order_type: OrderType
    payment_status: PaymentStatus
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    special_notes: Optional[str] = None
    estimated_time_minutes: int
    items: List[OrderItemResponse] = []
    feedback: Optional[FeedbackResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
