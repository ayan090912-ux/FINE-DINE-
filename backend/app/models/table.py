from typing import List, Optional
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import TableStatus


class Table(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tables"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=True)
    table_number: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, default=4)
    section: Mapped[Optional[str]] = mapped_column(String(50), default="Main Dining")
    status: Mapped[TableStatus] = mapped_column(Enum(TableStatus), default=TableStatus.VACANT, nullable=False, index=True)
    active_session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("dining_sessions.id", ondelete="SET NULL"), nullable=True)
    is_occupied: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="tables")
    branch: Mapped[Optional["Branch"]] = relationship("Branch", back_populates="tables")
    qr_code: Mapped[Optional["QRCode"]] = relationship("QRCode", back_populates="table", uselist=False, cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="table")
    requests: Mapped[List["CustomerRequest"]] = relationship("CustomerRequest", back_populates="table", cascade="all, delete-orphan")
    sessions: Mapped[List["DiningSession"]] = relationship("DiningSession", foreign_keys="[DiningSession.table_id]", back_populates="table")
    active_session: Mapped[Optional["DiningSession"]] = relationship("DiningSession", foreign_keys=[active_session_id], uselist=False)


class QRCode(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "qr_codes"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    table_id: Mapped[str] = mapped_column(String(36), ForeignKey("tables.id", ondelete="CASCADE"), unique=True, nullable=False)
    code_hash: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    qr_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    table: Mapped["Table"] = relationship("Table", back_populates="qr_code")
