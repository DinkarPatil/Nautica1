from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


VesselStatus = Literal["En Route", "At Port", "Delayed", "Flagged", "Anchored"]
VesselType = Literal["Container", "Tanker", "Bulk Carrier", "LNG", "RORO", "Passenger"]


class VesselOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    imo: str
    flag: str
    flagEmoji: str = Field(validation_alias="flag_emoji", serialization_alias="flagEmoji")
    type: VesselType
    lat: float
    lng: float
    speed: float
    heading: int
    status: VesselStatus
    riskScore: int = Field(validation_alias="risk_score", serialization_alias="riskScore")
    portOfOrigin: str = Field(validation_alias="port_of_origin", serialization_alias="portOfOrigin")
    portOfDestination: str = Field(validation_alias="port_of_destination", serialization_alias="portOfDestination")
    eta: str
    cargo: str
    dwt: int
    draught: float
    agiRecommendation: Optional[str] = Field(
        default=None, validation_alias="agi_recommendation", serialization_alias="agiRecommendation"
    )


class VesselListOut(BaseModel):
    items: list[VesselOut]
    total: int
    page: int
    limit: int


class RouteOptimizeIn(BaseModel):
    vesselId: str
    alternatives: Optional[list[str]] = None


class RouteOptimizeOut(BaseModel):
    vesselId: str
    suggestedRoute: list[dict]  # [{lat,lng,name?}, ...]
    fuelSavingPct: float
    etaShiftMin: int
    rationale: str
