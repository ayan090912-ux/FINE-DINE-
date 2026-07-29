from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.enums import RequestStatus, RequestType


class CustomerRequestCreate(BaseModel):
    restaurant_id: str
    table_id: str
    request_type: RequestType = RequestType.WAITER
    notes: Optional[str] = None


class CustomerRequestStatusUpdate(BaseModel):
    status: RequestStatus


class CustomerRequestResponse(BaseModel):
    id: str
    restaurant_id: str
    table_id: str
    request_type: RequestType
    status: RequestStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
