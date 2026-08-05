from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import SessionStatus
from app.models.session import DiningSession
from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository[DiningSession]):
    def __init__(self, session: AsyncSession):
        super().__init__(DiningSession, session)

    async def get_active_session_for_table(self, table_id: str) -> Optional[DiningSession]:
        query = (
            select(DiningSession)
            .options(
                selectinload(DiningSession.orders),
                selectinload(DiningSession.requests)
            )
            .where(
                DiningSession.table_id == table_id,
                DiningSession.status.in_([SessionStatus.ACTIVE, SessionStatus.BILL_REQUESTED])
            )
            .order_by(DiningSession.opened_at.desc())
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_with_details(self, session_id: str) -> Optional[DiningSession]:
        query = (
            select(DiningSession)
            .options(
                selectinload(DiningSession.orders),
                selectinload(DiningSession.requests)
            )
            .where(DiningSession.id == session_id)
        )
        result = await self.session.execute(query)
        return result.scalars().first()
