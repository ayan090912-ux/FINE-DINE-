from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.table import QRCode, Table
from app.repositories.base import BaseRepository


class TableRepository(BaseRepository[Table]):
    def __init__(self, session: AsyncSession):
        super().__init__(Table, session)

    async def get_with_qr(self, table_id: str) -> Optional[Table]:
        query = (
            select(Table)
            .options(selectinload(Table.qr_code))
            .where(Table.id == table_id, Table.is_deleted == False)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_id_or_number(self, restaurant_id: str, identifier: str) -> Optional[Table]:
        clean_num = identifier.replace("t-", "")
        query = (
            select(Table)
            .options(selectinload(Table.qr_code))
            .where(
                Table.restaurant_id == restaurant_id,
                (Table.id == identifier) | (Table.table_number == identifier) | (Table.table_number == clean_num),
                Table.is_deleted == False
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()


class QRCodeRepository(BaseRepository[QRCode]):
    def __init__(self, session: AsyncSession):
        super().__init__(QRCode, session)

    async def get_by_code_hash(self, code_hash: str) -> Optional[QRCode]:
        query = (
            select(QRCode)
            .options(selectinload(QRCode.table))
            .where(QRCode.code_hash == code_hash, QRCode.is_active == True)
        )
        result = await self.session.execute(query)
        return result.scalars().first()
