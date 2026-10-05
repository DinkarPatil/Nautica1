"use client";

import { useState, useMemo } from "react";
import { vessels } from "../data/vessels";
import { ports } from "../data/ports";
import { Vessel, VesselStatus } from "../types";
import { X, ChevronUp, ChevronDown, ArrowUpRight } from "lucide-react";
import ProtectedPage from "../components/auth/ProtectedPage";
import RoleGate from "../components/auth/RoleGate";
import RouteOptimizer from "../components/fleet/RouteOptimizer";

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  "En Route": { bg: "rgba(201,169,98,0.10)", text: "#9A7F35", border: "rgba(201,169,98,0.30)" },
  "At Port": { bg: "rgba(74,85,104,0.10)", text: "#4A5568", border: "rgba(74,85,104,0.30)" },
  "Delayed": { bg: "rgba(166,139,61,0.10)", text: "#A68B3D", border: "rgba(166,139,61,0.30)" },
  "Flagged": { bg: "rgba(139,82,82,0.10)", text: "#8B5252", border: "rgba(139,82,82,0.30)" },
  "Anchored": { bg: "rgba(154,143,130,0.10)", text: "#7A7068", border: "rgba(154,143,130,0.30)" },
};

const filters: VesselStatus[] = ["En Route", "At Port", "Delayed", "Flagged", "Anchored"];

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? "#8B5252" : score >= 40 ? "#A68B3D" : "#B89B4A";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-parchment rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-body font-num text-sm font-medium" style={{ color }}>{score}</span>
    </div>
  );
}

function VesselDetailPanel({ vessel, onClose }: { vessel: Vessel; onClose: () => void }) {
  const statusCfg = statusColors[vessel.status];
  return (
    <div className="animate-slide-in-right fixed right-0 top-[72px] bottom-[40px] w-[420px] bg-white border-l border-sand/50 shadow-xl z-30 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-sand/30 px-7 py-5 flex items-start justify-between">
        <div>
          <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-1">{vessel.type}</div>
          <div className="text-h2 text-charcoal-deep">{vessel.name}</div>
          <div className="font-body text-xs text-stone mt-0.5">{vessel.imo}</div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-parchment rounded-sm transition-colors mt-0.5">
          <X size={16} className="text-stone" />
        </button>
      </div>

      <div className="px-7 py-6 space-y-6">
        {/* Status + Risk */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-sand/30">
            <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-2">Status</div>
            <span
              className="font-body text-xs tracking-[0.15em] uppercase px-2.5 py-1.5 border"
              style={{ background: statusCfg.bg, color: statusCfg.text, borderColor: statusCfg.border }}
            >
              {vessel.status}
            </span>
          </div>
          <div className="p-4 border border-sand/30">
            <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-2">Risk Score</div>
            <RiskBar score={vessel.riskScore} />
          </div>
        </div>

        {/* Flag + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-sand/30">
            <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-1">Flag State</div>
            <div className="font-body text-lg text-charcoal-deep font-medium">{vessel.flagEmoji} {vessel.flag}</div>
          </div>
          <div className="p-4 border border-sand/30">
            <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-1">Speed</div>
            <div className="text-stat-sm text-charcoal-deep" style={{ fontSize: "1.5rem" }}>{vessel.speed} <span className="font-body font-normal text-base text-greige">kts</span></div>
          </div>
        </div>

        {/* Position */}
        <div className="p-4 border border-sand/30">
          <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-2">Position</div>
          <div className="font-body text-xs text-charcoal-warm tracking-widest">
            {Math.abs(vessel.lat).toFixed(4)}° {vessel.lat >= 0 ? "N" : "S"} &nbsp;·&nbsp; {Math.abs(vessel.lng).toFixed(4)}° {vessel.lng >= 0 ? "E" : "W"}
          </div>
          <div className="font-body text-xs text-stone mt-1">Heading {vessel.heading}° · Draught {vessel.draught}m</div>
        </div>

        {/* Route */}
        <div className="p-4 border border-sand/30">
          <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-3">Voyage</div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-body text-xs text-greige uppercase tracking-wider mb-0.5">Departed</div>
              <div className="font-body text-base text-charcoal-deep font-medium">{vessel.portOfOrigin}</div>
            </div>
            <ArrowUpRight size={14} className="text-gold-muted flex-shrink-0" />
            <div className="flex-1 text-right">
              <div className="font-body text-xs text-greige uppercase tracking-wider mb-0.5">Destination</div>
              <div className="font-body text-base text-charcoal-deep font-medium">{vessel.portOfDestination}</div>
            </div>
          </div>
          {vessel.eta !== "Unknown" && (
            <div className="mt-3 pt-3 border-t border-sand/30">
              <div className="font-body text-xs text-greige uppercase tracking-wider mb-0.5">ETA</div>
              <div className="font-body font-num text-lg text-charcoal-deep" style={{ fontWeight: 500 }}>
                {new Date(vessel.eta).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            </div>
          )}
        </div>

        {/* Cargo + DWT */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-sand/30">
            <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-1">Cargo</div>
            <div className="font-body text-base text-charcoal-deep font-medium">{vessel.cargo}</div>
          </div>
          <div className="p-4 border border-sand/30">
            <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-1">Deadweight</div>
            <div className="font-body font-num text-lg text-charcoal-deep" style={{ fontWeight: 500 }}>{vessel.dwt.toLocaleString()} <span className="font-body font-normal text-xs text-greige">MT</span></div>
          </div>
        </div>

        {/* AGI Recommendation */}
        <RoleGate anyPermission={["VIEW_ALL", "RUN_AGI", "VIEW_TRADE_AGI"]}>
          {vessel.agiRecommendation && (
            <div className="p-4 border-l-2 border-gold-muted" style={{ background: "rgba(232,220,196,0.3)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-muted" />
                <span className="font-body text-xs tracking-[0.3em] uppercase text-gold-deep">AGI Recommendation</span>
              </div>
              <div className="font-body text-xs text-charcoal-warm leading-relaxed">{vessel.agiRecommendation}</div>
            </div>
          )}
        </RoleGate>
      </div>
    </div>
  );
}

type SortKey = "name" | "status" | "riskScore" | "speed" | "portOfDestination";

function FleetContent() {
  const [activeFilter, setActiveFilter] = useState<VesselStatus | "All">("All");
  const [selected, setSelected] = useState<Vessel | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let data = vessels;
    if (activeFilter !== "All") data = data.filter((v) => v.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.imo.toLowerCase().includes(q) ||
        v.flag.toLowerCase().includes(q) ||
        v.portOfDestination.toLowerCase().includes(q)
      );
    }
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [activeFilter, sortKey, sortDir, search]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? sortDir === "asc" ? <ChevronUp size={12} className="text-gold-muted" /> : <ChevronDown size={12} className="text-gold-muted" />
      : <ChevronDown size={12} className="text-stone/40" />
  );

  return (
    <div className="min-h-full" style={{ background: "#FAF8F5" }}>
      {/* Header */}
      <div className="px-8 lg:px-12 pt-10 pb-8 border-b border-sand/30">
        <div className="text-label-sm text-greige mb-3">Operations</div>
        <h1 className="text-h1 text-charcoal-deep">
          Fleet Intelligence
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-px bg-gold-muted opacity-60" />
          <span className="font-body text-sm text-greige">
            {vessels.length} vessels · Real-time AIS tracking · AGI-enhanced routing
          </span>
        </div>
      </div>

      {/* Filters + Search — unified text-tab pattern */}
      <div className="px-8 lg:px-12 pt-6 pb-5">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="tab-row flex-1 min-w-0">
            <button
              role="tab"
              aria-selected={activeFilter === "All"}
              onClick={() => setActiveFilter("All")}
              className="tab-item"
              style={{ borderBottomColor: activeFilter === "All" ? "#2D2A26" : "transparent" }}
            >
              All <span className="font-num text-stone ml-1" style={{ fontWeight: 400 }}>({vessels.length})</span>
            </button>
            {filters.map((f) => {
              const count = vessels.filter((v) => v.status === f).length;
              const cfg = statusColors[f];
              const isActive = activeFilter === f;
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(f)}
                  className="tab-item"
                  style={{ borderBottomColor: isActive ? cfg.text : "transparent" }}
                >
                  {f} <span className="font-num text-stone ml-1" style={{ fontWeight: 400 }}>({count})</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 pb-2">
            <RouteOptimizer vessels={vessels} ports={ports} selectedVessel={selected} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vessel, IMO, port..."
              className="font-body text-sm text-charcoal-warm placeholder:text-taupe bg-white border border-sand/50 px-4 py-2 w-56 outline-none focus:border-gold-muted focus:ring-1 focus:ring-gold-muted/20 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 lg:px-12 pb-12">
        <div className="bg-white border border-sand/40 overflow-hidden">
          {/* Table head */}
          <div className="grid gap-0 border-b border-sand/40" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1fr 0.8fr" }}>
            {[
              { key: "name" as SortKey, label: "Vessel" },
              { key: null, label: "Flag" },
              { key: "status" as SortKey, label: "Status" },
              { key: "speed" as SortKey, label: "Speed" },
              { key: "portOfDestination" as SortKey, label: "Destination" },
              { key: "riskScore" as SortKey, label: "Risk" },
              { key: null, label: "Type" },
            ].map(({ key, label }, i) => (
              <div
                key={label}
                className={`px-5 py-3 flex items-center gap-1.5 ${key ? "cursor-pointer hover:bg-ivory-warm" : ""} transition-colors duration-150`}
                onClick={() => key && toggleSort(key)}
                style={{ background: i === 0 ? "rgba(237,232,223,0.5)" : undefined }}
              >
                <span className="font-body text-xs tracking-[0.3em] uppercase text-stone">{label}</span>
                {key && <SortIcon k={key} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-sand/20">
            {filtered.map((vessel, i) => {
              const statusCfg = statusColors[vessel.status];
              const isSelected = selected?.id === vessel.id;
              const isHighRisk = vessel.riskScore > 80;
              const baseBg = i % 2 === 0 ? "white" : "#F5F1EA";
              const rowBg = isSelected
                ? "rgba(232,220,196,0.3)"
                : isHighRisk
                ? "rgba(139,82,82,0.045)"
                : baseBg;
              const leftAccent = isSelected
                ? "2px solid #B89B4A"
                : isHighRisk
                ? "2px solid rgba(139,82,82,0.45)"
                : "2px solid transparent";
              return (
                <div
                  key={vessel.id}
                  className="grid cursor-pointer transition-colors duration-150 hover:bg-ivory-warm group"
                  style={{
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1fr 0.8fr",
                    background: rowBg,
                    borderLeft: leftAccent,
                  }}
                  onClick={() => setSelected(isSelected ? null : vessel)}
                >
                  <div className="px-5 py-4 flex items-center gap-2">
                    {vessel.riskScore >= 70 && <div className="w-1.5 h-1.5 rounded-full bg-maritime-error flex-shrink-0 animate-risk-pulse" />}
                    <div>
                      <div className="font-body text-sm text-charcoal-deep font-medium group-hover:text-noir transition-colors">{vessel.name}</div>
                      <div className="font-body text-xs text-stone">{vessel.imo}</div>
                    </div>
                  </div>
                  <div className="px-5 py-4 flex items-center">
                    <span className="font-body text-sm">{vessel.flagEmoji}</span>
                    <span className="font-body text-xs text-stone ml-1.5">{vessel.flag.slice(0, 8)}</span>
                  </div>
                  <div className="px-5 py-4 flex items-center">
                    <span
                      className="font-body text-xs tracking-[0.2em] uppercase px-2 py-1 border"
                      style={{ background: statusCfg.bg, color: statusCfg.text, borderColor: statusCfg.border }}
                    >
                      {vessel.status}
                    </span>
                  </div>
                  <div className="px-5 py-4 flex items-center">
                    <span className="font-body font-num text-base text-charcoal-deep font-medium">{vessel.speed}</span>
                    <span className="font-body text-xs text-greige ml-1">kts</span>
                  </div>
                  <div className="px-5 py-4 flex items-center">
                    <div className="font-body text-xs text-charcoal-warm truncate">{vessel.portOfDestination}</div>
                  </div>
                  <div className="px-5 py-4 flex items-center">
                    <RiskBar score={vessel.riskScore} />
                  </div>
                  <div className="px-5 py-4 flex items-center">
                    <span className="font-body text-xs tracking-[0.1em] text-stone">{vessel.type}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-sand/30 flex items-center justify-between" style={{ background: "rgba(237,232,223,0.3)" }}>
            <span className="font-body text-xs text-stone">
              Showing {filtered.length} of {vessels.length} vessels
            </span>
            <span className="font-body text-xs text-stone">
              Click any row to view vessel intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && <VesselDetailPanel vessel={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function FleetPage() {
  return (
    <ProtectedPage path="/fleet">
      <FleetContent />
    </ProtectedPage>
  );
}
