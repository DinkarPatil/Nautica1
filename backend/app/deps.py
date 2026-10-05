"""FastAPI dependencies — current user, role guards."""

from __future__ import annotations

import json
from typing import Iterable
from urllib.parse import unquote

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_db
from .domains.auth.jwt import TokenInvalid, decode_token
from .domains.auth.schemas import UserOut
from .domains.auth.service import get_user_out
from .errors import APIError


async def _resolve_user_id(request: Request, authorization: str | None) -> tuple[str, str]:
    """Returns (user_id, role) from either Authorization bearer or `glimmora_session` cookie."""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        try:
            payload = decode_token(token, expected_kind="access")
        except TokenInvalid as exc:
            raise APIError("unauthorized", f"Invalid token: {exc}", status_code=401)
        return payload["sub"], payload.get("role", "")

    cookie = request.cookies.get("glimmora_session")
    if cookie:
        try:
            data = json.loads(unquote(cookie))
            uid = data.get("id")
            role = data.get("role")
            if uid and role:
                return uid, role
        except Exception:  # noqa: BLE001
            pass

    raise APIError("unauthorized", "Authentication required", status_code=401)


async def current_user(
    request: Request,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    uid, _role = await _resolve_user_id(request, authorization)
    return await get_user_out(db, uid)


def require_role(*allowed: str):
    """Dependency factory: only allow listed roles."""

    async def guard(user: UserOut = Depends(current_user)) -> UserOut:
        if user.role not in allowed:
            raise APIError("forbidden", "Your role does not allow this action.", status_code=403)
        return user

    return guard


def require_permission(perm: str):
    """Permission gate based on the role-permission map mirrored from the frontend."""
    from .domains.auth.permissions import has_permission  # local import to avoid cycle

    async def guard(user: UserOut = Depends(current_user)) -> UserOut:
        if not has_permission(user.role, perm):
            raise APIError("forbidden", f"Missing permission: {perm}", status_code=403)
        return user

    return guard


def require_any_permission(perms: Iterable[str]):
    perms = list(perms)
    from .domains.auth.permissions import has_permission

    async def guard(user: UserOut = Depends(current_user)) -> UserOut:
        if not any(has_permission(user.role, p) for p in perms):
            raise APIError("forbidden", "You lack any of the required permissions.", status_code=403)
        return user

    return guard
