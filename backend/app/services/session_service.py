import random
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.enums import SessionStatus, TableStatus
from app.models.session import DiningSession
from app.models.table import Table
from app.repositories.session import SessionRepository
from app.repositories.table import TableRepository
from app.websockets.connection_manager import ws_manager
from app.websockets.events import WSEventType


class SessionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.session_repo = SessionRepository(session)
        self.table_repo = TableRepository(session)

    async def get_or_create_active_session(self, restaurant_id: str, table_id: str) -> DiningSession:
        table = await self.table_repo.get_by_id(table_id)
        if not table or table.restaurant_id != restaurant_id:
            raise NotFoundException("Table", table_id)

        if table.status == TableStatus.RESERVED:
            raise BadRequestException("Table is reserved by staff and cannot start a new dining session.")

        # Check existing active session
        existing = await self.session_repo.get_active_session_for_table(table_id)
        if existing:
            return existing

        # Create new session for table
        session_code = f"SES-{random.randint(10000, 99999)}"
        new_session = await self.session_repo.create({
            "restaurant_id": restaurant_id,
            "table_id": table_id,
            "session_code": session_code,
            "status": SessionStatus.ACTIVE,
            "guest_count": 1,
            "opened_at": datetime.now(timezone.utc),
        })

        # Transition table status to OCCUPIED
        table.status = TableStatus.OCCUPIED
        table.is_occupied = True
        table.active_session_id = new_session.id
        await self.session.flush()

        # Broadcast real-time events
        event_payload = {
            "event_type": WSEventType.SESSION_STARTED,
            "restaurant_id": restaurant_id,
            "data": {
                "session_id": new_session.id,
                "session_code": new_session.session_code,
                "table_id": table_id,
                "table_number": table.table_number,
                "table_status": TableStatus.OCCUPIED,
            }
        }
        await ws_manager.broadcast_to_restaurant(restaurant_id, event_payload)

        table_event = {
            "event_type": WSEventType.TABLE_UPDATED,
            "restaurant_id": restaurant_id,
            "data": {"table_id": table_id, "status": TableStatus.OCCUPIED}
        }
        await ws_manager.broadcast_to_restaurant(restaurant_id, table_event)

        return new_session

    async def close_session_and_vacate_table(self, restaurant_id: str, table_id: str) -> bool:
        table = await self.table_repo.get_by_id(table_id)
        if not table or table.restaurant_id != restaurant_id:
            raise NotFoundException("Table", table_id)

        active_session = await self.session_repo.get_active_session_for_table(table_id)
        if active_session:
            active_session.status = SessionStatus.COMPLETED
            active_session.closed_at = datetime.now(timezone.utc)

        # Reset table status to VACANT
        table.status = TableStatus.VACANT
        table.is_occupied = False
        table.active_session_id = None
        await self.session.flush()

        # Broadcast WebSocket notifications
        event_payload = {
            "event_type": WSEventType.SESSION_CLOSED,
            "restaurant_id": restaurant_id,
            "data": {
                "session_id": active_session.id if active_session else None,
                "table_id": table_id,
                "table_number": table.table_number,
                "table_status": TableStatus.VACANT,
            }
        }
        await ws_manager.broadcast_to_restaurant(restaurant_id, event_payload)

        table_event = {
            "event_type": WSEventType.TABLE_UPDATED,
            "restaurant_id": restaurant_id,
            "data": {"table_id": table_id, "status": TableStatus.VACANT}
        }
        await ws_manager.broadcast_to_restaurant(restaurant_id, table_event)

        return True

    async def reserve_table(self, restaurant_id: str, table_id: str) -> Table:
        table = await self.table_repo.get_by_id(table_id)
        if not table or table.restaurant_id != restaurant_id:
            raise NotFoundException("Table", table_id)

        active = await self.session_repo.get_active_session_for_table(table_id)
        if active:
            raise BadRequestException("Cannot reserve an active dining table.")

        table.status = TableStatus.RESERVED
        table.is_occupied = False
        await self.session.flush()

        table_event = {
            "event_type": WSEventType.TABLE_UPDATED,
            "restaurant_id": restaurant_id,
            "data": {"table_id": table_id, "status": TableStatus.RESERVED}
        }
        await ws_manager.broadcast_to_restaurant(restaurant_id, table_event)
        return table

    async def unreserve_table(self, restaurant_id: str, table_id: str) -> Table:
        table = await self.table_repo.get_by_id(table_id)
        if not table or table.restaurant_id != restaurant_id:
            raise NotFoundException("Table", table_id)

        table.status = TableStatus.VACANT
        table.is_occupied = False
        await self.session.flush()

        table_event = {
            "event_type": WSEventType.TABLE_UPDATED,
            "restaurant_id": restaurant_id,
            "data": {"table_id": table_id, "status": TableStatus.VACANT}
        }
        await ws_manager.broadcast_to_restaurant(restaurant_id, table_event)
        return table
