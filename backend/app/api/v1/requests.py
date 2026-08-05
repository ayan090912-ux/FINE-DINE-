from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.customer_request import (
    CustomerRequestCreate,
    CustomerRequestResponse,
    CustomerRequestStatusUpdate,
    RequestAcceptSchema,
    WaitersPerformanceResponse,
)
from app.services.customer_request_service import CustomerRequestService

router = APIRouter(prefix="/requests", tags=["Customer Requests & Waiter Dispatch"])


@router.post("", response_model=APIResponse[CustomerRequestResponse])
async def create_customer_request(
    data: CustomerRequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a customer request from the mobile customer experience."""
    service = CustomerRequestService(db)
    request = await service.create_request(data)
    return APIResponse(message="Request sent to staff.", data=request)


@router.get("", response_model=APIResponse[List[CustomerRequestResponse]])
async def list_customer_requests(
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """List active customer requests for a restaurant."""
    service = CustomerRequestService(db)
    requests = await service.get_active_requests(restaurant_id or "dineflow")
    return APIResponse(message="Active customer requests retrieved.", data=requests)


@router.get("/active", response_model=APIResponse[List[CustomerRequestResponse]])
async def get_active_customer_requests(
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all active customer requests for waiter dispatch terminal."""
    service = CustomerRequestService(db)
    requests = await service.get_active_requests(restaurant_id or "dineflow")
    return APIResponse(message="Active customer requests retrieved.", data=requests)


@router.post("/{request_id}/accept", response_model=APIResponse[CustomerRequestResponse])
async def accept_request(
    request_id: str,
    payload: RequestAcceptSchema,
    db: AsyncSession = Depends(get_db)
):
    """Atomic race-condition free acceptance of a customer request by a waiter."""
    service = CustomerRequestService(db)
    updated_req = await service.accept_request(request_id, payload.waiter_id, payload.waiter_name)
    return APIResponse(message=f"Request accepted by {payload.waiter_name}.", data=updated_req)


@router.post("/{request_id}/in-progress", response_model=APIResponse[CustomerRequestResponse])
async def mark_request_in_progress(
    request_id: str,
    waiter_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Mark an assigned customer request IN_PROGRESS."""
    service = CustomerRequestService(db)
    updated_req = await service.mark_in_progress(request_id, waiter_id)
    return APIResponse(message="Request marked in progress.", data=updated_req)


@router.post("/{request_id}/complete", response_model=APIResponse[CustomerRequestResponse])
async def mark_request_completed(
    request_id: str,
    waiter_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Mark an assigned customer request COMPLETED."""
    service = CustomerRequestService(db)
    updated_req = await service.mark_completed(request_id, waiter_id)
    return APIResponse(message="Request marked completed.", data=updated_req)


@router.patch("/{request_id}/status", response_model=APIResponse[CustomerRequestResponse])
async def update_request_status(
    request_id: str,
    data: CustomerRequestStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update status of a customer request."""
    service = CustomerRequestService(db)
    updated_req = await service.update_status(request_id, data)
    return APIResponse(message=f"Request status updated to {data.status.value}.", data=updated_req)


@router.get("/performance", response_model=APIResponse[WaitersPerformanceResponse])
async def get_waiters_performance(
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve waiter dispatch & performance statistics for Owner Dashboard."""
    service = CustomerRequestService(db)
    stats = await service.get_waiter_performance_stats(restaurant_id or "dineflow")
    return APIResponse(message="Waiter performance statistics retrieved.", data=stats)
