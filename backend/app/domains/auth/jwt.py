"""JWT helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import JWTError, jwt

from ...config import get_settings


TokenType = Literal["access", "refresh"]


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def encode_token(sub: str, role: str, kind: TokenType) -> str:
    s = get_settings()
    if kind == "access":
        exp = _now() + timedelta(minutes=s.ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        exp = _now() + timedelta(days=s.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": sub,
        "role": role,
        "kind": kind,
        "iat": int(_now().timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, s.JWT_SECRET, algorithm=s.ALGORITHM)


class TokenInvalid(Exception):
    pass


def decode_token(token: str, expected_kind: TokenType | None = None) -> dict[str, Any]:
    s = get_settings()
    try:
        payload = jwt.decode(token, s.JWT_SECRET, algorithms=[s.ALGORITHM])
    except JWTError as exc:
        raise TokenInvalid(str(exc)) from exc
    if expected_kind and payload.get("kind") != expected_kind:
        raise TokenInvalid(f"expected {expected_kind} token, got {payload.get('kind')}")
    return payload
