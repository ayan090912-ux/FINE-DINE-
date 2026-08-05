import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    KITCHEN = "KITCHEN"
    WAITER = "WAITER"
    CASHIER = "CASHIER"


class TableStatus(str, enum.Enum):
    VACANT = "VACANT"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"


class SessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    BILL_REQUESTED = "BILL_REQUESTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    READY = "READY"
    SERVED = "SERVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class OrderType(str, enum.Enum):
    DINE_IN = "DINE_IN"
    TAKEAWAY = "TAKEAWAY"


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    ONLINE = "ONLINE"
    UPI = "UPI"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class RequestType(str, enum.Enum):
    WAITER = "WAITER"
    BILL = "BILL"
    WATER = "WATER"
    SPOON = "SPOON"
    TISSUE = "TISSUE"
    CLEANING = "CLEANING"
    OTHER = "OTHER"


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class SubscriptionPlan(str, enum.Enum):
    FREE_TRIAL = "FREE_TRIAL"
    BASIC = "BASIC"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class DiscountType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED_AMOUNT = "FIXED_AMOUNT"


class EmploymentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    ON_LEAVE = "ON_LEAVE"


class EmployeeShift(str, enum.Enum):
    MORNING = "MORNING"
    EVENING = "EVENING"
    NIGHT = "NIGHT"
    FULL_TIME = "FULL_TIME"


class EmployeeOnlineStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    ON_BREAK = "ON_BREAK"
    BUSY = "BUSY"
