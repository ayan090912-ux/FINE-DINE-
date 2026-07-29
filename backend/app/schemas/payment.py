from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.enums import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    order_id: str
    payment_method: PaymentMethod = PaymentMethod.CASH
    amount: float = Field(..., ge=0.0)
    transaction_reference: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    restaurant_id: str
    amount: float
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
