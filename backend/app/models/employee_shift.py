from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import EmployeeShift


class EmployeeShiftLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "employee_shift_logs"

    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)

    shift_type: Mapped[EmployeeShift] = mapped_column(Enum(EmployeeShift), default=EmployeeShift.FULL_TIME, nullable=False)
    clock_in_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    clock_out_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    working_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    break_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    employee: Mapped["Employee"] = relationship("Employee", back_populates="shifts")
