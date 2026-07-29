from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.restaurant import Branch, Restaurant, Subscription
from app.repositories.base import BaseRepository


class RestaurantRepository(BaseRepository[Restaurant]):
    def __init__(self, session: AsyncSession):
        super().__init__(Restaurant, session)

    async def get_by_slug(self, slug: str) -> Optional[Restaurant]:
        query = select(Restaurant).where(Restaurant.slug == slug, Restaurant.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalars().first()


class BranchRepository(BaseRepository[Branch]):
    def __init__(self, session: AsyncSession):
        super().__init__(Branch, session)


class SubscriptionRepository(BaseRepository[Subscription]):
    def __init__(self, session: AsyncSession):
        super().__init__(Subscription, session)
