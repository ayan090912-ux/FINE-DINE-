import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import Boolean, DateTime, String, create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    declared_attr,
    mapped_column,
    sessionmaker,
)

from app.core.config import settings

# ==========================================================
# DATABASE URL CLEANING & FORMATTING
# ==========================================================

def clean_asyncpg_url(url: str) -> str:
    """Strip query parameters unsupported by asyncpg driver (e.g. sslmode, channel_binding)."""
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query))
    query.pop("sslmode", None)
    query.pop("channel_binding", None)
    return urlunparse(parsed._replace(query=urlencode(query)))


def format_database_urls(raw_async_url: str, raw_sync_url: str):
    async_url = raw_async_url or "sqlite+aiosqlite:///./dineflow.db"
    
    # Format Postgres scheme for asyncpg
    if async_url.startswith("postgres://"):
        async_url = async_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif async_url.startswith("postgresql://"):
        async_url = async_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if async_url.startswith("postgresql+asyncpg://"):
        async_url = clean_asyncpg_url(async_url)

    # Format Sync URL for psycopg2 / alembic
    sync_url = raw_sync_url or ""
    if (not sync_url or "sqlite" in sync_url) and "postgresql" in async_url:
        sync_url = async_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    elif sync_url.startswith("postgres://"):
        sync_url = sync_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif sync_url.startswith("postgresql://"):
        sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif sync_url.startswith("postgresql+asyncpg://"):
        sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    elif not sync_url:
        sync_url = "sqlite:///./dineflow.db"

    return async_url, sync_url


DATABASE_URL, SYNC_DATABASE_URL = format_database_urls(settings.DATABASE_URL, settings.SYNC_DATABASE_URL)


# ==========================================================
# DATABASE ENGINES
# ==========================================================

is_sqlite = DATABASE_URL.startswith("sqlite")

if is_sqlite:
    async_engine = create_async_engine(
        DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        connect_args={
            "check_same_thread": False,
        },
    )

    sync_engine = create_engine(
        SYNC_DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={
            "check_same_thread": False,
        },
    )
else:
    connect_args = {}
    if "neon.tech" in DATABASE_URL:
        connect_args["ssl"] = "require"

    async_engine = create_async_engine(
        DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args,
    )

    sync_engine = create_engine(
        SYNC_DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,
    )


# ==========================================================
# SESSION FACTORIES
# ==========================================================

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


# ==========================================================
# BASE MODEL
# ==========================================================

class Base(DeclarativeBase):

    @declared_attr.directive
    def __tablename__(cls):
        import re

        return re.sub(
            r"(?<!^)(?=[A-Z])",
            "_",
            cls.__name__,
        ).lower() + "s"


# ==========================================================
# MIXINS
# ==========================================================

class TimestampMixin:

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class SoftDeleteMixin:

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )


class UUIDPrimaryKeyMixin:

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )


# ==========================================================
# DATABASE DEPENDENCY
# ==========================================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:

    async with AsyncSessionLocal() as session:

        try:
            yield session
            await session.commit()

        except Exception:
            await session.rollback()
            raise

        finally:
            await session.close()