from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.menu import Category, MenuItem
from app.repositories.menu import CategoryRepository, MenuItemRepository
from app.repositories.restaurant import RestaurantRepository
from app.schemas.menu import CategoryCreate, CategoryUpdate, MenuItemCreate, MenuItemUpdate, PublicMenuResponse


class MenuService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.category_repo = CategoryRepository(session)
        self.item_repo = MenuItemRepository(session)
        self.restaurant_repo = RestaurantRepository(session)

    async def create_category(self, restaurant_id: str, data: CategoryCreate) -> Category:
        category_data = data.model_dump()
        category_data["restaurant_id"] = restaurant_id
        return await self.category_repo.create(category_data)

    async def update_category(self, category_id: str, data: CategoryUpdate) -> Category:
        category = await self.category_repo.get_by_id(category_id)
        if not category:
            raise NotFoundException("Category", category_id)
        return await self.category_repo.update(category, data.model_dump(exclude_unset=True))

    async def delete_category(self, category_id: str) -> bool:
        return await self.category_repo.soft_delete(category_id)

    async def create_menu_item(self, restaurant_id: str, data: MenuItemCreate) -> MenuItem:
        item_data = data.model_dump(exclude={"variants", "addons"})
        item_data["restaurant_id"] = restaurant_id
        menu_item = await self.item_repo.create(item_data)

        # Create Variants if present
        if data.variants:
            from app.models.menu import MenuVariant
            for v in data.variants:
                v_obj = MenuVariant(menu_item_id=menu_item.id, **v.model_dump())
                self.session.add(v_obj)

        # Create Addons if present
        if data.addons:
            from app.models.menu import Addon
            for a in data.addons:
                a_obj = Addon(menu_item_id=menu_item.id, **a.model_dump())
                self.session.add(a_obj)

        await self.session.flush()
        return await self.item_repo.get_with_details(menu_item.id)

    async def update_menu_item(self, item_id: str, data: MenuItemUpdate) -> MenuItem:
        item = await self.item_repo.get_by_id(item_id)
        if not item:
            raise NotFoundException("MenuItem", item_id)
        await self.item_repo.update(item, data.model_dump(exclude_unset=True))
        return await self.item_repo.get_with_details(item_id)

    async def delete_menu_item(self, item_id: str) -> bool:
        return await self.item_repo.soft_delete(item_id)

    async def get_public_menu(self, restaurant_id: str) -> PublicMenuResponse:
        restaurant = await self.restaurant_repo.get_by_id(restaurant_id)
        if not restaurant or not restaurant.is_active:
            raise NotFoundException("Restaurant", restaurant_id)

        categories = await self.category_repo.get_menu_for_restaurant(restaurant_id)

        return PublicMenuResponse(
            restaurant_id=restaurant.id,
            restaurant_name=restaurant.name,
            currency=restaurant.currency,
            categories=categories
        )
