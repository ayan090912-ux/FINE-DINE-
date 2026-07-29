from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class DineFlowException(HTTPException):
    """Base exception for all DineFlow domain errors."""
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "An unexpected error occurred.",
        code: str = "INTERNAL_SERVER_ERROR",
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code


class NotFoundException(DineFlowException):
    def __init__(self, resource: str = "Resource", identifier: Any = None):
        detail = f"{resource} with identifier '{identifier}' was not found." if identifier else f"{resource} not found."
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            code="RESOURCE_NOT_FOUND"
        )


class UnauthorizedException(DineFlowException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            code="UNAUTHORIZED",
            headers={"WWW-Authenticate": "Bearer"}
        )


class PermissionDeniedException(DineFlowException):
    def __init__(self, detail: str = "You do not have permission to perform this action."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            code="PERMISSION_DENIED"
        )


class BadRequestException(DineFlowException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            code="BAD_REQUEST"
        )


class ConflictException(DineFlowException):
    def __init__(self, detail: str = "Resource already exists or conflicts with current state."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            code="CONFLICT"
        )


class RateLimitExceededException(DineFlowException):
    def __init__(self, detail: str = "Rate limit exceeded. Please try again later."):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            code="RATE_LIMIT_EXCEEDED"
        )
