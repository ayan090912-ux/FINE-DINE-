from datetime import date, datetime
from typing import Optional
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import EmployeeOnlineStatus, EmployeeShift, EmploymentStatus, UserRole


class Employee(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "employees"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    employee_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    joining_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, index=True)
    position: Mapped[str] = mapped_column(String(50), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    employment_status: Mapped[EmploymentStatus] = mapped_column(
        Enum(EmploymentStatus), default=EmploymentStatus.ACTIVE, nullable=False, index=True
    )
    shift: Mapped[EmployeeShift] = mapped_column(Enum(EmployeeShift), default=EmployeeShift.FULL_TIME, nullable=False)
    online_status: Mapped[EmployeeOnlineStatus] = mapped_column(
        Enum(EmployeeOnlineStatus), default=EmployeeOnlineStatus.OFFLINE, nullable=False, index=True
    )

    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_logout_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    requires_password_change: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    shifts: Mapped[list["EmployeeShiftLog"]] = relationship("EmployeeShiftLog", back_populates="employee", cascade="all, delete-orphan")
