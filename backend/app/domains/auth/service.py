from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...errors import APIError
from .jwt import encode_token
from .models import AuthEvent, User
from .password import verify_password
from .schemas import TokenPair, UserOut


def _user_to_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        name=u.name,
        email=u.email,
        role=u.role,  # type: ignore[arg-type]
        avatar=u.avatar,
        organization=u.organization,
        lastLogin=u.last_login_at,
    )


async def _record_event(
    db: AsyncSession, *, user_id: Optional[str], email: Optional[str], action: str, success: bool
) -> None:
    db.add(AuthEvent(user_id=user_id, email=email, action=action, success=success))
    await db.flush()


async def login(db: AsyncSession, *, email: str, password: str) -> TokenPair:
    email = email.strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        await _record_event(db, user_id=None, email=email, action="login", success=False)
        raise APIError("unauthorized", "Invalid email or password.", status_code=401)

    user.last_login_at = datetime.now(tz=timezone.utc)
    await db.flush()
    await _record_event(db, user_id=user.id, email=email, action="login", success=True)

    return TokenPair(
        access_token=encode_token(user.id, user.role, "access"),
        refresh_token=encode_token(user.id, user.role, "refresh"),
        user=_user_to_out(user),
    )


async def get_user_by_id(db: AsyncSession, uid: str) -> User:
    user = (await db.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    if user is None:
        raise APIError("not_found", "User not found", status_code=404)
    return user


async def get_user_out(db: AsyncSession, uid: str) -> UserOut:
    return _user_to_out(await get_user_by_id(db, uid))
