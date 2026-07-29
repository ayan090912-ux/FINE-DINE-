from fastapi import APIRouter
from app.api.v1 import analytics, auth, menu, orders, public, requests, staff, tables, websockets

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router)
api_v1_router.include_router(public.router)
api_v1_router.include_router(orders.router)
api_v1_router.include_router(menu.router)
api_v1_router.include_router(tables.router)
api_v1_router.include_router(requests.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(staff.router)
api_v1_router.include_router(websockets.router)
