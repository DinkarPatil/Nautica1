"""Application configuration. Pydantic-settings reads `.env` and validates required keys.

Fail-fast policy: any missing/malformed required field raises at construction time
so the process exits before serving traffic.
"""

from __future__ import annotations

import base64
import json
import os
from functools import lru_cache
from typing import Literal, Optional

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


AIProviderName = Literal["auto", "stub", "vertex"]


class Settings(BaseSettings):
    """Single source of truth for runtime configuration."""

    # auth
    JWT_SECRET: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # environment
    ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    APP_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000"

    # database
    DATABASE_URL: str = "sqlite:///glimmora.db"

    # ai provider selection
    AI_PROVIDER: AIProviderName = "auto"

    # vertex / gcp
    GCP_SERVICE_ACCOUNT_JSON_B64: Optional[str] = None
    GCP_LOCATION: str = "us-central1"
    GCP_PROJECT: Optional[str] = None  # auto-derived from service account

    # models
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_MODEL_PRO: Optional[str] = None  # falls back to GEMINI_MODEL if unset

    # llm retry budget
    LLM_MAX_RETRIES: int = 1
    LLM_INITIAL_BACKOFF: float = 1.0
    LLM_REQUEST_TIMEOUT_S: float = 60.0

    # frontend (used only for friendly logs)
    FRONTEND_BASE_URL: str = "http://localhost:3000"

    # internal — populated post-validation
    resolved_provider: AIProviderName = "stub"
    decoded_service_account: Optional[dict] = None

    model_config = SettingsConfigDict(
        env_file=os.environ.get("ENV_FILE", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # ----------- validators -----------

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_db_url(cls, v: str) -> str:
        # SQLAlchemy async needs the `+aiosqlite` / `+asyncpg` driver hints.
        if v.startswith("sqlite:///"):
            return v.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @model_validator(mode="after")
    def _resolve_ai_provider(self) -> "Settings":
        sa_json: Optional[dict] = None
        if self.GCP_SERVICE_ACCOUNT_JSON_B64:
            try:
                sa_json = json.loads(base64.b64decode(self.GCP_SERVICE_ACCOUNT_JSON_B64))
            except Exception as exc:  # noqa: BLE001 — fail fast at config time
                raise ValueError(f"GCP_SERVICE_ACCOUNT_JSON_B64 is not valid base64-JSON: {exc}") from exc
            if "project_id" not in sa_json:
                raise ValueError("Decoded GCP service account is missing `project_id`.")
            object.__setattr__(self, "decoded_service_account", sa_json)
            if not self.GCP_PROJECT:
                object.__setattr__(self, "GCP_PROJECT", sa_json["project_id"])

        if self.AI_PROVIDER == "vertex" and sa_json is None:
            raise ValueError(
                "AI_PROVIDER=vertex requires GCP_SERVICE_ACCOUNT_JSON_B64."
            )

        if self.AI_PROVIDER == "auto":
            object.__setattr__(self, "resolved_provider", "vertex" if sa_json else "stub")
        else:
            object.__setattr__(self, "resolved_provider", self.AI_PROVIDER)

        if not self.GEMINI_MODEL_PRO:
            object.__setattr__(self, "GEMINI_MODEL_PRO", self.GEMINI_MODEL)

        return self

    # ----------- helpers -----------

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


def reset_settings_cache() -> None:
    get_settings.cache_clear()
