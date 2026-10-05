from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


AlertType = Literal["sanctions", "weather", "geopolitical", "route", "cyber"]
AlertSeverity = Literal["critical", "high", "medium", "low"]


class AlertOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    location: Optional[str] = None
    vesselId: Optional[str] = Field(default=None, validation_alias="vessel_id", serialization_alias="vesselId")
    timestamp: str
    isRead: bool = Field(validation_alias="is_read", serialization_alias="isRead")


class AlertCreate(BaseModel):
    type: AlertType
    severity: AlertSeverity
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    location: Optional[str] = None
    vesselId: Optional[str] = None


class RiskRegionOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    lat: float
    lng: float
    level: Literal["critical", "high", "medium", "low"]
    summary: str


class SanctionsScreenIn(BaseModel):
    query: str = Field(min_length=1)
    type: Optional[Literal["vessel", "company", "person", "any"]] = "any"


class SanctionsHit(BaseModel):
    name: str
    source: str
    listEntry: Optional[str] = None
    score: Optional[float] = None
    schema_: Optional[str] = Field(default=None, alias="schema")
    countries: Optional[list[str]] = None


class SanctionsScreenOut(BaseModel):
    matched: bool
    hits: list[SanctionsHit]
    explanation: str
    source: str
    _meta: dict[str, Any] | None = None
