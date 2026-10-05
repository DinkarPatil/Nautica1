from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


Role = Literal["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"]


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    avatar: str
    organization: str
    lastLogin: datetime | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshIn(BaseModel):
    refresh_token: str


class AccessTokenOnly(BaseModel):
    access_token: str
    token_type: str = "bearer"
