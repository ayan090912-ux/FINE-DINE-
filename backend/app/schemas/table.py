from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class QRCodeResponse(BaseModel):
    id: str
    code_hash: str
    qr_image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class TableBase(BaseModel):
    table_number: str = Field(..., min_length=1, max_length=20)
    name: Optional[str] = None
    capacity: int = Field(default=4, ge=1)
    section: Optional[str] = "Main Dining"


class TableCreate(TableBase):
    branch_id: Optional[str] = None


class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    name: Optional[str] = None
    capacity: Optional[int] = None
    section: Optional[str] = None
    status: Optional[str] = None
    is_occupied: Optional[bool] = None
    is_active: Optional[bool] = None


class TableResponse(TableBase):
    id: str
    restaurant_id: str
    branch_id: Optional[str] = None
    status: str = "VACANT"
    active_session_id: Optional[str] = None
    is_occupied: bool
    is_active: bool
    qr_code: Optional[QRCodeResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TableScanResolution(BaseModel):
    restaurant_id: str
    restaurant_name: str
    restaurant_slug: str
    logo_url: Optional[str] = None
    currency: str
    table_id: str
    table_number: str
    section: Optional[str] = None
    status: str = "OCCUPIED"
    session_id: Optional[str] = None
    session_code: Optional[str] = None
