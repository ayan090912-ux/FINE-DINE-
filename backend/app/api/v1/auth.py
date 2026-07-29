from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterOwnerRequest, TokenResponse
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register-owner", response_model=APIResponse[TokenResponse])
async def register_owner(
    data: RegisterOwnerRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new restaurant owner and create initial restaurant & trial subscription."""
    service = AuthService(db)
    result = await service.register_owner(data)
    return APIResponse(
        message="Restaurant owner registered successfully.",
        data=result
    )


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate restaurant staff or owner and return JWT tokens."""
    service = AuthService(db)
    result = await service.login(data)
    return APIResponse(
        message="Login successful.",
        data=result
    )


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Obtain new access token using a valid refresh token."""
    service = AuthService(db)
    result = await service.refresh_tokens(data.refresh_token)
    return APIResponse(
        message="Tokens refreshed successfully.",
        data=result
    )
