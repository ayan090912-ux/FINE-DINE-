from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import SessionStatus


class DiningSession(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "dining_sessions"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    table_id: Mapped[str] = mapped_column(String(36), ForeignKey("tables.id", ondelete="CASCADE"), nullable=False, index=True)

    session_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False, index=True)
    guest_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant")
    table: Mapped["Table"] = relationship("Table", foreign_keys=[table_id], back_populates="sessions")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="session", cascade="all, delete-orphan")
    requests: Mapped[List["CustomerRequest"]] = relationship("CustomerRequest", back_populates="session", cascade="all, delete-orphan")
