from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import RequestStatus
from app.models.order import CustomerRequest
from app.repositories.base import BaseRepository


class CustomerRequestRepository(BaseRepository[CustomerRequest]):
    def __init__(self, session: AsyncSession):
        super().__init__(CustomerRequest, session)

    async def get_active_requests(self, restaurant_id: str) -> List[CustomerRequest]:
        query = (
            select(CustomerRequest)
            .where(
                CustomerRequest.restaurant_id == restaurant_id,
                CustomerRequest.status.in_([RequestStatus.PENDING, RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS])
            )
            .order_by(CustomerRequest.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_all_requests_for_restaurant(self, restaurant_id: str) -> List[CustomerRequest]:
        query = (
            select(CustomerRequest)
            .where(CustomerRequest.restaurant_id == restaurant_id)
            .order_by(CustomerRequest.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def atomic_accept_request(self, request_id: str, waiter_id: Optional[str], waiter_name: str) -> bool:
        now = datetime.now(timezone.utc)
        stmt = (
            update(CustomerRequest)
            .where(
                CustomerRequest.id == request_id,
                CustomerRequest.status == RequestStatus.PENDING
            )
            .values(
                status=RequestStatus.ACCEPTED,
                assigned_waiter_id=waiter_id,
                assigned_waiter_name=waiter_name,
                accepted_at=now
            )
        )
        result = await self.session.execute(stmt)
        return result.rowcount > 0
