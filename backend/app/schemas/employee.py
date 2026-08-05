from datetime import date, datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from app.models.enums import EmployeeOnlineStatus, EmployeeShift, EmploymentStatus, UserRole


class EmployeeCreate(BaseModel):
    restaurant_id: str = Field(default="dineflow")
    full_name: str = Field(..., min_length=2, max_length=100)
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    role: UserRole = Field(default=UserRole.WAITER)
    position: str = Field(..., min_length=2, max_length=50)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    shift: EmployeeShift = Field(default=EmployeeShift.FULL_TIME)
    notes: Optional[str] = None


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    role: Optional[UserRole] = None
    position: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    shift: Optional[EmployeeShift] = None
    employment_status: Optional[EmploymentStatus] = None
    notes: Optional[str] = None


class EmployeePasswordReset(BaseModel):
    new_password: str = Field(..., min_length=4)


class EmployeeStatusUpdate(BaseModel):
    online_status: EmployeeOnlineStatus


class EmployeeAuthSchema(BaseModel):
    username: str
    password: str
    role: Optional[UserRole] = None


class EmployeeResponse(BaseModel):
    id: str
    restaurant_id: str
    employee_id: str
    full_name: str
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    joining_date: datetime
    role: UserRole
    position: str
    username: str
    employment_status: EmploymentStatus
    shift: EmployeeShift
    online_status: EmployeeOnlineStatus
    last_login_at: Optional[datetime] = None
    last_logout_at: Optional[datetime] = None
    requires_password_change: bool = False
    notes: Optional[str] = None
    current_session_start: Optional[datetime] = None
    today_working_minutes: Optional[int] = 0
    weekly_hours: Optional[int] = 0
    monthly_hours: Optional[int] = 0
    attendance_percentage: Optional[float] = 100.0
    performance: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

