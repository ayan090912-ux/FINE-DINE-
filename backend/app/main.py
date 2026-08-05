import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.database import Base, async_engine
from app.core.exceptions import DineFlowException
from app.core.logging import setup_logging
from app.middleware.audit import AuditLogMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.tenant import TenantIsolationMiddleware

setup_logging()
logger = logging.getLogger("dineflow.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for async database table initialization and seeding."""
    logger.info("Initializing database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE tables ADD COLUMN IF NOT EXISTS name VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE tables ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'VACANT';"))
            await conn.execute(text("ALTER TABLE tables ADD COLUMN IF NOT EXISTS active_session_id VARCHAR(36);"))
            await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id VARCHAR(36);"))
            await conn.execute(text("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS session_id VARCHAR(36);"))
            await conn.execute(text("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS assigned_waiter_id VARCHAR(36);"))
            await conn.execute(text("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS assigned_waiter_name VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;"))
            await conn.execute(text("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMP WITH TIME ZONE;"))
            await conn.execute(text("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;"))
            for val in ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']:
                try:
                    await conn.execute(text(f"ALTER TYPE requeststatus ADD VALUE IF NOT EXISTS '{val}';"))
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"Migration check notice: {e}")
    logger.info("Database tables initialized successfully.")
    
    # Run Database Seeder
    from app.core.database import AsyncSessionLocal
    from app.core.database_seed import seed_database
    async with AsyncSessionLocal() as session:
        await seed_database(session)
        
    yield
    logger.info("Shutting down DineFlow application...")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production-ready multi-tenant SaaS backend for QR restaurant ordering, "
        "kitchen management, and realtime staff communication."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Mount Static Files for Employee Photo Uploads
import os
from fastapi.staticfiles import StaticFiles
uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Custom Middlewares (added first so CORSMiddleware wraps them)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(TenantIsolationMiddleware)
app.add_middleware(AuditLogMiddleware)

# CORS Configuration (added LAST so it is the outermost middleware processing requests & responses)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Custom Global Exception Handler
@app.exception_handler(DineFlowException)
async def dineflow_exception_handler(request: Request, exc: DineFlowException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "code": exc.code,
            "detail": exc.detail
        },
        headers=exc.headers
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on path {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "code": "INTERNAL_SERVER_ERROR",
            "detail": "An internal server error occurred."
        }
    )


# Health Check
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0"
    }


# Include V1 API Routers
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
