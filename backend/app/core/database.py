import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

from sqlalchemy import (
    Boolean,
    DateTime,
    String,
    create_engine,
)

from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    declared_attr,
    mapped_column,
    sessionmaker,
)

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings


# ==========================================================
# DATABASE URLS
# ==========================================================

DATABASE_URL = settings.DATABASE_URL
SYNC_DATABASE_URL = settings.SYNC_DATABASE_URL


# Convert generic postgres URLs if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+asyncpg://",
        1,
    )

if SYNC_DATABASE_URL.startswith("postgresql://"):
    SYNC_DATABASE_URL = SYNC_DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg2://",
        1,
    )


# ----------------------------------------------------------
# Remove unsupported asyncpg query parameters
# ----------------------------------------------------------

def clean_asyncpg_url(url: str) -> str:
    parsed = urlparse(url)

    query = dict(parse_qsl(parsed.query))

    query.pop("sslmode", None)
    query.pop("channel_binding", None)

    return urlunparse(
        parsed._replace(query=urlencode(query))
    )


if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = clean_asyncpg_url(DATABASE_URL)


print("=" * 80)
print("ASYNC DATABASE :", DATABASE_URL)
print("SYNC DATABASE  :", SYNC_DATABASE_URL)
print("=" * 80)


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

    async_engine = create_async_engine(
        DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
        connect_args={
            "ssl": True,
        },
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