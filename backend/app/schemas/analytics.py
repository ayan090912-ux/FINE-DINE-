from typing import List, Optional
from pydantic import BaseModel


class TopSellingItem(BaseModel):
    menu_item_id: str
    name: str
    total_quantity_sold: int
    total_revenue: float


class AnalyticsSummary(BaseModel):
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: float
    average_order_value: float
    average_preparation_time_minutes: float
    active_tables_count: int
    top_selling_items: List[TopSellingItem] = []


class HourlySales(BaseModel):
    hour: int
    order_count: int
    revenue: float
