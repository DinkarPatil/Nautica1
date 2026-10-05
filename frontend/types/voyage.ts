export type VoyageStatus =
  | "draft"
  | "ready"
  | "active"
  | "in_transit"
  | "approaching_destination"
  | "delayed"
  | "completed"
  | "archived"
  // Legacy values kept for backward compatibility:
  | "created"
  | "departed"
  | "approaching"
  | "docked"
  | "aborted";

export type AlertLifecycle = "new" | "acknowledged" | "resolved";

export interface SourceTag {
  name: string;
  url?: string | null;
  fetchedAt: string;
  confidence: number;
  kind: "live" | "derived" | "mock";
  excerpt?: string | null;
}

export type VoyagePhase = "departure" | "in_transit" | "approach" | "docking";

export type VoyageType = "cargo" | "container" | "tanker" | "other";

export type MonitoringSensitivity = "normal" | "strict" | "critical";

export type TrackingMode = "realtime" | "scheduled" | "manual";

export type AlertPreference = "eta_only" | "route_only" | "full";

export type CargoPriority = "standard" | "high" | "critical";

export type RiskBand = "low" | "medium" | "high";

export type EventCategory =
  | "departure"
  | "eta"
  | "route"
  | "speed"
  | "weather"
  | "congestion"
  | "incident"
  | "arrival";

export type AlertCategory =
  | "delay"
  | "deviation"
  | "weather"
  | "congestion"
  | "anomaly"
  | "arrival_window";

export type Severity = "info" | "warning" | "danger";

export type CauseKey = "weather" | "congestion" | "speed" | "routing";

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface Port {
  id: string;
  unlocode: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface Ship {
  id: string;
  name: string;
  imo?: string;
  type: VoyageType;
  flag?: string;
}

export interface Voyage {
  id: string;
  ship: Ship;
  origin: Port;
  destination: Port;
  plannedDeparture: string;
  plannedArrival?: string;
  actualDeparture?: string;
  actualArrival?: string;
  status: VoyageStatus;
  phase: VoyagePhase;
  sensitivity: MonitoringSensitivity;
  trackingMode: TrackingMode;
  alertPreference: AlertPreference;
  cargoPriority?: CargoPriority;
  delayToleranceMin?: number;
  preferredRoute?: string;
  watchlistCompany?: string;
  notes?: string;
  routePlanned: Coordinate[];
  createdAt: string;
  updatedAt: string;
}

export interface VoyageLiveSnapshot {
  voyageId: string;
  position: Coordinate;
  sog: number;
  cog: number;
  heading: number;
  distanceRemainingNm: number;
  distanceTotalNm: number;
  progressPct: number;
  currentETA: string;
  etaDeltaMin: number;
  etaConfidence: number;
  riskScore: number;
  riskBand: RiskBand;
  phase: VoyagePhase;
  asOf: string;
}

export interface ETASnapshot {
  ts: string;
  eta: string;
  confidence: number;
  deltaMinFromPrev: number;
  cause?: CauseKey;
  /** ETA Drift Narrator output: a one-line plain-English explanation. */
  narration?: string | null;
}

export interface VoyageEvent {
  id: string;
  voyageId: string;
  category: EventCategory;
  severity: Severity;
  ts: string;
  title: string;
  detail?: string;
  position?: Coordinate;
  meta?: Record<string, unknown>;
  source?: SourceTag | null;
}

export interface VoyageAlert {
  id: string;
  voyageId: string;
  category: AlertCategory;
  severity: Severity;
  title: string;
  detail: string;
  raisedAt: string;
  resolvedAt?: string;
  acknowledged: boolean;
  lifecycle?: AlertLifecycle;
  confidence?: number | null;
  linkedEventId?: string | null;
  triageNote?: string | null;
  source?: SourceTag | null;
}

// ─── Phase 2: voyage-product schemas ─────────────────────────────────────────

export interface ReadinessFactor {
  field: string;
  status: "ok" | "warn" | "missing";
  note: string;
}

export interface VoyageReadiness {
  score: number;
  band: "red" | "amber" | "green";
  factors: ReadinessFactor[];
  canStart: boolean;
}

export interface CopilotSuggestion {
  field: string;
  suggestedValue: string;
  reason: string;
}

export interface CopilotResult {
  suggestions: CopilotSuggestion[];
  nextQuestion?: string | null;
}

export interface StorylineChapter {
  ts: string;
  label: string;
  narration: string;
  severity: Severity;
  sourceRef?: string | null;
}

export interface VoyageStoryline {
  voyageId: string;
  chapters: StorylineChapter[];
  generatedAt: string;
}

export interface TriageItem {
  alertId: string;
  rank: number;
  severity: Severity;
  title: string;
  actionNow: boolean;
  explanation: string;
}

export interface VoyageTriage {
  voyageId: string;
  items: TriageItem[];
  generatedAt: string;
}

export interface ScorecardComponent {
  name: "punctuality" | "routeAdherence" | "operationalSmoothness";
  score: number;
  note: string;
}

export interface VoyageScorecard {
  voyageId: string;
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  components: ScorecardComponent[];
  summary: string;
  generatedAt: string;
}

export interface StateTransition {
  voyageId: string;
  fromState?: string | null;
  toState: VoyageStatus;
  ts: string;
  actor?: string | null;
  note?: string | null;
}

export interface AIBriefRiskFactor {
  key: "weather" | "traffic" | "routing";
  value: number;
}

export interface AIBrief {
  voyageId: string;
  asOf: string;
  whatIsHappening: string;
  whatChanged: string;
  whyETAMoved: string;
  riskBand: RiskBand;
  recommendation: string;
  riskFactors: AIBriefRiskFactor[];
}

export interface CauseFactor {
  key: CauseKey;
  weightPct: number;
  note?: string;
}

export interface CauseAttribution {
  voyageId: string;
  factors: CauseFactor[];
  generatedAt: string;
}

export interface Milestone {
  key: string;
  name: string;
  plannedTs: string;
  actualTs?: string;
  projectedTs?: string;
  deltaMin?: number;
}

export interface VoyageReport {
  voyage: Voyage;
  routeNm: number;
  routeActualNm: number;
  durationActualMin: number;
  durationPlannedMin: number;
  summary: string;
  etaSeries: ETASnapshot[];
  events: VoyageEvent[];
  alerts: VoyageAlert[];
  attribution: CauseAttribution;
  milestones: Milestone[];
  finalRiskScore: number;
  aiConclusion: string;
}

export type StreamEvent =
  | { kind: "snapshot"; payload: VoyageLiveSnapshot }
  | { kind: "event"; payload: VoyageEvent }
  | { kind: "alert"; payload: VoyageAlert }
  | { kind: "brief"; payload: AIBrief };
