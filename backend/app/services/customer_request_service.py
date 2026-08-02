from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.enums import RequestStatus
from app.models.order import CustomerRequest
from app.repositories.customer_request import CustomerRequestRepository
from app.repositories.restaurant import RestaurantRepository
from app.repositories.table import TableRepository
from app.schemas.customer_request import CustomerRequestCreate, CustomerRequestStatusUpdate
from app.websockets.connection_manager import ws_manager
from app.websockets.events import WSEventType


class CustomerRequestService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.request_repo = CustomerRequestRepository(session)
        self.restaurant_repo = RestaurantRepository(session)
        self.table_repo = TableRepository(session)

    async def create_request(self, data: CustomerRequestCreate) -> CustomerRequest:
        restaurant = await self.restaurant_repo.get_by_identifier(data.restaurant_id)
        if not restaurant or not restaurant.is_active:
            raise NotFoundException("Restaurant", data.restaurant_id)

        table = await self.table_repo.get_by_id(data.table_id)
        if not table:
            raise NotFoundException("Table", data.table_id)

        req_data = data.model_dump()
        req_data["status"] = RequestStatus.PENDING
        req = await self.request_repo.create(req_data)

        # Notify waiters & staff via WebSockets
        event = {
            "event_type": WSEventType.CUSTOMER_REQUEST,
            "restaurant_id": data.restaurant_id,
            "data": {
                "request_id": req.id,
                "table_number": table.table_number,
                "request_type": req.request_type,
                "notes": req.notes,
                "created_at": req.created_at.isoformat()
            }
        }
        await ws_manager.broadcast_to_restaurant(data.restaurant_id, event)
        return req

    async def update_status(self, request_id: str, data: CustomerRequestStatusUpdate) -> CustomerRequest:
        req = await self.request_repo.get_by_id(request_id)
        if not req:
            raise NotFoundException("CustomerRequest", request_id)

        req.status = data.status
        await self.session.flush()

        event = {
            "event_type": WSEventType.REQUEST_STATUS_CHANGED,
            "restaurant_id": req.restaurant_id,
            "data": {
                "request_id": req.id,
                "status": req.status
            }
        }
        await ws_manager.broadcast_to_restaurant(req.restaurant_id, event)
        return req

    async def get_active_requests(self, restaurant_id: str) -> List[CustomerRequest]:
        restaurant = await self.restaurant_repo.get_by_identifier(restaurant_id)
        if not restaurant:
            return []
        return await self.request_repo.get_active_requests(restaurant.id)
