from typing import List
from sqlalchemy import select
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
                CustomerRequest.status.in_([RequestStatus.PENDING, RequestStatus.ACKNOWLEDGED])
            )
            .order_by(CustomerRequest.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
