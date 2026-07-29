# DineFlow SaaS Backend API Documentation

DineFlow provides a production-ready RESTful & WebSockets API built with FastAPI, SQLAlchemy 2, and PostgreSQL.

---

## Base URLs & Interactive OpenAPI Explorer

- **API Base Route**: `/api/v1`
- **Swagger Interactive Docs**: `http://localhost:8000/docs`
- **ReDoc Technical Specification**: `http://localhost:8000/redoc`

---

## Endpoints Overview

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/register-owner` | Public | Onboards a new restaurant owner, creates restaurant & 30-day trial subscription |
| `POST` | `/login` | Public | Authenticates staff or owner, returns JWT access and refresh tokens |
| `POST` | `/refresh` | Public | Refreshes access token |

---

### 2. Public Customer Flow (`/api/v1/public`) — No Login Required

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/qr/{code_hash}` | Resolves scanned QR code hash to restaurant ID, table number & section |
| `GET`  | `/menu/{restaurant_id}` | Retrieves full digital menu (categories, items, variants, addons) |
| `POST` | `/orders` | Places order directly from dining table |
| `POST` | `/request-service` | Sends waiter call or service request (Water, Spoon, Tissue, Bill, Cleaning) |

---

### 3. Kitchen & Staff Order Management (`/api/v1/orders`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET`  | `/active` | Staff | Fetches real-time active kitchen orders |
| `PATCH`| `/{order_id}/status` | Staff | Updates order status (`PENDING` -> `PREPARING` -> `READY` -> `SERVED` -> `COMPLETED`) |

---

### 4. Menu Management (`/api/v1/menu`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/categories` | Owner/Manager | Creates menu category |
| `POST` | `/items` | Owner/Manager | Creates menu item with variants and addons |
| `PATCH`| `/items/{item_id}` | Owner/Manager | Updates menu item |
| `DELETE`| `/items/{item_id}` | Owner/Manager | Soft deletes menu item |

---

### 5. Table & QR Management (`/api/v1/tables`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/` | Owner/Manager | Creates dining table & generates unique QR code |
| `GET`  | `/` | Staff | Lists all dining tables and occupation status |
| `PATCH`| `/{table_id}` | Staff | Updates table details or status |

---

### 6. Realtime WebSockets (`/api/v1/ws`)

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WS` | `/ws/restaurant/{restaurant_id}` | Realtime feed for new orders, status changes, and customer service calls |
| `WS` | `/ws/order/{order_id}` | Realtime customer order progress tracker |
