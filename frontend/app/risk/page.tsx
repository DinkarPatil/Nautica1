"use client";

import { useState } from "react";
import { alerts } from "../data/alerts";
import ProtectedPage from "../components/auth/ProtectedPage";
import RoleGate from "../components/auth/RoleGate";
import { vessels } from "../data/vessels";
import { Alert, AlertSeverity, AlertType } from "../types";
import {
  ComposableMap, Geographies, Geography,
} from "react-simple-maps";
import { Search, ShieldAlert, AlertTriangle, Info, CloudRain, Globe, Shield, Route, Wifi } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const severityConfig: Record<AlertSeverity, { bg: string; text: string; border: string; barColor: string; label: string }> = {
  critical: { bg: "rgba(139,82,82,0.08)", text: "#8B5252", border: "rgba(139,82,82,0.25)", barColor: "#8B5252", label: "Critical" },
  high: { bg: "rgba(166,139,61,0.08)", text: "#A68B3D", border: "rgba(166,139,61,0.25)", barColor: "#A68B3D", label: "High" },
  medium: { bg: "rgba(74,90,106,0.08)", text: "#4A5A6A", border: "rgba(74,90,106,0.25)", barColor: "#4A5A6A", label: "Medium" },
  low: { bg: "rgba(154,143,130,0.08)", text: "#7A7068", border: "rgba(154,143,130,0.25)", barColor: "#9A8F82", label: "Low" },
};

const typeConfig: Record<AlertType, { Icon: any; label: string }> = {
  sanctions: { Icon: Shield, label: "Sanctions" },
  weather: { Icon: CloudRain, label: "Weather" },
  geopolitical: { Icon: Globe, label: "Geopolitical" },
  route: { Icon: Route, label: "Route" },
  cyber: { Icon: Wifi, label: "Cyber" },
};

// Mock sanctions data
const KNOWN_VESSELS = [
  "MSC Glimmora", "Meridian Sovereign", "Baltic Navigator", "Pacific Empress",
  "Caspian Star", "Atlantic Virtue", "Orient Champion",
];
const SANCTIONED_VESSELS = [
  "Volga Express", "Persian Gulf Star", "Orinoco Current", "Black Sea Eagle",
  "Euphrates Light", "Sirocco Spirit", "DPRK Stellar", "Iran Victory",
  "Cuba Liberator", "Russia Arctic", "Sanctions Vessel",
];

function AlertCard({ alert, expanded, onToggle }: { alert: Alert; expanded: boolean; onToggle: () => void }) {
  const cfg = severityConfig[alert.severity];
  const typeCfg = typeConfig[alert.type];
  const TypeIcon = typeCfg.Icon;

  return (
    <div
      className="border border-sand/40 transition-all duration-200 cursor-pointer"
      style={{ borderLeftWidth: "3px", borderLeftColor: cfg.barColor, background: expanded ? cfg.bg : "white" }}
      onClick={onToggle}
    >
      <div className="p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
          <TypeIcon size={16} style={{ color: cfg.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="font-body text-xs tracking-[0.25em] uppercase px-2 py-0.5 border"
              style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
            >
              {cfg.label}
            </span>
            <span className="font-body text-xs tracking-[0.2em] uppercase text-stone">{typeCfg.label}</span>
            {!alert.isRead && <div className="w-1.5 h-1.5 rounded-full bg-maritime-error" />}
          </div>
          <div className="font-body text-base text-charcoal-deep font-medium leading-snug">
            {alert.title}
          </div>
          {alert.location && (
            <div className="font-body text-xs text-stone mt-1">📍 {alert.location}</div>
          )}
          <div className="font-body text-xs text-greige mt-1">
            {new Date(alert.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} UTC
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-5 pl-[calc(1.25rem+2.25rem+1rem)]">
          <div className="font-body text-sm text-charcoal-warm leading-relaxed border-t border-sand/30 pt-4">
            {alert.description}
          </div>
          {alert.vesselId && (
            <div className="mt-3 flex items-center gap-2">
              <span className="font-body text-xs tracking-[0.3em] uppercase text-greige">Linked Vessel:</span>
              <span className="font-body text-sm text-charcoal-deep font-medium">
                {vessels.find((v) => v.id === alert.vesselId)?.name || alert.vesselId}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Geopolitical risk regions (simplified)
const riskRegions = [
  { id: "630", risk: "critical", name: "Yemen/Red Sea" },
  { id: "804", risk: "critical", name: "Ukraine" },
  { id: "364", risk: "critical", name: "Iran" },
  { id: "408", risk: "critical", name: "North Korea" },
  { id: "760", risk: "high", name: "Syria" },
  { id: "218", risk: "high", name: "Venezuela" },
  { id: "434", risk: "high", name: "Libya" },
  { id: "706", risk: "high", name: "Somalia" },
  { id: "591", risk: "medium", name: "Panama" },
  { id: "275", risk: "medium", name: "Palestine" },
];

const geoRiskColors: Record<string, string> = {
  critical: "#8B5252",
  high: "#A68B3D",
  medium: "#B89B4A",
  safe: "#5C6B7A",
};

function RiskContent() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<"match" | "clear" | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");

  const handleSearch = () => {
    if (!query.trim()) return;
    const q = query.trim().toLowerCase();
    const isSanctioned = SANCTIONED_VESSELS.some((v) => v.toLowerCase().includes(q) || q.includes(v.toLowerCase()));
    setResult(isSanctioned ? "match" : "clear");
  };

  const filteredAlerts = alerts.filter((a) => {
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;

  return (
    <div className="min-h-full" style={{ background: "#FAF8F5" }}>
      {/* Header */}
      <div className="px-8 lg:px-12 pt-10 pb-8 border-b border-sand/30">
        <div className="text-label-sm text-greige mb-3">Intelligence</div>
        <h1 className="text-h1 text-charcoal-deep">
          Risk & Sanctions
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-px bg-gold-muted opacity-60" />
          <span className="font-body text-sm text-greige">
            {criticalCount} critical · {highCount} high priority · OFAC/UN/EU sanctions screening
          </span>
        </div>
      </div>

      <div className="px-8 lg:px-12 pt-8 pb-12 space-y-8">
        {/* Top row: Sanctions search + Summary stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sanctions Search */}
          <div className="lg:col-span-2 bg-white border border-sand/40 p-7">
            <div className="text-label-sm text-greige mb-1">OFAC / UN / EU</div>
            <div className="text-h2 text-charcoal-deep mb-5">
              Sanctions Screening
            </div>

            <div className="flex gap-0">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter vessel name, IMO, company, or individual..."
                className="flex-1 font-body text-sm text-charcoal-warm placeholder:text-taupe bg-ivory-cream border border-sand px-6 py-4 outline-none focus:border-gold-muted focus:ring-1 focus:ring-gold-muted/20 transition-all duration-200"
              />
              <button
                onClick={handleSearch}
                className="btn-base btn-primary px-8 py-4 flex-shrink-0"
                style={{ fontSize: "13px" }}
              >
                <Search size={14} strokeWidth={1.6} />
                Screen
              </button>
            </div>

            {result && (
              <div
                className="mt-5 p-5 border"
                style={
                  result === "match"
                    ? { background: "rgba(139,82,82,0.05)", borderColor: "rgba(139,82,82,0.25)", borderLeftWidth: "4px", borderLeftColor: "#8B5252" }
                    : { background: "rgba(74,99,71,0.05)", borderColor: "rgba(74,99,71,0.25)", borderLeftWidth: "4px", borderLeftColor: "#4A6347" }
                }
              >
                <div className="flex items-center gap-3 mb-3">
                  {result === "match" ? (
                    <>
                      <ShieldAlert size={20} style={{ color: "#8B5252" }} />
                      <span className="text-h3" style={{ color: "#8B5252" }}>
                        Sanctions Match Detected
                      </span>
                    </>
                  ) : (
                    <>
                      <Info size={20} style={{ color: "#4A6347" }} />
                      <span className="text-h3" style={{ color: "#4A6347" }}>
                        No Sanctions Match — Clear
                      </span>
                    </>
                  )}
                </div>
                <div className="font-body text-sm text-charcoal-warm">
                  {result === "match"
                    ? `"${query}" appears on OFAC Specially Designated Nationals (SDN) list and/or UN Security Council consolidated sanctions list. Do not engage. Alert compliance officer immediately.`
                    : `"${query}" does not appear on OFAC SDN, UN consolidated, or EU autonomous sanctions lists as of April 5, 2026. Screening valid for 24 hours.`}
                </div>
                <div className="font-body text-xs text-greige mt-2 tracking-[0.15em]">
                  Screened against: OFAC SDN · UN SC Consolidated · EU Autonomous · HMT OFSI · IMO list
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-sand/30">
              <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-2">Try screening:</div>
              <div className="flex flex-wrap gap-2">
                {["DPRK Stellar", "Volga Express", "MSC Glimmora", "Iran Victory", "Cuba Liberator"].map((name) => (
                  <button
                    key={name}
                    onClick={() => { setQuery(name); setResult(null); }}
                    className="font-body text-xs px-3 py-1.5 border border-sand/50 text-stone hover:border-gold-muted hover:text-charcoal-warm transition-colors duration-150"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="bg-white border border-sand/40 p-7">
            <div className="text-label-sm text-greige mb-1">Summary</div>
            <div className="text-h2 text-charcoal-deep mb-5">
              Alert Breakdown
            </div>
            <div className="space-y-4">
              {(["critical", "high", "medium", "low"] as AlertSeverity[]).map((sev) => {
                const cfg = severityConfig[sev];
                const count = alerts.filter((a) => a.severity === sev).length;
                return (
                  <div key={sev} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.barColor }} />
                    <span className="font-body text-xs text-charcoal-warm flex-1 capitalize">{sev}</span>
                    <span className="text-stat-sm text-charcoal-deep" style={{ fontSize: "1.5rem" }}>{count}</span>
                  </div>
                );
              })}
              {(["sanctions", "weather", "geopolitical", "route", "cyber"] as AlertType[]).map((type) => {
                const cfg = typeConfig[type];
                const count = alerts.filter((a) => a.type === type).length;
                const Icon = cfg.Icon;
                return (
                  <div key={type} className="flex items-center gap-3 pt-3 border-t border-sand/20 first-of-type:pt-0 first-of-type:border-t-0">
                    <Icon size={13} className="text-stone flex-shrink-0" />
                    <span className="font-body text-xs text-stone flex-1">{cfg.label}</span>
                    <span className="font-body text-sm text-charcoal-warm">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Geopolitical Map */}
        <div className="bg-white border border-sand/40">
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-sand/30">
            <div>
              <div className="text-label-sm text-greige mb-1">Intelligence Layer</div>
              <div className="text-h2 text-charcoal-deep">
                Geopolitical Risk Map
              </div>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: "Critical", color: "#8B5252" },
                { label: "High", color: "#A68B3D" },
                { label: "Medium", color: "#B89B4A" },
                { label: "Safe", color: "#5C6B7A" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                  <span className="font-body text-xs tracking-[0.15em] uppercase text-stone">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 340, background: "#EDE8DF" }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 120, center: [10, 20] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const risk = riskRegions.find((r) => r.id === geo.id);
                    const fill = risk ? geoRiskColors[risk.risk] : "#5C6B7A";
                    const opacity = risk ? 1 : 0.6;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#2C3E50"
                        strokeWidth={0.4}
                        fillOpacity={opacity}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fillOpacity: 0.85 },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>

        {/* Alerts Feed */}
        <div>
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="text-label-sm text-greige mb-1">Active</div>
              <div className="text-h2 text-charcoal-deep">
                Intelligence Alerts — {filteredAlerts.length} items
              </div>
            </div>
          </div>

          <div className="tab-row mb-5">
            {(["all", "sanctions", "weather", "geopolitical", "route", "cyber"] as const).map((t) => {
              const isActive = typeFilter === t;
              return (
                <button
                  key={t}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTypeFilter(t)}
                  className="tab-item"
                  style={{
                    borderBottomColor: isActive ? "#2D2A26" : "transparent",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                expanded={expandedAlert === alert.id}
                onToggle={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
              />
            ))}
          </div>

          {/* Create Alert — gated */}
          <RoleGate anyPermission={["VIEW_ALL", "CREATE_ALERT", "ESCALATE"]}>
            <div className="mt-5 flex justify-end">
              <button className="btn-base btn-ghost">
                + Create alert
              </button>
            </div>
          </RoleGate>
        </div>
      </div>
    </div>
  );
}

export default function RiskPage() {
  return (
    <ProtectedPage path="/risk">
      <RiskContent />
    </ProtectedPage>
  );
}
