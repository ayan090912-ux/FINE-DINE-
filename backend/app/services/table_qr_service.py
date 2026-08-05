import hashlib
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.table import Table
from app.repositories.restaurant import RestaurantRepository
from app.repositories.table import QRCodeRepository, TableRepository
from app.schemas.table import TableCreate, TableScanResolution, TableUpdate
from app.websockets.connection_manager import ws_manager
from app.websockets.events import WSEventType


class TableQRService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.table_repo = TableRepository(session)
        self.qr_repo = QRCodeRepository(session)
        self.restaurant_repo = RestaurantRepository(session)

    async def _notify_table_update(self, restaurant_id: str):
        event = {
            "event_type": WSEventType.TABLE_UPDATED,
            "restaurant_id": restaurant_id,
            "data": {"timestamp": True}
        }
        await ws_manager.broadcast_to_restaurant(restaurant_id, event)

    async def create_table(self, restaurant_id: str, data: TableCreate) -> Table:
        table_data = data.model_dump()
        table_data["restaurant_id"] = restaurant_id
        table = await self.table_repo.create(table_data)

        # Generate unique code_hash for QR code
        raw = f"{restaurant_id}:{table.id}:{data.table_number}"
        code_hash = hashlib.sha256(raw.encode()).hexdigest()[:16]

        await self.qr_repo.create({
            "restaurant_id": restaurant_id,
            "table_id": table.id,
            "code_hash": code_hash,
            "is_active": True
        })

        res = await self.table_repo.get_with_qr(table.id)
        await self._notify_table_update(restaurant_id)
        return res

    async def get_tables_for_restaurant(self, restaurant_id: str) -> List[Table]:
        return await self.table_repo.get_all(filters={"restaurant_id": restaurant_id})

    async def update_table(self, table_id: str, data: TableUpdate) -> Table:
        table = await self.table_repo.get_by_id(table_id)
        if not table:
            raise NotFoundException("Table", table_id)
        await self.table_repo.update(table, data.model_dump(exclude_unset=True))
        res = await self.table_repo.get_with_qr(table_id)
        await self._notify_table_update(table.restaurant_id)
        return res

    async def delete_table(self, table_id: str) -> bool:
        table = await self.table_repo.get_by_id(table_id)
        if not table:
            return False
        res = await self.table_repo.soft_delete(table_id)
        await self._notify_table_update(table.restaurant_id)
        return res

    async def resolve_qr_scan(self, code_hash: str) -> TableScanResolution:
        qr = await self.qr_repo.get_by_code_hash(code_hash)
        if not qr or not qr.table or not qr.is_active:
            raise NotFoundException("QR Code or Table", code_hash)

        restaurant = await self.restaurant_repo.get_by_id(qr.restaurant_id)
        if not restaurant or not restaurant.is_active:
            raise NotFoundException("Restaurant", qr.restaurant_id)

        from app.services.session_service import SessionService
        session_service = SessionService(self.session)
        dining_session = await session_service.get_or_create_active_session(restaurant.id, qr.table.id)

        return TableScanResolution(
            restaurant_id=restaurant.id,
            restaurant_name=restaurant.name,
            restaurant_slug=restaurant.slug,
            logo_url=restaurant.logo_url,
            currency=restaurant.currency,
            table_id=qr.table.id,
            table_number=qr.table.table_number,
            section=qr.table.section,
            status=qr.table.status.value if hasattr(qr.table.status, 'value') else str(qr.table.status),
            session_id=dining_session.id,
            session_code=dining_session.session_code,
        )
