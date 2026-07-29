import random
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.enums import OrderStatus, OrderType, PaymentStatus
from app.models.order import Order, OrderItem
from app.repositories.menu import MenuItemRepository
from app.repositories.order import OrderRepository
from app.repositories.restaurant import RestaurantRepository
from app.repositories.table import TableRepository
from app.schemas.order import OrderCreateRequest, OrderStatusUpdate
from app.websockets.connection_manager import ws_manager
from app.websockets.events import WSEventType


class OrderService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.order_repo = OrderRepository(session)
        self.item_repo = MenuItemRepository(session)
        self.table_repo = TableRepository(session)
        self.restaurant_repo = RestaurantRepository(session)

    async def create_order(self, request: OrderCreateRequest) -> Order:
        restaurant = await self.restaurant_repo.get_by_id(request.restaurant_id)
        if not restaurant or not restaurant.is_active:
            raise NotFoundException("Restaurant", request.restaurant_id)

        if request.table_id:
            table = await self.table_repo.get_by_id(request.table_id)
            if not table:
                raise NotFoundException("Table", request.table_id)
            # Automatically mark table as occupied
            await self.table_repo.update(table, {"is_occupied": True})

        # Calculate Order Totals
        subtotal = 0.0
        max_prep_time = 15
        order_items_to_create = []

        for item_in in request.items:
            menu_item = await self.item_repo.get_with_details(item_in.menu_item_id)
            if not menu_item or not menu_item.is_available:
                raise BadRequestException(detail=f"Item '{item_in.menu_item_id}' is unavailable.")

            item_price = menu_item.price
            variant_name = None

            if item_in.variant_id:
                variant = next((v for v in menu_item.variants if v.id == item_in.variant_id), None)
                if variant and variant.is_available:
                    item_price = variant.price
                    variant_name = variant.name

            # Calculate Addons
            addon_total = 0.0
            addons_json = []
            if item_in.selected_addons:
                for addon in item_in.selected_addons:
                    addon_total += addon.price * addon.quantity
                    addons_json.append({
                        "addon_id": addon.addon_id,
                        "name": addon.name,
                        "price": addon.price,
                        "quantity": addon.quantity
                    })

            unit_price = item_price + addon_total
            item_total = unit_price * item_in.quantity
            subtotal += item_total

            if menu_item.preparation_time_minutes > max_prep_time:
                max_prep_time = menu_item.preparation_time_minutes

            order_items_to_create.append({
                "menu_item_id": menu_item.id,
                "variant_id": item_in.variant_id,
                "item_name": menu_item.name,
                "variant_name": variant_name,
                "unit_price": unit_price,
                "quantity": item_in.quantity,
                "total_price": item_total,
                "notes": item_in.notes,
                "selected_addons": addons_json
            })

        # Basic default tax calculation (e.g. 5% tax)
        tax_amount = round(subtotal * 0.05, 2)
        total_amount = round(subtotal + tax_amount, 2)

        order_number = f"ORD-{random.randint(10000, 99999)}"

        order = await self.order_repo.create({
            "restaurant_id": request.restaurant_id,
            "table_id": request.table_id,
            "order_number": order_number,
            "customer_name": request.customer_name or "Guest Customer",
            "customer_phone": request.customer_phone,
            "status": OrderStatus.PENDING,
            "order_type": request.order_type,
            "payment_status": PaymentStatus.PENDING,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "discount_amount": 0.0,
            "total_amount": total_amount,
            "special_notes": request.special_notes,
            "estimated_time_minutes": max_prep_time
        })

        for item_dict in order_items_to_create:
            item_dict["order_id"] = order.id
            order_item = OrderItem(**item_dict)
            self.session.add(order_item)

        await self.session.flush()

        # Fetch complete loaded order
        completed_order = await self.order_repo.get_with_items(order.id)

        # Broadcast via WebSockets
        ws_event = {
            "event_type": WSEventType.NEW_ORDER,
            "restaurant_id": request.restaurant_id,
            "data": {
                "order_id": completed_order.id,
                "order_number": completed_order.order_number,
                "table_id": completed_order.table_id,
                "total_amount": completed_order.total_amount,
                "status": completed_order.status
            }
        }
        await ws_manager.broadcast_to_restaurant(request.restaurant_id, ws_event)

        return completed_order

    async def update_status(self, order_id: str, update_in: OrderStatusUpdate) -> Order:
        order = await self.order_repo.get_with_items(order_id)
        if not order:
            raise NotFoundException("Order", order_id)

        order.status = update_in.status
        await self.session.flush()

        ws_event = {
            "event_type": WSEventType.ORDER_STATUS_CHANGED,
            "restaurant_id": order.restaurant_id,
            "data": {
                "order_id": order.id,
                "status": order.status,
                "order_number": order.order_number
            }
        }
        await ws_manager.broadcast_to_restaurant(order.restaurant_id, ws_event)
        await ws_manager.broadcast_to_order(order.id, ws_event)

        return order

    async def get_active_orders(self, restaurant_id: str) -> List[Order]:
        return await self.order_repo.get_active_orders_for_restaurant(restaurant_id)
