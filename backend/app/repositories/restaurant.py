from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.restaurant import Branch, Restaurant, Subscription
from app.repositories.base import BaseRepository


class RestaurantRepository(BaseRepository[Restaurant]):
    def __init__(self, session: AsyncSession):
        super().__init__(Restaurant, session)

    async def get_by_slug(self, slug: str) -> Optional[Restaurant]:
        query = (
            select(Restaurant)
            .options(selectinload(Restaurant.subscription))
            .where(Restaurant.slug == slug, Restaurant.is_deleted == False)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_identifier(self, identifier: str) -> Optional[Restaurant]:
        query = (
            select(Restaurant)
            .options(selectinload(Restaurant.subscription))
            .where((Restaurant.id == identifier) | (Restaurant.slug == identifier))
            .where(Restaurant.is_deleted == False)
        )
        result = await self.session.execute(query)
        return result.scalars().first()


class BranchRepository(BaseRepository[Branch]):
    def __init__(self, session: AsyncSession):
        super().__init__(Branch, session)


class SubscriptionRepository(BaseRepository[Subscription]):
    def __init__(self, session: AsyncSession):
        super().__init__(Subscription, session)
