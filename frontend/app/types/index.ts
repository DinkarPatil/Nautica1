// ─── Auth & RBAC ────────────────────────────────────────────────────────────

export type UserRole =
  | "ai_core"
  | "executive"
  | "fleet_ops"
  | "trade_intel"
  | "risk_intel"
  | "port_ops";

export type Permission =
  | "VIEW_ALL"
  | "CREATE"
  | "EDIT"
  | "DELETE"
  | "APPROVE"
  | "ESCALATE"
  | "MANAGE_USERS"
  | "AUDIT_LOG"
  | "RUN_AGI"
  | "VIEW_FLEET_POSITION"
  | "VIEW_PORTS"
  | "CREATE_TRADE"
  | "EDIT_TRADE"
  | "VIEW_TRADE_AGI"
  | "VIEW_ALL_ALERTS"
  | "CREATE_ALERT"
  | "EDIT_ALERT"
  | "VIEW_ASSIGNED_PORTS"
  | "VIEW_FLEET_ASSIGNED"
  | "EDIT_PORT_STATUS";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string; // initials
  organization: string;
  lastLogin: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ai_core: "AI Command Core",
  executive: "Fleet Admiral",
  fleet_ops: "Fleet Manager",
  trade_intel: "Trade Officer",
  risk_intel: "Risk Analyst",
  port_ops: "Port Agent",
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  ai_core:     { bg: "rgba(184,155,74,0.12)", text: "#9A7F35", border: "rgba(184,155,74,0.40)" },
  executive:   { bg: "rgba(184,155,74,0.10)", text: "#9A7F35", border: "rgba(184,155,74,0.35)" },
  fleet_ops:   { bg: "rgba(74,85,104,0.10)",  text: "#4A5568", border: "rgba(74,85,104,0.28)" },
  trade_intel: { bg: "rgba(122,156,108,0.10)",text: "#4F6B45", border: "rgba(122,156,108,0.30)" },
  risk_intel:  { bg: "rgba(178,108,108,0.10)",text: "#8C4747", border: "rgba(178,108,108,0.30)" },
  port_ops:    { bg: "rgba(140,120,100,0.10)",text: "#6B5A48", border: "rgba(140,120,100,0.28)" },
};

// ─── Domain Types ────────────────────────────────────────────────────────────

export type VesselStatus = "En Route" | "At Port" | "Delayed" | "Flagged" | "Anchored";

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  flag: string;
  flagEmoji: string;
  type: "Container" | "Tanker" | "Bulk Carrier" | "LNG" | "RORO" | "Passenger";
  lat: number;
  lng: number;
  speed: number; // knots
  heading: number; // degrees
  status: VesselStatus;
  riskScore: number; // 0-100
  portOfOrigin: string;
  portOfDestination: string;
  eta: string; // ISO date string
  cargo: string;
  dwt: number; // deadweight tonnage
  agiRecommendation?: string;
  draught: number;
}

export type PortStatus = "Operational" | "Congested" | "Critical" | "Maintenance";

export interface Port {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  congestionPct: number;
  queueCount: number;
  avgWaitHours: number;
  throughputTEU: number; // monthly
  status: PortStatus;
  region: string;
  unlocode: string;
}

export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertType = "sanctions" | "weather" | "geopolitical" | "route" | "cyber";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  location?: string;
  vesselId?: string;
  timestamp: string;
  isRead: boolean;
}

export type DocStatus = "Processed" | "Pending" | "Flagged" | "Verified";
export type DocType =
  | "Bill of Lading"
  | "Letter of Credit"
  | "Certificate of Origin"
  | "Packing List"
  | "Insurance Certificate"
  | "Phytosanitary Certificate"
  | "Commercial Invoice";

export interface TradeDocument {
  id: string;
  type: DocType;
  title: string;
  vesselName: string;
  shipper: string;
  consignee: string;
  portOfLoading: string;
  portOfDischarge: string;
  commodity: string;
  value: number; // USD
  currency: string;
  status: DocStatus;
  issuedDate: string;
  expiryDate?: string;
  smartContractHash?: string;
  blockchainNetwork?: string;
}

export type AGICategory =
  | "Route Optimization"
  | "Risk Warning"
  | "Trade Opportunity"
  | "Port Advisory"
  | "Weather Alert"
  | "Sanctions Intelligence";

export interface AGIDecision {
  id: string;
  category: AGICategory;
  title: string;
  summary: string;
  reasoning: string;
  confidence: number; // 0-100
  priority: "critical" | "high" | "medium" | "low";
  affectedVessels?: string[];
  affectedPorts?: string[];
  estimatedSaving?: string;
  timestamp: string;
  isActioned: boolean;
}

export interface KPIData {
  activeVessels: number;
  congestionPct: number;
  riskAlerts: number;
  tradeVolumeBn: number;
  co2SavedTons: number;
  uptimePct: number;
}

export interface CongestionDataPoint {
  date: string;
  global: number;
  pacific: number;
  atlantic: number;
}
