import { Vessel, Port, Alert, AGIDecision, AGICategory } from "../types";

// ─── Reroute recommendation ──────────────────────────────────────────────────

export interface RerouteRecommendation {
  vessel: Vessel;
  fromPort: Port;
  toPort: Port;
  congestionDelta: number;
  hoursSaved: number;
  confidence: number;
}

const HIGH_CONGESTION_THRESHOLD = 60;
const ALT_PORT_MAX_CONGESTION = 50;

function findDestinationPort(vessel: Vessel, ports: Port[]): Port | undefined {
  const target = vessel.portOfDestination.toLowerCase();
  return ports.find((p) => p.name.toLowerCase().includes(target) || target.includes(p.name.toLowerCase()));
}

export function recommendReroute(vessel: Vessel, ports: Port[]): RerouteRecommendation | null {
  const dest = findDestinationPort(vessel, ports);
  if (!dest) return null;
  if (dest.congestionPct <= HIGH_CONGESTION_THRESHOLD) return null;

  const candidates = ports
    .filter((p) => p.id !== dest.id && p.region === dest.region && p.congestionPct < ALT_PORT_MAX_CONGESTION)
    .sort((a, b) => a.congestionPct - b.congestionPct);

  const alt = candidates[0];
  if (!alt) return null;

  const congestionDelta = dest.congestionPct - alt.congestionPct;
  const hoursSaved = Math.max(0, dest.avgWaitHours - alt.avgWaitHours);
  // Confidence model: base 70 + congestion delta points, capped at 96.
  const confidence = Math.min(96, 70 + Math.round(congestionDelta * 0.6));

  return { vessel, fromPort: dest, toPort: alt, congestionDelta, hoursSaved, confidence };
}

export function findFleetRerouteOpportunity(
  vessels: Vessel[],
  ports: Port[]
): RerouteRecommendation | null {
  const enRoute = vessels.filter((v) => v.status === "En Route");
  for (const v of enRoute) {
    const rec = recommendReroute(v, ports);
    if (rec) return rec;
  }
  return null;
}

// ─── Alert → synthetic decision ──────────────────────────────────────────────

const ALERT_TO_CATEGORY: Record<string, AGICategory> = {
  weather: "Weather Alert",
  geopolitical: "Risk Warning",
  sanctions: "Sanctions Intelligence",
  route: "Route Optimization",
  cyber: "Risk Warning",
};

const ACTION_BY_TYPE: Record<string, string> = {
  weather: "Recommend route diversion for affected vessels.",
  geopolitical: "Recommend convoy coordination and threat-corridor avoidance.",
  sanctions: "Recommend immediate flag review and port-entry block.",
  route: "Recommend alternate routing via the next-fastest corridor.",
  cyber: "Recommend backup navigation and ECDIS integrity check.",
};

export function synthesizeDecisionFromAlert(alert: Alert): AGIDecision {
  const category = ALERT_TO_CATEGORY[alert.type] ?? "Risk Warning";
  const region = alert.location?.split(",")[0] ?? "active corridor";
  const action = ACTION_BY_TYPE[alert.type] ?? "Recommend immediate operational review.";
  // Confidence weighted by severity.
  const sevBoost = { critical: 12, high: 8, medium: 4, low: 0 }[alert.severity];
  const confidence = Math.min(95, 78 + sevBoost);

  return {
    id: `agi-syn-${alert.id}-${Date.now()}`,
    category,
    title: `AI Core · ${alert.title}`,
    summary: `${alert.severity === "critical" ? "Severe" : "Elevated"} ${alert.type} signal detected in ${region}. ${action}`,
    reasoning: alert.description,
    confidence,
    priority: alert.severity,
    affectedVessels: alert.vesselId ? [alert.vesselId] : undefined,
    timestamp: new Date().toISOString(),
    isActioned: false,
  };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Risk pulse aggregator (dashboard banner) ────────────────────────────────

export interface RiskPulse {
  trigger: boolean;
  unreadCount: number;
  criticalCount: number;
  topAlertTitle?: string;
}

export function computeRiskPulse(alerts: Alert[]): RiskPulse {
  const unread = alerts.filter((a) => !a.isRead);
  const critical = alerts.filter((a) => a.severity === "critical");
  const trigger = unread.length > 5 || critical.length > 0;
  return {
    trigger,
    unreadCount: unread.length,
    criticalCount: critical.length,
    topAlertTitle: critical[0]?.title ?? unread[0]?.title,
  };
}
