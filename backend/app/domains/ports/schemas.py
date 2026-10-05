from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PortStatus = Literal["Operational", "Congested", "Critical", "Maintenance"]


class PortOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    country: str
    countryCode: str = Field(validation_alias="country_code", serialization_alias="countryCode")
    unlocode: str
    lat: float
    lng: float
    congestionPct: int = Field(validation_alias="congestion_pct", serialization_alias="congestionPct")
    queueCount: int = Field(validation_alias="queue_count", serialization_alias="queueCount")
    avgWaitHours: float = Field(validation_alias="avg_wait_hours", serialization_alias="avgWaitHours")
    throughputTEU: int = Field(validation_alias="throughput_teu", serialization_alias="throughputTEU")
    status: PortStatus
    region: str


class CongestionPointOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    date: str
    global_: int = Field(alias="global", serialization_alias="global", validation_alias="global_pct")
    pacific: int = Field(validation_alias="pacific_pct", serialization_alias="pacific")
    atlantic: int = Field(validation_alias="atlantic_pct", serialization_alias="atlantic")


class VoyagePortOut(BaseModel):
    """Shape used by /voyage/new port picker (lat/`lon`, not lng)."""

    id: str
    unlocode: str
    name: str
    country: str
    lat: float
    lon: float
