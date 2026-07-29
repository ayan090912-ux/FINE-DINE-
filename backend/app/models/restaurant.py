from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import SubscriptionPlan, SubscriptionStatus


class Restaurant(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "restaurants"

    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    email: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    country: Mapped[str] = mapped_column(String(50), default="US")
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    branches: Mapped[List["Branch"]] = relationship("Branch", back_populates="restaurant", cascade="all, delete-orphan")
    users: Mapped[List["User"]] = relationship("User", back_populates="restaurant")
    categories: Mapped[List["Category"]] = relationship("Category", back_populates="restaurant", cascade="all, delete-orphan")
    menu_items: Mapped[List["MenuItem"]] = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")
    tables: Mapped[List["Table"]] = relationship("Table", back_populates="restaurant", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="restaurant")
    subscription: Mapped[Optional["Subscription"]] = relationship("Subscription", back_populates="restaurant", uselist=False, cascade="all, delete-orphan")


class Branch(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "branches"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    is_main: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="branches")
    tables: Mapped[List["Table"]] = relationship("Table", back_populates="branch", cascade="all, delete-orphan")
    users: Mapped[List["User"]] = relationship("User", back_populates="branch")


class Subscription(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "subscriptions"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_type: Mapped[SubscriptionPlan] = mapped_column(Enum(SubscriptionPlan), default=SubscriptionPlan.FREE_TRIAL, nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False)
    current_period_start: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_period_end: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_tables: Mapped[int] = mapped_column(default=10)
    max_menu_items: Mapped[int] = mapped_column(default=50)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="subscription")
