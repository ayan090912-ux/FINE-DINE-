from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.enums import DiscountType


class CouponCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=30)
    discount_type: DiscountType = DiscountType.PERCENTAGE
    value: float = Field(..., gt=0.0)
    min_order_value: float = Field(default=0.0, ge=0.0)
    max_discount_amount: Optional[float] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: bool = True


class CouponResponse(CouponCreate):
    id: str
    restaurant_id: str
    used_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class TaxCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    percentage: float = Field(..., ge=0.0, le=100.0)
    is_inclusive: bool = False
    is_active: bool = True


class TaxResponse(TaxCreate):
    id: str
    restaurant_id: str
    created_at: datetime

    class Config:
        from_attributes = True
