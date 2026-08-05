import os
from typing import List, Union
from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "DineFlow SaaS Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    SECRET_KEY: str = "change-this-in-production-super-secret-key-dineflow-saas-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # PostgreSQL Database Settings
    POSTGRES_USER: str = "dineflow_user"
    POSTGRES_PASSWORD: str = "dineflow_password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "dineflow_db"
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./dineflow.db"
    SYNC_DATABASE_URL: str = "sqlite:///./dineflow.db"

    # Redis Config
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS Allowed Origins
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "https://fine-dine-nu.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:8000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        default_origins = [
            "https://fine-dine-nu.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:4173",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:4173",
            "http://127.0.0.1:8000",
        ]
        if isinstance(v, str):
            if not v.startswith("["):
                origins = [i.strip() for i in v.split(",") if i.strip()]
            else:
                import json
                try:
                    origins = json.loads(v)
                except Exception:
                    origins = default_origins
        elif isinstance(v, list):
            origins = v
        else:
            origins = default_origins

        out = set(origins)
        out.update(default_origins)
        out.discard("*")
        return list(out)

    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Super Admin Initial Account
    SUPER_ADMIN_EMAIL: str = "admin@dineflow.io"
    SUPER_ADMIN_PASSWORD: str = "SuperSecretAdminPassword123!"

    # Limits & Rules
    MAX_RESTAURANTS_PER_OWNER: int = 10
    RATE_LIMIT_PER_MINUTE: int = 120


settings = Settings()
