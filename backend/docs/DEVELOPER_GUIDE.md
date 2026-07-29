# DineFlow Architecture & Developer Guide

## Clean Architecture Principles

DineFlow adheres to **Clean Architecture** with strict layer boundaries:

```
                  ┌───────────────────────────────┐
                  │       Presentation Layer      │
                  │   FastAPI Routers / WS Feed   │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │       Application Layer       │
                  │     Services & Business Logic │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │         Domain Layer          │
                  │     Entities & Value Objects  │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │     Infrastructure Layer      │
                  │ Repositories, Database, Redis │
                  └───────────────────────────────┘
```

---

## Folder Structure

- `app/core`: Configuration, database engines, security JWT tokens, custom exceptions, logging
- `app/models`: SQLAlchemy 2.0 ORM models with UUID primary keys and soft deletes
- `app/schemas`: Pydantic v2 DTOs for strict input validation and output serialization
- `app/repositories`: Async Repository Pattern encapsulating database queries
- `app/services`: Pure business logic orchestration
- `app/websockets`: Room-based WebSocket pub/sub connection manager
- `app/api/v1`: Thin RESTful controllers
- `app/middleware`: Rate limiting, tenant isolation, and audit logging
- `tests`: Pytest unit and integration test suite
