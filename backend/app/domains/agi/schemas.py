from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


AGICategory = Literal[
    "Route Optimization",
    "Risk Warning",
    "Trade Opportunity",
    "Port Advisory",
    "Weather Alert",
    "Sanctions Intelligence",
]
Priority = Literal["critical", "high", "medium", "low"]


class AGIDecisionOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    category: AGICategory
    title: str
    summary: str
    reasoning: str
    confidence: int
    priority: Priority
    affectedVessels: Optional[list[str]] = Field(
        default=None, validation_alias="affected_vessels", serialization_alias="affectedVessels"
    )
    affectedPorts: Optional[list[str]] = Field(
        default=None, validation_alias="affected_ports", serialization_alias="affectedPorts"
    )
    estimatedSaving: Optional[str] = Field(
        default=None, validation_alias="estimated_saving", serialization_alias="estimatedSaving"
    )
    timestamp: str
    isActioned: bool = Field(validation_alias="is_actioned", serialization_alias="isActioned")


class AGIExecuteOut(BaseModel):
    id: str
    executed: bool = True
    executedAt: datetime


class AGIAnalyzeOut(BaseModel):
    runId: str
    decisions: list[AGIDecisionOut]
    _meta: dict


class AGIModelStatus(BaseModel):
    provider: str
    model: str
    proModel: str
    lastRunAt: Optional[datetime] = None
