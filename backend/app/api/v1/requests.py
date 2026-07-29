from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_roles
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.customer_request import CustomerRequestResponse, CustomerRequestStatusUpdate
from app.services.customer_request_service import CustomerRequestService

router = APIRouter(prefix="/requests", tags=["Customer Requests (Waiter Calls)"])


@router.get("/active", response_model=APIResponse[List[CustomerRequestResponse]])
async def get_active_customer_requests(
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER])),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all active customer requests (Waiter, Bill, Water, Tissue, Spoon)."""
    service = CustomerRequestService(db)
    requests = await service.get_active_requests(current_user.restaurant_id)
    return APIResponse(message="Active customer requests retrieved.", data=requests)


@router.patch("/{request_id}/status", response_model=APIResponse[CustomerRequestResponse])
async def update_request_status(
    request_id: str,
    data: CustomerRequestStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER])),
    db: AsyncSession = Depends(get_db)
):
    """Update status of a customer request (ACKNOWLEDGED or RESOLVED)."""
    service = CustomerRequestService(db)
    updated_req = await service.update_status(request_id, data)
    return APIResponse(message=f"Request status updated to {data.status.value}.", data=updated_req)
