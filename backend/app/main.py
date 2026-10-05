from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import __version__
from .config import get_settings
from .db import create_all
from .errors import (
    APIError,
    api_error_handler,
    http_exception_handler,
    unhandled_handler,
    validation_handler,
)
from .logging_setup import setup_logging


def _register_prompts() -> None:
    """Register prompt directories (one per AI-using domain)."""
    from pathlib import Path
    from .services.llm.registry import register_prompt_dir

    here = Path(__file__).parent
    register_prompt_dir(here / "domains" / "voyage" / "prompts")
    register_prompt_dir(here / "domains" / "agi" / "prompts")


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    s = get_settings()
    setup_logging(s.LOG_LEVEL)
    log = logging.getLogger("startup")
    log.info(
        "boot",
        extra={
            "env": s.ENV,
            "ai_provider": s.resolved_provider,
            "gcp_project": s.GCP_PROJECT,
            "model": s.GEMINI_MODEL,
            "model_pro": s.GEMINI_MODEL_PRO,
            "db": s.DATABASE_URL.split("://", 1)[0] + "://…",
        },
    )

    _register_prompts()

    # Tables
    await create_all()

    # Seed (idempotent)
    from .seed.seed_runner import run_seed
    await run_seed()

    yield


def create_app() -> FastAPI:
    s = get_settings()

    app = FastAPI(
        title="GlimmoraNautica Backend",
        version=__version__,
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=s.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Error handlers
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(RequestValidationError, validation_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_handler)

    # Routers (imported here so models register with metadata first)
    from .domains.meta.routes import router as meta_router
    from .domains.auth.routes import router as auth_router
    from .domains.fleet.routes import router as fleet_router
    from .domains.ports.routes import router as ports_router
    from .domains.risk.routes import router as risk_router
    from .domains.trade.routes import router as trade_router
    from .domains.agi.routes import router as agi_router
    from .domains.voyage.routes import router as voyage_router
    from .domains.dashboard.routes import router as dashboard_router

    for r in (
        meta_router,
        auth_router,
        fleet_router,
        ports_router,
        risk_router,
        trade_router,
        agi_router,
        voyage_router,
        dashboard_router,
    ):
        app.include_router(r)

    return app


app = create_app()
