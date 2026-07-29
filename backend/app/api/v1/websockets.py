from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.connection_manager import ws_manager

router = APIRouter(prefix="/ws", tags=["Realtime WebSockets"])


@router.websocket("/restaurant/{restaurant_id}")
async def restaurant_live_feed(websocket: WebSocket, restaurant_id: str):
    """WebSocket feed for restaurant staff, kitchen screens, and waiter dashboards."""
    await ws_manager.connect_restaurant(websocket, restaurant_id)
    try:
        while True:
            # Keep connection alive & listen for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"event": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect_restaurant(websocket, restaurant_id)


@router.websocket("/order/{order_id}")
async def order_tracking_feed(websocket: WebSocket, order_id: str):
    """WebSocket feed for customer live order status tracking."""
    await ws_manager.connect_order_tracking(websocket, order_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"event": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect_order(websocket, order_id)
