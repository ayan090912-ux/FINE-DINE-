from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.table import TableCreate, TableResponse, TableUpdate
from app.services.session_service import SessionService
from app.services.table_qr_service import TableQRService

router = APIRouter(prefix="/tables", tags=["Table & Session Management"])


@router.post("", response_model=APIResponse[TableResponse])
async def create_table(
    data: TableCreate,
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """Add a table to restaurant and auto-generate its unique QR code."""
    service = TableQRService(db)
    table = await service.create_table(restaurant_id, data)
    return APIResponse(message="Table created with unique QR code.", data=table)


@router.get("", response_model=APIResponse[List[TableResponse]])
async def get_tables(
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """List all dining tables for the restaurant with live statuses and active sessions."""
    service = TableQRService(db)
    tables = await service.get_tables_for_restaurant(restaurant_id or "dineflow")
    return APIResponse(message="Tables retrieved.", data=tables)


@router.patch("/{table_id}", response_model=APIResponse[TableResponse])
async def update_table(
    table_id: str,
    data: TableUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update table details or occupation status."""
    service = TableQRService(db)
    table = await service.update_table(table_id, data)
    return APIResponse(message="Table updated.", data=table)


@router.delete("/{table_id}", response_model=APIResponse[bool])
async def delete_table(
    table_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a dining table."""
    service = TableQRService(db)
    success = await service.delete_table(table_id)
    return APIResponse(message="Table deleted.", data=success)


@router.post("/{table_id}/close-session", response_model=APIResponse[bool])
async def vacate_table(
    table_id: str,
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """Close current dining session and vacate table."""
    service = SessionService(db)
    success = await service.close_session_and_vacate_table(restaurant_id or "dineflow", table_id)
    return APIResponse(message="Table vacated and session archived.", data=success)


@router.post("/{table_id}/reserve", response_model=APIResponse[TableResponse])
async def reserve_table(
    table_id: str,
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """Mark table as RESERVED."""
    service = SessionService(db)
    table = await service.reserve_table(restaurant_id or "dineflow", table_id)
    return APIResponse(message="Table reserved.", data=table)


@router.post("/{table_id}/unreserve", response_model=APIResponse[TableResponse])
async def unreserve_table(
    table_id: str,
    restaurant_id: Optional[str] = Query(default="dineflow"),
    db: AsyncSession = Depends(get_db)
):
    """Unreserve table and mark as VACANT."""
    service = SessionService(db)
    table = await service.unreserve_table(restaurant_id or "dineflow", table_id)
    return APIResponse(message="Table unreserved.", data=table)
