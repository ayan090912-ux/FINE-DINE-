# DineFlow — Commercial Multi-Tenant Restaurant QR SaaS Backend

![DineFlow Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

DineFlow is a high-performance, multi-tenant SaaS backend for modern restaurants. Customers scan table QR codes to instantly view digital menus, customize dishes, place orders, and request waiter service without requiring any login or app installation.

---

## Key Features

- 🏢 **Multi-Tenant SaaS Architecture**: Strict tenant isolation across restaurants, branches, and staff accounts.
- 📱 **Seamless QR Code Scan & Order Flow**: Instant table resolution, interactive digital menu, category filtering, variants & add-ons.
- ⚡ **Realtime Kitchen & Staff Updates**: Built-in WebSocket pub/sub for new orders, kitchen state transitions, and waiter calls.
- 🔑 **Role-Based Access Control (RBAC)**: Fine-grained permissions for Super Admin, Restaurant Owner, Manager, Kitchen, Waiter, and Cashier.
- 📊 **Restaurant Dashboard Analytics**: Revenue, top-selling dishes, average preparation times, and active table occupancy.
- 🚀 **Production Infrastructure**: Docker Compose, Alembic database migrations, Rate Limiting, Audit Logging, and Pytest coverage.

---

## Tech Stack

- **Language**: Python 3.10+
- **Framework**: FastAPI
- **Database & ORM**: PostgreSQL 16 + SQLAlchemy 2.0 (Async)
- **Migrations**: Alembic
- **Caching & Realtime**: Redis & WebSockets
- **Validation**: Pydantic v2
- **Auth**: JWT Tokens with bcrypt password hashing
- **Testing**: Pytest & Async HTTPX
- **DevOps**: Docker, Docker Compose, Uvicorn

---

## Getting Started

Refer to [docs/INSTALLATION.md](docs/INSTALLATION.md) for quickstart and Docker installation instructions.

```bash
docker-compose up -d --build
```

Access interactive Swagger documentation at `http://localhost:8000/docs`.
