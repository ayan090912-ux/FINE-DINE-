from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictException, NotFoundException
from app.models.enums import RequestStatus, RequestType
from app.models.order import CustomerRequest
from app.repositories.customer_request import CustomerRequestRepository
from app.repositories.restaurant import RestaurantRepository
from app.repositories.table import TableRepository
from app.schemas.customer_request import CustomerRequestCreate, CustomerRequestStatusUpdate, WaiterPerformanceStats, WaitersPerformanceResponse
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

        from app.services.session_service import SessionService
        session_service = SessionService(self.session)
        active_session = await session_service.get_or_create_active_session(data.restaurant_id, data.table_id)

        req_data = data.model_dump()
        req_data["status"] = RequestStatus.PENDING
        req_data["session_id"] = active_session.id

        if str(data.request_type).upper() == "BILL" or getattr(data.request_type, "value", "").upper() == "BILL":
            from app.models.enums import SessionStatus
            active_session.status = SessionStatus.BILL_REQUESTED

        req = await self.request_repo.create(req_data)

        # Notify waiters & staff via WebSockets
        event = {
            "event_type": WSEventType.CUSTOMER_REQUEST,
            "restaurant_id": data.restaurant_id,
            "data": {
                "request_id": req.id,
                "table_id": table.id,
                "table_number": table.table_number,
                "request_type": req.request_type,
                "status": RequestStatus.PENDING,
                "notes": req.notes,
                "created_at": req.created_at.isoformat()
            }
        }
        await ws_manager.broadcast_to_restaurant(data.restaurant_id, event)
        return req

    async def accept_request(self, request_id: str, waiter_id: Optional[str], waiter_name: str) -> CustomerRequest:
        req = await self.request_repo.get_by_id(request_id)
        if not req:
            raise NotFoundException("CustomerRequest", request_id)

        # Race-condition free atomic SQL update
        success = await self.request_repo.atomic_accept_request(request_id, waiter_id, waiter_name)
        if not success:
            raise ConflictException("This request has already been accepted by another waiter.")

        await self.session.refresh(req)

        # Broadcast REQUEST_ACCEPTED WebSocket event
        event = {
            "event_type": WSEventType.REQUEST_ACCEPTED,
            "restaurant_id": req.restaurant_id,
            "data": {
                "request_id": req.id,
                "table_id": req.table_id,
                "request_type": req.request_type,
                "status": RequestStatus.ACCEPTED,
                "assigned_waiter_id": req.assigned_waiter_id,
                "assigned_waiter_name": req.assigned_waiter_name,
                "accepted_at": req.accepted_at.isoformat() if req.accepted_at else None
            }
        }
        await ws_manager.broadcast_to_restaurant(req.restaurant_id, event)
        return req

    async def mark_in_progress(self, request_id: str, waiter_id: Optional[str] = None) -> CustomerRequest:
        req = await self.request_repo.get_by_id(request_id)
        if not req:
            raise NotFoundException("CustomerRequest", request_id)

        req.status = RequestStatus.IN_PROGRESS
        req.in_progress_at = datetime.now(timezone.utc)
        await self.session.flush()

        event = {
            "event_type": WSEventType.REQUEST_IN_PROGRESS,
            "restaurant_id": req.restaurant_id,
            "data": {
                "request_id": req.id,
                "table_id": req.table_id,
                "status": RequestStatus.IN_PROGRESS,
                "assigned_waiter_id": req.assigned_waiter_id,
                "assigned_waiter_name": req.assigned_waiter_name
            }
        }
        await ws_manager.broadcast_to_restaurant(req.restaurant_id, event)
        return req

    async def mark_completed(self, request_id: str, waiter_id: Optional[str] = None) -> CustomerRequest:
        req = await self.request_repo.get_by_id(request_id)
        if not req:
            raise NotFoundException("CustomerRequest", request_id)

        req.status = RequestStatus.COMPLETED
        req.completed_at = datetime.now(timezone.utc)
        await self.session.flush()

        event = {
            "event_type": WSEventType.REQUEST_COMPLETED,
            "restaurant_id": req.restaurant_id,
            "data": {
                "request_id": req.id,
                "table_id": req.table_id,
                "status": RequestStatus.COMPLETED,
                "assigned_waiter_id": req.assigned_waiter_id,
                "assigned_waiter_name": req.assigned_waiter_name,
                "completed_at": req.completed_at.isoformat() if req.completed_at else None
            }
        }
        await ws_manager.broadcast_to_restaurant(req.restaurant_id, event)
        return req

    async def update_status(self, request_id: str, data: CustomerRequestStatusUpdate) -> CustomerRequest:
        req = await self.request_repo.get_by_id(request_id)
        if not req:
            raise NotFoundException("CustomerRequest", request_id)

        req.status = data.status
        if data.status == RequestStatus.ACCEPTED and not req.accepted_at:
            req.accepted_at = datetime.now(timezone.utc)
        elif data.status == RequestStatus.IN_PROGRESS and not req.in_progress_at:
            req.in_progress_at = datetime.now(timezone.utc)
        elif data.status in [RequestStatus.COMPLETED, RequestStatus.ARCHIVED] and not req.completed_at:
            req.completed_at = datetime.now(timezone.utc)

        await self.session.flush()

        event = {
            "event_type": WSEventType.REQUEST_STATUS_CHANGED,
            "restaurant_id": req.restaurant_id,
            "data": {
                "request_id": req.id,
                "status": req.status,
                "assigned_waiter_name": req.assigned_waiter_name
            }
        }
        await ws_manager.broadcast_to_restaurant(req.restaurant_id, event)
        return req

    async def get_active_requests(self, restaurant_id: str) -> List[CustomerRequest]:
        restaurant = await self.restaurant_repo.get_by_identifier(restaurant_id)
        if not restaurant:
            return []
        return await self.request_repo.get_active_requests(restaurant.id)

    async def get_waiter_performance_stats(self, restaurant_id: str) -> WaitersPerformanceResponse:
        restaurant = await self.restaurant_repo.get_by_identifier(restaurant_id)
        if not restaurant:
            return WaitersPerformanceResponse(
                total_pending_requests=0,
                total_accepted_requests=0,
                total_completed_requests=0,
                overall_avg_response_time_seconds=0.0,
                waiters=[]
            )

        all_requests = await self.request_repo.get_all_requests_for_restaurant(restaurant.id)
        
        pending_count = sum(1 for r in all_requests if r.status == RequestStatus.PENDING)
        accepted_count = sum(1 for r in all_requests if r.status in [RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS])
        completed_count = sum(1 for r in all_requests if r.status in [RequestStatus.COMPLETED, RequestStatus.ARCHIVED])

        total_response_times = []
        waiter_stats_map: Dict[str, Dict] = {}

        for req in all_requests:
            if req.created_at and req.accepted_at:
                diff = (req.accepted_at - req.created_at).total_seconds()
                if diff >= 0:
                    total_response_times.append(diff)

            waiter_key = req.assigned_waiter_name or req.assigned_waiter_id or "Unassigned"
            if waiter_key not in waiter_stats_map:
                waiter_stats_map[waiter_key] = {
                    "waiter_id": req.assigned_waiter_id or waiter_key,
                    "waiter_name": waiter_key,
                    "requests_accepted": 0,
                    "requests_completed": 0,
                    "response_times": [],
                    "completion_times": [],
                    "water_requests": 0,
                    "spoon_requests": 0,
                    "tissue_requests": 0,
                    "bill_requests": 0,
                    "waiter_calls": 0,
                }

            w = waiter_stats_map[waiter_key]
            if req.status in [RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS, RequestStatus.COMPLETED, RequestStatus.ARCHIVED]:
                w["requests_accepted"] += 1
            if req.status in [RequestStatus.COMPLETED, RequestStatus.ARCHIVED]:
                w["requests_completed"] += 1

            if req.created_at and req.accepted_at:
                r_diff = (req.accepted_at - req.created_at).total_seconds()
                if r_diff >= 0:
                    w["response_times"].append(r_diff)

            if req.accepted_at and req.completed_at:
                c_diff = (req.completed_at - req.accepted_at).total_seconds()
                if c_diff >= 0:
                    w["completion_times"].append(c_diff)

            req_type_str = req.request_type.value if hasattr(req.request_type, "value") else str(req.request_type)
            req_type_str = req_type_str.upper()
            if req_type_str == "WATER":
                w["water_requests"] += 1
            elif req_type_str == "SPOON":
                w["spoon_requests"] += 1
            elif req_type_str == "TISSUE":
                w["tissue_requests"] += 1
            elif req_type_str == "BILL":
                w["bill_requests"] += 1
            elif req_type_str == "WAITER":
                w["waiter_calls"] += 1

        waiters_res = []
        for w_data in waiter_stats_map.values():
            avg_resp = sum(w_data["response_times"]) / len(w_data["response_times"]) if w_data["response_times"] else 0.0
            avg_comp = sum(w_data["completion_times"]) / len(w_data["completion_times"]) if w_data["completion_times"] else 0.0
            waiters_res.append(
                WaiterPerformanceStats(
                    waiter_id=w_data["waiter_id"],
                    waiter_name=w_data["waiter_name"],
                    requests_accepted=w_data["requests_accepted"],
                    requests_completed=w_data["requests_completed"],
                    avg_response_time_seconds=round(avg_resp, 1),
                    avg_completion_time_seconds=round(avg_comp, 1),
                    water_requests=w_data["water_requests"],
                    spoon_requests=w_data["spoon_requests"],
                    tissue_requests=w_data["tissue_requests"],
                    bill_requests=w_data["bill_requests"],
                    waiter_calls=w_data["waiter_calls"],
                )
            )

        overall_avg_resp = sum(total_response_times) / len(total_response_times) if total_response_times else 0.0

        return WaitersPerformanceResponse(
            total_pending_requests=pending_count,
            total_accepted_requests=accepted_count,
            total_completed_requests=completed_count,
            overall_avg_response_time_seconds=round(overall_avg_resp, 1),
            waiters=waiters_res
        )
