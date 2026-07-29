from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.menu import Addon, Category, MenuItem, MenuVariant
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    def __init__(self, session: AsyncSession):
        super().__init__(Category, session)

    async def get_menu_for_restaurant(self, restaurant_id: str) -> List[Category]:
        query = (
            select(Category)
            .options(
                selectinload(Category.items).selectinload(MenuItem.variants),
                selectinload(Category.items).selectinload(MenuItem.addons)
            )
            .where(
                Category.restaurant_id == restaurant_id,
                Category.is_active == True,
                Category.is_deleted == False
            )
            .order_by(Category.display_order.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class MenuItemRepository(BaseRepository[MenuItem]):
    def __init__(self, session: AsyncSession):
        super().__init__(MenuItem, session)

    async def get_with_details(self, item_id: str) -> Optional[MenuItem]:
        query = (
            select(MenuItem)
            .options(selectinload(MenuItem.variants), selectinload(MenuItem.addons))
            .where(MenuItem.id == item_id, MenuItem.is_deleted == False)
        )
        result = await self.session.execute(query)
        return result.scalars().first()
