"""Password hashing — bcrypt via passlib."""

from __future__ import annotations

from passlib.context import CryptContext

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=10)


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _pwd.verify(plain, hashed)
    except Exception:  # pragma: no cover — passlib defends but we don't crash on user input
        return False
