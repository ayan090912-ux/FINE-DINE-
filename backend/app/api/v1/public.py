from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.customer_request import CustomerRequestCreate, CustomerRequestResponse
from app.schemas.menu import PublicMenuResponse
from app.schemas.order import FeedbackCreate, FeedbackResponse, OrderCreateRequest, OrderResponse
from app.schemas.table import TableScanResolution
from app.services.customer_request_service import CustomerRequestService
from app.services.menu_service import MenuService
from app.services.order_service import OrderService
from app.services.table_qr_service import TableQRService

router = APIRouter(prefix="/public", tags=["Public Customer Flow (No Login Required)"])


@router.get("/qr/{code_hash}", response_model=APIResponse[TableScanResolution])
async def scan_qr_code(
    code_hash: str,
    db: AsyncSession = Depends(get_db)
):
    """Scan QR Code hash on table -> Returns restaurant ID, table number, and branding."""
    service = TableQRService(db)
    result = await service.resolve_qr_scan(code_hash)
    return APIResponse(message="QR code scanned successfully.", data=result)


@router.get("/table/{table_id}", response_model=APIResponse[TableResponse])
async def get_public_table(
    table_id: str,
    restaurant_id: str = "dineflow",
    db: AsyncSession = Depends(get_db)
):
    """Public table lookup by UUID or table number."""
    service = TableQRService(db)
    result = await service.get_table_by_identifier(restaurant_id, table_id)
    return APIResponse(message="Table resolved successfully.", data=result)


@router.get("/menu/{restaurant_id}", response_model=APIResponse[PublicMenuResponse])
async def get_public_menu(
    restaurant_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Fetch digital menu with categories, items, variants, and addons."""
    service = MenuService(db)
    result = await service.get_public_menu(restaurant_id)
    return APIResponse(message="Menu fetched successfully.", data=result)


@router.post("/orders", response_model=APIResponse[OrderResponse])
async def place_order(
    data: OrderCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Place a new order directly from table (No customer login required)."""
    service = OrderService(db)
    result = await service.create_order(data)
    return APIResponse(message="Order placed successfully.", data=result)


@router.post("/request-service", response_model=APIResponse[CustomerRequestResponse])
async def call_waiter_or_service(
    data: CustomerRequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """Call waiter, request bill, water, spoon, tissue, or cleaning."""
    service = CustomerRequestService(db)
    result = await service.create_request(data)
    return APIResponse(message="Request sent to staff.", data=result)
