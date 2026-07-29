import enum
from typing import Any, Dict
from pydantic import BaseModel


class WSEventType(str, enum.Enum):
    NEW_ORDER = "NEW_ORDER"
    ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED"
    KITCHEN_ALERT = "KITCHEN_ALERT"
    CUSTOMER_REQUEST = "CUSTOMER_REQUEST"
    REQUEST_STATUS_CHANGED = "REQUEST_STATUS_CHANGED"


class WSEventPayload(BaseModel):
    event_type: WSEventType
    restaurant_id: str
    data: Dict[str, Any]
