from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
from app.models.enums import RequestStatus, RequestType


class CustomerRequestCreate(BaseModel):
    restaurant_id: str
    table_id: str
    request_type: RequestType = RequestType.WAITER
    notes: Optional[str] = None


class RequestAcceptSchema(BaseModel):
    waiter_id: Optional[str] = None
    waiter_name: str


class CustomerRequestStatusUpdate(BaseModel):
    status: RequestStatus


class CustomerRequestResponse(BaseModel):
    id: str
    restaurant_id: str
    table_id: str
    session_id: Optional[str] = None
    request_type: RequestType
    status: RequestStatus
    notes: Optional[str] = None
    assigned_waiter_id: Optional[str] = None
    assigned_waiter_name: Optional[str] = None
    accepted_at: Optional[datetime] = None
    in_progress_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WaiterPerformanceStats(BaseModel):
    waiter_id: str
    waiter_name: str
    requests_accepted: int = 0
    requests_completed: int = 0
    avg_response_time_seconds: float = 0.0
    avg_completion_time_seconds: float = 0.0
    water_requests: int = 0
    spoon_requests: int = 0
    tissue_requests: int = 0
    bill_requests: int = 0
    waiter_calls: int = 0


class WaitersPerformanceResponse(BaseModel):
    total_pending_requests: int
    total_accepted_requests: int
    total_completed_requests: int
    overall_avg_response_time_seconds: float
    waiters: List[WaiterPerformanceStats]
