from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.enums import SubscriptionPlan, SubscriptionStatus


class BranchCreate(BaseModel):
    name: str
    address: str
    phone: str
    is_main: bool = False


class BranchResponse(BranchCreate):
    id: str
    restaurant_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RestaurantBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    email: str
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "US"
    currency: str = "USD"
    timezone: str = "UTC"


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    is_active: Optional[bool] = None


class SubscriptionResponse(BaseModel):
    id: str
    restaurant_id: str
    plan_type: SubscriptionPlan
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    max_tables: int
    max_menu_items: int

    class Config:
        from_attributes = True


class RestaurantResponse(RestaurantBase):
    id: str
    slug: str
    is_active: bool
    created_at: datetime
    subscription: Optional[SubscriptionResponse] = None

    class Config:
        from_attributes = True
