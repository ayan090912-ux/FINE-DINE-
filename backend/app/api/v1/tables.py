from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_roles
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.table import TableCreate, TableResponse, TableUpdate
from app.services.table_qr_service import TableQRService

router = APIRouter(prefix="/tables", tags=["Table & QR Management"])


@router.post("", response_model=APIResponse[TableResponse])
async def create_table(
    data: TableCreate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """Add a table to restaurant and auto-generate its unique QR code."""
    service = TableQRService(db)
    table = await service.create_table(current_user.restaurant_id, data)
    return APIResponse(message="Table created with unique QR code.", data=table)


@router.get("", response_model=APIResponse[List[TableResponse]])
async def get_tables(
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER])),
    db: AsyncSession = Depends(get_db)
):
    """List all dining tables for the restaurant."""
    service = TableQRService(db)
    tables = await service.get_tables_for_restaurant(current_user.restaurant_id)
    return APIResponse(message="Tables retrieved.", data=tables)


@router.patch("/{table_id}", response_model=APIResponse[TableResponse])
async def update_table(
    table_id: str,
    data: TableUpdate,
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER])),
    db: AsyncSession = Depends(get_db)
):
    """Update table details or occupation status."""
    service = TableQRService(db)
    table = await service.update_table(table_id, data)
    return APIResponse(message="Table updated.", data=table)
