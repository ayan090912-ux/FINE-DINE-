from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository[Order]):
    def __init__(self, session: AsyncSession):
        super().__init__(Order, session)

    async def get_with_items(self, order_id: str) -> Optional[Order]:
        query = (
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.feedback),
                selectinload(Order.payment)
            )
            .where(Order.id == order_id, Order.is_deleted == False)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_active_orders_for_restaurant(
        self, restaurant_id: str, branch_id: Optional[str] = None
    ) -> List[Order]:
        active_statuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.SERVED
        ]
        query = (
            select(Order)
            .options(selectinload(Order.items))
            .where(
                Order.restaurant_id == restaurant_id,
                Order.status.in_(active_statuses),
                Order.is_deleted == False
            )
        )
        if branch_id:
            query = query.where(Order.branch_id == branch_id)

        query = query.order_by(Order.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())
