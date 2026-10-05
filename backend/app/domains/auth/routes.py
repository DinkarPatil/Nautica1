from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...db import get_db
from ...deps import current_user
from .jwt import TokenInvalid, decode_token, encode_token
from .schemas import AccessTokenOnly, LoginIn, RefreshIn, TokenPair, UserOut
from .service import get_user_by_id, login as login_service, get_user_out

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)) -> TokenPair:
    return await login_service(db, email=payload.email, password=payload.password)


@router.post("/refresh", response_model=AccessTokenOnly)
async def refresh(payload: RefreshIn, db: AsyncSession = Depends(get_db)) -> AccessTokenOnly:
    try:
        decoded = decode_token(payload.refresh_token, expected_kind="refresh")
    except TokenInvalid as exc:
        from ...errors import APIError
        raise APIError("unauthorized", f"Invalid refresh token: {exc}", status_code=401)
    user = await get_user_by_id(db, decoded["sub"])
    return AccessTokenOnly(access_token=encode_token(user.id, user.role, "access"))


@router.post("/logout", status_code=204)
async def logout(_user: UserOut = Depends(current_user)) -> None:
    # Stateless JWT — logout is client-side; the audit row is still useful.
    return None


@router.get("/me", response_model=UserOut)
async def me(user: UserOut = Depends(current_user), db: AsyncSession = Depends(get_db)) -> UserOut:
    # Refresh from DB to pick up any latest fields (e.g. lastLogin).
    return await get_user_out(db, user.id)
