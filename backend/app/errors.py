"""Standard error envelope + FastAPI exception handlers."""

from __future__ import annotations

from typing import Any, Optional

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class APIError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        detail: Optional[Any] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(message)


def envelope(code: str, message: str, detail: Any = None) -> dict:
    payload: dict = {"error": {"code": code, "message": message}}
    if detail is not None:
        payload["error"]["detail"] = detail
    return payload


# ---- handlers ----


async def api_error_handler(_request: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=envelope(exc.code, exc.message, exc.detail),
    )


async def validation_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=envelope(
            "validation_error",
            "Input failed validation.",
            detail=exc.errors(),
        ),
    )


_HTTP_CODE_MAP = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    409: "conflict",
    422: "validation_error",
    500: "internal",
    502: "provider_error",
}


async def http_exception_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = _HTTP_CODE_MAP.get(exc.status_code, "error")
    return JSONResponse(
        status_code=exc.status_code,
        content=envelope(code, str(exc.detail or "Error")),
    )


async def unhandled_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=envelope("internal", f"Unhandled error: {exc.__class__.__name__}"),
    )
