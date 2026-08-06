from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.restaurant import Branch, Restaurant
from app.repositories.restaurant import BranchRepository, RestaurantRepository
from app.schemas.restaurant import BranchCreate, RestaurantUpdate


class RestaurantService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.restaurant_repo = RestaurantRepository(session)
        self.branch_repo = BranchRepository(session)

    async def get_restaurant(self, restaurant_id: str) -> Restaurant:
        restaurant = await self.restaurant_repo.get_by_id(restaurant_id)
        if not restaurant:
            raise NotFoundException("Restaurant", restaurant_id)
        return restaurant

    async def update_restaurant(self, restaurant_id: str, data: RestaurantUpdate) -> Restaurant:
        restaurant = await self.restaurant_repo.get_by_identifier(restaurant_id)
        if not restaurant:
            raise NotFoundException("Restaurant", restaurant_id)
        update_data = data.model_dump(exclude_unset=True)
        updated = await self.restaurant_repo.update(restaurant, update_data)
        
        # Broadcast WS event
        from app.websockets.connection_manager import ws_manager
        from app.websockets.events import WSEventType
        event = {
            "event_type": WSEventType.RESTAURANT_SETTINGS_UPDATED,
            "restaurant_id": restaurant_id,
            "data": {
                "currency": updated.currency,
                "tax_percentage": updated.tax_percentage,
                "name": updated.name,
            }
        }
        await ws_manager.broadcast_to_restaurant(restaurant_id, event)
        return updated

    async def create_branch(self, restaurant_id: str, data: BranchCreate) -> Branch:
        await self.get_restaurant(restaurant_id)
        branch_data = data.model_dump()
        branch_data["restaurant_id"] = restaurant_id
        return await self.branch_repo.create(branch_data)

    async def get_branches(self, restaurant_id: str) -> List[Branch]:
        return await self.branch_repo.get_all(filters={"restaurant_id": restaurant_id})
