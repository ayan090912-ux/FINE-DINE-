from typing import List, Optional
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Category(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "categories"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="categories")
    items: Mapped[List["MenuItem"]] = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")


class MenuItem(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "menu_items"

    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    preparation_time_minutes: Mapped[int] = mapped_column(Integer, default=15)
    is_veg: Mapped[bool] = mapped_column(Boolean, default=False)
    is_spicy: Mapped[bool] = mapped_column(Boolean, default=False)
    calories: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="menu_items")
    category: Mapped["Category"] = relationship("Category", back_populates="items")
    variants: Mapped[List["MenuVariant"]] = relationship("MenuVariant", back_populates="menu_item", cascade="all, delete-orphan")
    addons: Mapped[List["Addon"]] = relationship("Addon", back_populates="menu_item", cascade="all, delete-orphan")


class MenuVariant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "menu_variants"

    menu_item_id: Mapped[str] = mapped_column(String(36), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False) # e.g. "Small", "Large", "Double Patty"
    price: Mapped[float] = mapped_column(Float, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    menu_item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="variants")


class Addon(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "addons"

    menu_item_id: Mapped[str] = mapped_column(String(36), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False) # e.g. "Extra Cheese", "Bacon", "Gluten-Free Bun"
    price: Mapped[float] = mapped_column(Float, default=0.0)
    max_quantity: Mapped[int] = mapped_column(Integer, default=1)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    menu_item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="addons")
