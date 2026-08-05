import random
from datetime import datetime
from typing import List, Optional
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.employee import Employee
from app.models.enums import EmployeeOnlineStatus, EmploymentStatus, UserRole


class EmployeeRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, employee_id: str) -> Optional[Employee]:
        stmt = select(Employee).where(Employee.id == employee_id, Employee.is_deleted == False)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[Employee]:
        stmt = select(Employee).where(func.lower(Employee.username) == username.lower(), Employee.is_deleted == False)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_employee_id(self, emp_code: str) -> Optional[Employee]:
        stmt = select(Employee).where(Employee.employee_id == emp_code, Employee.is_deleted == False)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_employees(
        self,
        restaurant_id: str,
        role: Optional[UserRole] = None,
        employment_status: Optional[EmploymentStatus] = None,
    ) -> List[Employee]:
        stmt = select(Employee).where(Employee.restaurant_id == restaurant_id, Employee.is_deleted == False)
        if role:
            stmt = stmt.where(Employee.role == role)
        if employment_status:
            stmt = stmt.where(Employee.employment_status == employment_status)

        stmt = stmt.order_by(Employee.created_at.desc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def create(self, employee: Employee) -> Employee:
        self.session.add(employee)
        await self.session.flush()
        await self.session.refresh(employee)
        return employee

    async def update(self, employee: Employee) -> Employee:
        employee.updated_at = datetime.utcnow()
        await self.session.flush()
        await self.session.refresh(employee)
        return employee

    async def generate_next_employee_id(self, restaurant_id: str) -> str:
        stmt = select(func.count(Employee.id)).where(Employee.restaurant_id == restaurant_id)
        res = await self.session.execute(stmt)
        count = res.scalar() or 0
        return f"EMP-{1001 + count}"
