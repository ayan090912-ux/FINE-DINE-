from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    email: str
    full_name: str
    role: UserRole
    restaurant_id: Optional[str] = None
    branch_id: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RegisterOwnerRequest(BaseModel):
    restaurant_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=5)
    currency: str = Field(default="USD", max_length=10)
