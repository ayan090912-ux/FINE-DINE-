from typing import Callable, List, Optional
from fastapi import Depends, Header, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException, UnauthorizedException
from app.core.security import decode_token
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user import UserRepository

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """FastAPI dependency to extract and validate current authenticated user from Bearer JWT token."""
    if not credentials or not credentials.credentials:
        raise UnauthorizedException(detail="Authentication token missing")

    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise UnauthorizedException(detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException(detail="Token missing subject claim")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user or not user.is_active:
        raise UnauthorizedException(detail="User account is inactive or deleted")

    return user


def require_roles(allowed_roles: List[UserRole]) -> Callable:
    """RBAC Guard Dependency factory."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user # Super Admin bypasses role checks
        if current_user.role not in allowed_roles:
            raise PermissionDeniedException(
                detail=f"User with role '{current_user.role.value}' is not authorized. Allowed roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker
