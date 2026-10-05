import type {
  AIBrief,
  CauseAttribution,
  ETASnapshot,
  Milestone,
  Port,
  Voyage,
  VoyageAlert,
  VoyageEvent,
  VoyageLiveSnapshot,
  VoyageReport,
} from "@/types/voyage";
import { voyageApiLive } from "./voyageApiClient";

const USE_MOCK =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCK === "1") || false;

/* -------------------------------------------------------------------------- */
/* Mock fixtures                                                              */
/* -------------------------------------------------------------------------- */

const mockOrigin: Port = {
  id: "p_alg",
  unlocode: "ESALG",
  name: "Algeciras",
  country: "ES",
  lat: 36.1408,
  lon: -5.4533,
};

const mockDestination: Port = {
  id: "p_rtm",
  unlocode: "NLRTM",
  name: "Rotterdam",
  country: "NL",
  lat: 51.9244,
  lon: 4.4777,
};

const planned: { lat: number; lon: number }[] = [
  { lat: 36.1408, lon: -5.4533 },
  { lat: 36.0, lon: -2.0 },
  { lat: 37.5, lon: 4.0 },
  { lat: 41.0, lon: 9.5 },
  { lat: 43.5, lon: 8.0 },
  { lat: 47.0, lon: -2.0 },
  { lat: 50.2, lon: 1.5 },
  { lat: 51.9244, lon: 4.4777 },
];

const mockVoyage: Voyage = {
  id: "v_001",
  ship: {
    id: "s_falcon",
    name: "MV Nordic Falcon",
    imo: "9876543",
    type: "container",
    flag: "BS",
  },
  origin: mockOrigin,
  destination: mockDestination,
  plannedDeparture: "2026-04-26T04:00:00Z",
  plannedArrival: "2026-05-02T12:24:00Z",
  actualDeparture: "2026-04-26T04:12:00Z",
  status: "in_transit",
  phase: "in_transit",
  sensitivity: "strict",
  trackingMode: "realtime",
  alertPreference: "full",
  cargoPriority: "high",
  delayToleranceMin: 60,
  routePlanned: planned,
  createdAt: "2026-04-25T18:00:00Z",
  updatedAt: "2026-04-29T14:08:00Z",
};

const mockLive: VoyageLiveSnapshot = {
  voyageId: "v_001",
  position: { lat: 36.7783, lon: 14.2241 },
  sog: 14.2,
  cog: 87,
  heading: 89,
  distanceRemainingNm: 1284,
  distanceTotalNm: 2206,
  progressPct: 58,
  currentETA: "2026-05-02T14:38:00Z",
  etaDeltaMin: 134,
  etaConfidence: 0.78,
  riskScore: 62,
  riskBand: "medium",
  phase: "in_transit",
  asOf: new Date().toISOString(),
};

const mockEvents: VoyageEvent[] = [
  {
    id: "e_5",
    voyageId: "v_001",
    category: "eta",
    severity: "warning",
    ts: "2026-04-29T14:08:00Z",
    title: "ETA revised +1h 50m",
    detail: "Congestion forecast: Strait of Bonifacio · 6 vessels queued",
  },
  {
    id: "e_4",
    voyageId: "v_001",
    category: "route",
    severity: "info",
    ts: "2026-04-29T13:42:00Z",
    title: "Track 1.2 nm south of plan",
    detail: "Within tolerance · auto-correcting",
  },
  {
    id: "e_3",
    voyageId: "v_001",
    category: "speed",
    severity: "warning",
    ts: "2026-04-29T09:47:00Z",
    title: "Speed reduced to 11.4 kn",
    detail: "BF6 winds from 240° · master discretion",
  },
  {
    id: "e_2",
    voyageId: "v_001",
    category: "weather",
    severity: "warning",
    ts: "2026-04-29T07:00:00Z",
    title: "Weather warning issued",
    detail: "BF6 expected next 4h, sector E of Sardinia",
  },
  {
    id: "e_1",
    voyageId: "v_001",
    category: "departure",
    severity: "info",
    ts: "2026-04-26T04:12:00Z",
    title: "Departed Algeciras",
    detail: "Pilot disembarked 04:08 · all cargo manifested",
  },
];

const mockAlerts: VoyageAlert[] = [
  {
    id: "a_1",
    voyageId: "v_001",
    category: "delay",
    severity: "warning",
    title: "ETA shifted +2h 14m",
    detail: "Weather + congestion · 14:08 UTC",
    raisedAt: "2026-04-29T14:08:00Z",
    acknowledged: false,
  },
  {
    id: "a_2",
    voyageId: "v_001",
    category: "deviation",
    severity: "info",
    title: "Track 1.2 nm south of plan",
    detail: "Within tolerance · 13:42 UTC",
    raisedAt: "2026-04-29T13:42:00Z",
    acknowledged: false,
  },
  {
    id: "a_3",
    voyageId: "v_001",
    category: "weather",
    severity: "warning",
    title: "BF6 winds expected next 4h",
    detail: "Sector E of Sardinia",
    raisedAt: "2026-04-29T07:00:00Z",
    acknowledged: false,
  },
];

const mockBrief: AIBrief = {
  voyageId: "v_001",
  asOf: "2026-04-29T14:10:00Z",
  whatIsHappening:
    "The vessel is ~2h 14m behind plan, primarily due to weather-driven speed reduction east of Sardinia. ETA is now May 02, 14:38 UTC.",
  whatChanged:
    "Speed dropped from 14.8 to 11.4 kn at 09:47 UTC; congestion now forecast at Bonifacio.",
  whyETAMoved:
    "BF6 winds 240° + 6-vessel queue ahead. Both factors compound on the planned track.",
  riskBand: "medium",
  recommendation:
    "Hold current routing. Rerouting via Sicily Channel adds 8h. Notify Rotterdam VTS of revised ETA.",
  riskFactors: [
    { key: "weather", value: 70 },
    { key: "traffic", value: 55 },
    { key: "routing", value: 42 },
  ],
};

const mockEtaSeries: ETASnapshot[] = [
  { ts: "2026-04-26T04:12:00Z", eta: "2026-05-02T12:24:00Z", confidence: 0.92, deltaMinFromPrev: 0 },
  { ts: "2026-04-29T09:47:00Z", eta: "2026-05-02T13:08:00Z", confidence: 0.81, deltaMinFromPrev: 44, cause: "weather" },
  { ts: "2026-04-29T14:08:00Z", eta: "2026-05-02T14:58:00Z", confidence: 0.74, deltaMinFromPrev: 110, cause: "congestion" },
  { ts: "2026-04-29T18:30:00Z", eta: "2026-05-02T14:38:00Z", confidence: 0.78, deltaMinFromPrev: -20, cause: "weather" },
];

const mockAttribution: CauseAttribution = {
  voyageId: "v_001",
  factors: [
    { key: "weather", weightPct: 48, note: "Bonifacio sector, BF6 winds 240°" },
    { key: "congestion", weightPct: 32, note: "6-vessel queue at Bonifacio, avg wait 90m" },
    { key: "speed", weightPct: 16, note: "voluntary reduction 14.8 → 11.4 kn" },
    { key: "routing", weightPct: 4, note: "minor track adjustment for traffic" },
  ],
  generatedAt: "2026-04-29T14:10:00Z",
};

const mockMilestones: Milestone[] = [
  { key: "m_dep", name: "Departure Algeciras", plannedTs: "2026-04-26T04:00:00Z", actualTs: "2026-04-26T04:12:00Z", deltaMin: 12 },
  { key: "m_gib", name: "Gibraltar transit", plannedTs: "2026-04-26T18:00:00Z", actualTs: "2026-04-26T18:14:00Z", deltaMin: 14 },
  { key: "m_bon", name: "Bonifacio transit", plannedTs: "2026-04-28T06:30:00Z", actualTs: "2026-04-28T09:08:00Z", deltaMin: 158 },
  { key: "m_app", name: "Approach Rotterdam", plannedTs: "2026-05-02T12:00:00Z", projectedTs: "2026-05-02T14:00:00Z", deltaMin: 120 },
  { key: "m_dock", name: "Docking Rotterdam", plannedTs: "2026-05-02T12:24:00Z", projectedTs: "2026-05-02T14:38:00Z", deltaMin: 134 },
];

const mockReport: VoyageReport = {
  voyage: { ...mockVoyage, status: "completed", phase: "docking", actualArrival: "2026-05-02T14:38:00Z" },
  routeNm: 2206,
  routeActualNm: 2218,
  durationActualMin: 9266,
  durationPlannedMin: 9132,
  summary:
    "Voyage completed +2h 14m behind plan. Primary cause: weather-driven slowdown east of Sardinia (Apr 28). No deviation events exceeded tolerance. Final risk score: 62 (Medium).",
  etaSeries: mockEtaSeries,
  events: mockEvents,
  alerts: mockAlerts,
  attribution: mockAttribution,
  milestones: mockMilestones,
  finalRiskScore: 62,
  aiConclusion:
    "The voyage absorbed weather and congestion impact within tolerance and delivered within the medium-risk band. Recommend retaining current routing for repeat sailings; flag Bonifacio sector for May–Sept advisory.",
};

const mockPorts: Port[] = [
  mockOrigin,
  mockDestination,
  { id: "p_sgp", unlocode: "SGSIN", name: "Singapore", country: "SG", lat: 1.2655, lon: 103.8183 },
  { id: "p_sha", unlocode: "CNSHA", name: "Shanghai", country: "CN", lat: 31.2304, lon: 121.4737 },
  { id: "p_lax", unlocode: "USLAX", name: "Los Angeles", country: "US", lat: 33.7395, lon: -118.262 },
  { id: "p_ham", unlocode: "DEHAM", name: "Hamburg", country: "DE", lat: 53.5511, lon: 9.9937 },
  { id: "p_jeb", unlocode: "AEJEA", name: "Jebel Ali", country: "AE", lat: 24.9857, lon: 55.0566 },
];

/* -------------------------------------------------------------------------- */
/* API surface — currently mocked. Swap fetch URLs in once backend lands.     */
/* -------------------------------------------------------------------------- */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const voyageApiMock = {
  async getVoyage(_id: string): Promise<Voyage> {
    await delay(120);
    return mockVoyage;
  },
  async getLive(_id: string): Promise<VoyageLiveSnapshot> {
    await delay(80);
    return mockLive;
  },
  async getEvents(_id: string): Promise<VoyageEvent[]> {
    await delay(120);
    return mockEvents;
  },
  async getAlerts(_id: string): Promise<VoyageAlert[]> {
    await delay(90);
    return mockAlerts;
  },
  async getBrief(_id: string): Promise<AIBrief> {
    await delay(140);
    return mockBrief;
  },
  async getETASeries(_id: string): Promise<ETASnapshot[]> {
    await delay(100);
    return mockEtaSeries;
  },
  async getAttribution(_id: string): Promise<CauseAttribution> {
    await delay(120);
    return mockAttribution;
  },
  async getMilestones(_id: string): Promise<Milestone[]> {
    await delay(100);
    return mockMilestones;
  },
  async getReport(_id: string): Promise<VoyageReport> {
    await delay(180);
    return mockReport;
  },
  async searchPorts(q: string): Promise<Port[]> {
    await delay(120);
    if (!q.trim()) return mockPorts.slice(0, 5);
    const needle = q.toLowerCase();
    return mockPorts.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.unlocode.toLowerCase().includes(needle) ||
        p.country.toLowerCase().includes(needle)
    );
  },
  async lookupShip(imo: string): Promise<{ matched: boolean; ship?: { name: string; type: string; flag: string } }> {
    await delay(160);
    if (imo === "9876543") return { matched: true, ship: { name: "MV Nordic Falcon", type: "Container 2,750 TEU", flag: "BS" } };
    return { matched: false };
  },
  async createVoyage(input: Partial<Voyage>): Promise<{ id: string }> {
    await delay(220);
    return { id: input.id ?? "v_001" };
  },
  async ackAlert(_voyageId: string, alertId: string): Promise<{ id: string; acknowledged: true }> {
    await delay(80);
    return { id: alertId, acknowledged: true };
  },
};

export const voyageApi = USE_MOCK ? voyageApiMock : voyageApiLive;
