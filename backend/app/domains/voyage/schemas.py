from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


VoyageStatus = Literal[
    "draft",
    "ready",
    "active",
    "in_transit",
    "approaching_destination",
    "delayed",
    "completed",
    "archived",
    # Legacy values kept for backward compatibility with already-seeded rows:
    "created",
    "departed",
    "approaching",
    "docked",
    "aborted",
]
VoyagePhase = Literal["departure", "in_transit", "approach", "docking"]
VoyageType = Literal["cargo", "container", "tanker", "other"]
Sensitivity = Literal["normal", "strict", "critical"]
TrackingMode = Literal["realtime", "scheduled", "manual"]
AlertPreference = Literal["eta_only", "route_only", "full"]
CargoPriority = Literal["standard", "high", "critical"]
RiskBand = Literal["low", "medium", "high"]
EventCategory = Literal["departure", "eta", "route", "speed", "weather", "congestion", "incident", "arrival"]
AlertCategory = Literal["delay", "deviation", "weather", "congestion", "anomaly", "arrival_window"]
Severity = Literal["info", "warning", "danger"]
CauseKey = Literal["weather", "congestion", "speed", "routing"]


class Coordinate(BaseModel):
    lat: float
    lon: float


class PortMini(BaseModel):
    id: str
    unlocode: str
    name: str
    country: str
    lat: float
    lon: float


class ShipMini(BaseModel):
    id: str
    name: str
    imo: Optional[str] = None
    type: VoyageType
    flag: Optional[str] = None


class VoyageOut(BaseModel):
    id: str
    ship: ShipMini
    origin: PortMini
    destination: PortMini
    plannedDeparture: str
    plannedArrival: Optional[str] = None
    actualDeparture: Optional[str] = None
    actualArrival: Optional[str] = None
    status: VoyageStatus
    phase: VoyagePhase
    sensitivity: Sensitivity
    trackingMode: TrackingMode
    alertPreference: AlertPreference
    cargoPriority: Optional[CargoPriority] = None
    delayToleranceMin: Optional[int] = None
    preferredRoute: Optional[str] = None
    watchlistCompany: Optional[str] = None
    notes: Optional[str] = None
    routePlanned: list[Coordinate]
    createdAt: str
    updatedAt: str


class VoyageSummary(BaseModel):
    id: str
    ship: ShipMini
    origin: PortMini
    destination: PortMini
    status: VoyageStatus
    phase: VoyagePhase
    progressPct: int
    etaDeltaMin: int
    riskBand: RiskBand
    updatedAt: str


class VoyageLiveSnapshot(BaseModel):
    voyageId: str
    position: Coordinate
    sog: float
    cog: int
    heading: int
    distanceRemainingNm: float
    distanceTotalNm: float
    progressPct: int
    currentETA: str
    etaDeltaMin: int
    etaConfidence: float
    riskScore: int
    riskBand: RiskBand
    phase: VoyagePhase
    asOf: str


class SourceTag(BaseModel):
    """Provenance for any data point we surface."""

    name: str
    url: Optional[str] = None
    fetchedAt: str
    confidence: float
    kind: Literal["live", "derived", "mock"]
    excerpt: Optional[str] = None


class VoyageEventOut(BaseModel):
    id: str
    voyageId: str
    category: EventCategory
    severity: Severity
    ts: str
    title: str
    detail: Optional[str] = None
    position: Optional[Coordinate] = None
    meta: Optional[dict] = None
    source: Optional[SourceTag] = None


AlertLifecycle = Literal["new", "acknowledged", "resolved"]


class VoyageAlertOut(BaseModel):
    id: str
    voyageId: str
    category: AlertCategory
    severity: Severity
    title: str
    detail: str
    raisedAt: str
    resolvedAt: Optional[str] = None
    acknowledged: bool
    lifecycle: AlertLifecycle = "new"
    confidence: Optional[float] = None
    linkedEventId: Optional[str] = None
    triageNote: Optional[str] = None
    source: Optional[SourceTag] = None


class VoyageAlertAck(BaseModel):
    id: str
    acknowledged: Literal[True] = True
    lifecycle: AlertLifecycle = "acknowledged"


class VoyageAlertResolve(BaseModel):
    id: str
    lifecycle: AlertLifecycle = "resolved"
    resolvedAt: str


class AIBriefRiskFactor(BaseModel):
    key: Literal["weather", "traffic", "routing"]
    value: int


class AIBrief(BaseModel):
    voyageId: str
    asOf: str
    whatIsHappening: str
    whatChanged: str
    whyETAMoved: str
    riskBand: RiskBand
    recommendation: str
    riskFactors: list[AIBriefRiskFactor]


class ETASnapshot(BaseModel):
    ts: str
    eta: str
    confidence: float
    deltaMinFromPrev: int
    cause: Optional[CauseKey] = None
    # One-line auto-generated narration ("ETA Drift Narrator")
    narration: Optional[str] = None


class CauseFactor(BaseModel):
    key: CauseKey
    weightPct: int
    note: Optional[str] = None


class CauseAttribution(BaseModel):
    voyageId: str
    factors: list[CauseFactor]
    generatedAt: str


class Milestone(BaseModel):
    key: str
    name: str
    plannedTs: str
    actualTs: Optional[str] = None
    projectedTs: Optional[str] = None
    deltaMin: Optional[int] = None


class VoyageReport(BaseModel):
    voyage: VoyageOut
    routeNm: float
    routeActualNm: float
    durationActualMin: int
    durationPlannedMin: int
    summary: str
    etaSeries: list[ETASnapshot]
    events: list[VoyageEventOut]
    alerts: list[VoyageAlertOut]
    attribution: CauseAttribution
    milestones: list[Milestone]
    finalRiskScore: int
    aiConclusion: str


class VoyageDraftIn(BaseModel):
    """Accepts the frontend's `VoyageDraft` shape (string segments) plus
    nested `origin`/`destination` Port objects."""

    shipName: str
    imo: Optional[str] = None
    voyageType: str = "Container"
    origin: Optional[PortMini] = None
    destination: Optional[PortMini] = None
    plannedDeparture: str
    plannedArrival: Optional[str] = None
    sensitivity: str = "Normal"
    trackingMode: str = "Real-time"
    alertPreference: str = "Full intelligence"
    cargoPriority: Optional[str] = None
    delayToleranceMin: Optional[str] = None
    preferredRoute: Optional[str] = None
    watchlistCompany: Optional[str] = None
    notes: Optional[str] = None


class VoyageCreatedOut(BaseModel):
    id: str


class VoyageChatIn(BaseModel):
    message: str = Field(min_length=1)


class VoyageChatOut(BaseModel):
    answer: str
    citations: list[dict] = []


class ShipLookupOut(BaseModel):
    matched: bool
    ship: Optional[dict] = None  # {name, type, flag}


class VoyageInsightOut(BaseModel):
    insight: str
    _meta: Optional[dict] = None


class PreviewBriefIn(VoyageDraftIn):
    pass


class PreviewBriefOut(BaseModel):
    summary: str
    riskBand: RiskBand
    riskFactors: list[AIBriefRiskFactor]


# ─── Voyage Setup Copilot ────────────────────────────────────────────────────


class CopilotSuggestion(BaseModel):
    field: str
    suggestedValue: str
    reason: str


class CopilotIn(VoyageDraftIn):
    pass


class CopilotOut(BaseModel):
    suggestions: list[CopilotSuggestion]
    nextQuestion: Optional[str] = None
    _meta: Optional[dict] = None


# ─── Voyage Readiness Score ──────────────────────────────────────────────────


class ReadinessFactor(BaseModel):
    field: str
    status: Literal["ok", "warn", "missing"]
    note: str


class ReadinessOut(BaseModel):
    score: int  # 0-100
    band: Literal["red", "amber", "green"]
    factors: list[ReadinessFactor]
    canStart: bool


class ReadinessIn(VoyageDraftIn):
    pass


# ─── Voyage Storyline ────────────────────────────────────────────────────────


class StorylineChapter(BaseModel):
    ts: str
    label: str
    narration: str
    severity: Severity = "info"
    sourceRef: Optional[str] = None  # event id or alert id


class StorylineOut(BaseModel):
    voyageId: str
    chapters: list[StorylineChapter]
    generatedAt: str
    _meta: Optional[dict] = None


# ─── Alert Triage Assistant ──────────────────────────────────────────────────


class TriageItem(BaseModel):
    alertId: str
    rank: int
    severity: Severity
    title: str
    actionNow: bool
    explanation: str


class TriageOut(BaseModel):
    voyageId: str
    items: list[TriageItem]
    generatedAt: str
    _meta: Optional[dict] = None


# ─── Voyage Scorecard ────────────────────────────────────────────────────────


class ScorecardComponent(BaseModel):
    name: Literal["punctuality", "routeAdherence", "operationalSmoothness"]
    score: int  # 0-100
    note: str


class ScorecardOut(BaseModel):
    voyageId: str
    overall: int  # 0-100
    grade: Literal["A", "B", "C", "D", "F"]
    components: list[ScorecardComponent]
    summary: str
    generatedAt: str


# ─── State Machine ───────────────────────────────────────────────────────────


class StateTransitionOut(BaseModel):
    voyageId: str
    fromState: Optional[str] = None
    toState: VoyageStatus
    ts: str
    actor: Optional[str] = None
    note: Optional[str] = None


class VoyageStartOut(BaseModel):
    id: str
    state: VoyageStatus
    transition: StateTransitionOut
