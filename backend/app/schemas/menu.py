from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AddonBase(BaseModel):
    name: str
    price: float = Field(default=0.0, ge=0.0)
    max_quantity: int = Field(default=1, ge=1)
    is_available: bool = True


class AddonCreate(AddonBase):
    pass


class AddonResponse(AddonBase):
    id: str
    menu_item_id: str

    class Config:
        from_attributes = True


class VariantBase(BaseModel):
    name: str
    price: float = Field(..., ge=0.0)
    is_available: bool = True


class VariantCreate(VariantBase):
    pass


class VariantResponse(VariantBase):
    id: str
    menu_item_id: str

    class Config:
        from_attributes = True


class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = None
    price: float = Field(..., ge=0.0)
    image_url: Optional[str] = None
    is_available: bool = True
    preparation_time_minutes: int = Field(default=15, ge=1)
    is_veg: bool = False
    is_spicy: bool = False
    calories: Optional[int] = None


class MenuItemCreate(MenuItemBase):
    category_id: str
    variants: Optional[List[VariantCreate]] = []
    addons: Optional[List[AddonCreate]] = []


class MenuItemUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    preparation_time_minutes: Optional[int] = None
    is_veg: Optional[bool] = None
    is_spicy: Optional[bool] = None
    calories: Optional[int] = None


class MenuItemResponse(MenuItemBase):
    id: str
    restaurant_id: str
    category_id: str
    variants: List[VariantResponse] = []
    addons: List[AddonResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: str
    restaurant_id: str
    items: List[MenuItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class PublicMenuResponse(BaseModel):
    restaurant_id: str
    restaurant_name: str
    currency: str
    categories: List[CategoryResponse]
