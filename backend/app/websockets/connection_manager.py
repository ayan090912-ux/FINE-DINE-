import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("dineflow.websockets")


class ConnectionManager:
    """Room-based WebSocket connection manager for real-time kitchen, staff, and customer updates."""

    def __init__(self):
        # restaurant_id -> Set[WebSocket]
        self.restaurant_rooms: Dict[str, Set[WebSocket]] = {}
        # kitchen_id/branch_id -> Set[WebSocket]
        self.kitchen_rooms: Dict[str, Set[WebSocket]] = {}
        # order_id -> Set[WebSocket]
        self.order_rooms: Dict[str, Set[WebSocket]] = {}

    async def connect_restaurant(self, websocket: WebSocket, restaurant_id: str):
        await websocket.accept()
        if restaurant_id not in self.restaurant_rooms:
            self.restaurant_rooms[restaurant_id] = set()
        self.restaurant_rooms[restaurant_id].add(websocket)
        logger.info(f"WebSocket client connected to restaurant room: {restaurant_id}")

    async def connect_kitchen(self, websocket: WebSocket, kitchen_room_id: str):
        await websocket.accept()
        if kitchen_room_id not in self.kitchen_rooms:
            self.kitchen_rooms[kitchen_room_id] = set()
        self.kitchen_rooms[kitchen_room_id].add(websocket)
        logger.info(f"WebSocket client connected to kitchen room: {kitchen_room_id}")

    async def connect_order_tracking(self, websocket: WebSocket, order_id: str):
        await websocket.accept()
        if order_id not in self.order_rooms:
            self.order_rooms[order_id] = set()
        self.order_rooms[order_id].add(websocket)
        logger.info(f"WebSocket customer tracking order room: {order_id}")

    def disconnect_restaurant(self, websocket: WebSocket, restaurant_id: str):
        if restaurant_id in self.restaurant_rooms and websocket in self.restaurant_rooms[restaurant_id]:
            self.restaurant_rooms[restaurant_id].remove(websocket)
            if not self.restaurant_rooms[restaurant_id]:
                del self.restaurant_rooms[restaurant_id]

    def disconnect_kitchen(self, websocket: WebSocket, kitchen_room_id: str):
        if kitchen_room_id in self.kitchen_rooms and websocket in self.kitchen_rooms[kitchen_room_id]:
            self.kitchen_rooms[kitchen_room_id].remove(websocket)
            if not self.kitchen_rooms[kitchen_room_id]:
                del self.kitchen_rooms[kitchen_room_id]

    def disconnect_order(self, websocket: WebSocket, order_id: str):
        if order_id in self.order_rooms and websocket in self.order_rooms[order_id]:
            self.order_rooms[order_id].remove(websocket)
            if not self.order_rooms[order_id]:
                del self.order_rooms[order_id]

    async def broadcast_to_restaurant(self, restaurant_id: str, message: dict):
        if restaurant_id in self.restaurant_rooms:
            dead_sockets = set()
            payload = json.dumps(message)
            for ws in self.restaurant_rooms[restaurant_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.restaurant_rooms[restaurant_id].remove(ws)

    async def broadcast_to_order(self, order_id: str, message: dict):
        if order_id in self.order_rooms:
            dead_sockets = set()
            payload = json.dumps(message)
            for ws in self.order_rooms[order_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.order_rooms[order_id].remove(ws)


ws_manager = ConnectionManager()
