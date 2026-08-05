from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import OrderStatus, OrderType, PaymentStatus, RequestStatus, RequestType


class Order(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "orders"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    table_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("tables.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("dining_sessions.id", ondelete="SET NULL"), nullable=True, index=True)

    order_number: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    customer_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    customer_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    order_type: Mapped[OrderType] = mapped_column(Enum(OrderType), default=OrderType.DINE_IN, nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)

    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    tax_amount: Mapped[float] = mapped_column(Float, default=0.0)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)

    special_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estimated_time_minutes: Mapped[int] = mapped_column(Integer, default=20)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="orders")
    table: Mapped[Optional["Table"]] = relationship("Table", back_populates="orders")
    session: Mapped[Optional["DiningSession"]] = relationship("DiningSession", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    feedback: Mapped[Optional["Feedback"]] = relationship("Feedback", back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "order_items"

    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_item_id: Mapped[str] = mapped_column(String(36), ForeignKey("menu_items.id", ondelete="RESTRICT"), nullable=False)
    variant_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("menu_variants.id", ondelete="SET NULL"), nullable=True)

    item_name: Mapped[str] = mapped_column(String(120), nullable=False)
    variant_name: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    selected_addons: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")


class CustomerRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "customer_requests"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    table_id: Mapped[str] = mapped_column(String(36), ForeignKey("tables.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("dining_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    request_type: Mapped[RequestType] = mapped_column(Enum(RequestType), default=RequestType.WAITER, nullable=False)
    status: Mapped[RequestStatus] = mapped_column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    assigned_waiter_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_waiter_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    in_progress_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    table: Mapped["Table"] = relationship("Table", back_populates="requests")
    session: Mapped[Optional["DiningSession"]] = relationship("DiningSession", back_populates="requests")
    assigned_waiter: Mapped[Optional["User"]] = relationship("User")


class Feedback(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "feedback"

    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    overall_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    food_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    service_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="feedback")
