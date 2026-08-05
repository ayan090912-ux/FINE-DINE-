import logging
import hashlib
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.restaurant import Restaurant
from app.models.user import User
from app.models.menu import Category, MenuItem
from app.models.table import Table, QRCode

logger = logging.getLogger("dineflow.seed")


async def seed_database(session: AsyncSession) -> None:
    """Populates the database with initial demo data if empty."""
    # Check if default restaurant exists
    result = await session.execute(select(Restaurant).where(Restaurant.id == "dineflow"))
    existing_restaurant = result.scalars().first()

    if existing_restaurant:
        logger.info("Database already seeded with default restaurant.")
        return

    logger.info("Seeding initial DineFlow restaurant data...")

    # 1. Create Default Restaurant
    restaurant = Restaurant(
        id="dineflow",
        name="DineFlow Restaurant",
        slug="dineflow",
        email="owner@dineflow.io",
        phone="+1-800-DINEFLOW",
        city="San Francisco",
        country="US",
        currency="$",
        is_active=True,
    )
    session.add(restaurant)

    # 2. Create Owner User
    owner_user = User(
        id="user-owner-1",
        restaurant_id="dineflow",
        email="owner@dineflow.io",
        password_hash=hash_password("owner123"),
        full_name="DineFlow Owner",
        phone="+1-800-DINEFLOW",
        role=UserRole.OWNER,
        is_active=True,
    )
    session.add(owner_user)

    # 3. Create Default Categories
    categories_data = [
        {"id": "cat-1", "name": "Starters & Small Plates", "description": "Crispy bites and savory starters", "display_order": 1},
        {"id": "cat-2", "name": "Artisanal Pizzas", "description": "Handcrafted wood-fired sourdough pizzas", "display_order": 2},
        {"id": "cat-3", "name": "Chef Specials & Mains", "description": "Signature main courses prepared by top chefs", "display_order": 3},
        {"id": "cat-4", "name": "Desserts & Beverages", "description": "Sweet treats and artisan refreshers", "display_order": 4},
    ]

    for cat_info in categories_data:
        category = Category(
            id=cat_info["id"],
            restaurant_id="dineflow",
            name=cat_info["name"],
            description=cat_info["description"],
            display_order=cat_info["display_order"],
            is_active=True,
        )
        session.add(category)

    # 4. Create Default Menu Items
    items_data = [
        {
            "id": "item-1",
            "category_id": "cat-1",
            "name": "Truffle Mushroom Arancini",
            "description": "Crispy risotto balls filled with wild forest mushrooms, black truffle oil & smoked mozzarella.",
            "price": 14.50,
            "image_url": "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=800",
            "is_veg": True,
            "preparation_time_minutes": 12,
        },
        {
            "id": "item-2",
            "category_id": "cat-2",
            "name": "Truffle & Burrata Margherita",
            "description": "San Marzano tomatoes, fresh Italian burrata, fresh basil leaves, drizzled with truffle honey.",
            "price": 22.00,
            "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800",
            "is_veg": True,
            "preparation_time_minutes": 18,
        },
        {
            "id": "item-3",
            "category_id": "cat-3",
            "name": "Prime Ribeye Steak",
            "description": "300g Aged Angus Prime Ribeye with rosemary garlic butter, roasted asparagus, and truffle fries.",
            "price": 36.00,
            "image_url": "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=800",
            "is_veg": False,
            "preparation_time_minutes": 25,
        },
        {
            "id": "item-4",
            "category_id": "cat-4",
            "name": "Artisan Tiramisu",
            "description": "Classic Italian espresso-soaked savoiardi layers with whipped mascarpone cream & cocoa powder.",
            "price": 9.50,
            "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=800",
            "is_veg": True,
            "preparation_time_minutes": 8,
        },
        {
            "id": "item-5",
            "category_id": "cat-4",
            "name": "Sparkling Berry Refresher",
            "description": "Fresh wild berries, crushed mint leaves, sparkling water & organic cane syrup.",
            "price": 6.50,
            "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
            "is_veg": True,
            "preparation_time_minutes": 5,
        },
    ]

    for item_info in items_data:
        menu_item = MenuItem(
            id=item_info["id"],
            restaurant_id="dineflow",
            category_id=item_info["category_id"],
            name=item_info["name"],
            description=item_info["description"],
            price=item_info["price"],
            image_url=item_info["image_url"],
            is_veg=item_info["is_veg"],
            preparation_time_minutes=item_info["preparation_time_minutes"],
            is_available=True,
        )
        session.add(menu_item)

    # 5. Create Default Tables & QR Codes
    tables_data = [
        {"id": "t-1", "table_number": "01", "name": "Window Booth 1", "capacity": 2, "section": "Indoor"},
        {"id": "t-2", "table_number": "02", "name": "Window Booth 2", "capacity": 2, "section": "Indoor"},
        {"id": "t-3", "table_number": "03", "name": "Main Dining Table", "capacity": 4, "section": "Indoor"},
        {"id": "t-4", "table_number": "04", "name": "Garden Terrace 1", "capacity": 4, "section": "Outdoor"},
        {"id": "t-5", "table_number": "05", "name": "Garden Terrace 2", "capacity": 6, "section": "Outdoor"},
        {"id": "t-6", "table_number": "06", "name": "VIP Lounge Table", "capacity": 8, "section": "VIP"},
    ]

    for tbl_info in tables_data:
        table = Table(
            id=tbl_info["id"],
            restaurant_id="dineflow",
            table_number=tbl_info["table_number"],
            name=tbl_info["name"],
            capacity=tbl_info["capacity"],
            section=tbl_info["section"],
            is_occupied=False,
            is_active=True,
        )
        session.add(table)

        raw = f"dineflow:{tbl_info['id']}:{tbl_info['table_number']}"
        code_hash = hashlib.sha256(raw.encode()).hexdigest()[:16]

        qr = QRCode(
            id=f"qr-{tbl_info['id']}",
            restaurant_id="dineflow",
            table_id=tbl_info["id"],
            code_hash=code_hash,
            is_active=True,
        )
        session.add(qr)

    await session.commit()
    logger.info("Successfully seeded database with initial DineFlow data.")

