from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_roles
from app.core.database import get_db
from app.core.exceptions import ConflictException
from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.common import APIResponse
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/staff", tags=["Staff & Role Management"])


@router.post("", response_model=APIResponse[UserResponse])
async def create_staff_user(
    data: UserCreate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """Create a new staff member (Manager, Kitchen, Waiter, Cashier)."""
    repo = UserRepository(db)
    existing = await repo.get_by_email(data.email)
    if existing:
        raise ConflictException(detail="A user with this email already exists.")

    user_data = data.model_dump(exclude={"password"})
    user_data["password_hash"] = hash_password(data.password)
    user_data["restaurant_id"] = current_user.restaurant_id

    new_user = await repo.create(user_data)
    return APIResponse(message="Staff member created successfully.", data=UserResponse.model_validate(new_user))


@router.get("", response_model=APIResponse[List[UserResponse]])
async def list_staff_members(
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """List all staff users working in this restaurant."""
    repo = UserRepository(db)
    staff = await repo.get_all(filters={"restaurant_id": current_user.restaurant_id})
    return APIResponse(message="Staff list retrieved.", data=[UserResponse.model_validate(u) for u in staff])
