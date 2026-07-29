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
    """Application lifespan context for async database table initialization."""
    logger.info("Initializing database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized successfully.")
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

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middlewares
app.add_middleware(RateLimitMiddleware)
app.add_middleware(TenantIsolationMiddleware)
app.add_middleware(AuditLogMiddleware)


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
