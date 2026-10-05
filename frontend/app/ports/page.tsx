"use client";

import { useState } from "react";
import { ports, congestionHistory } from "../data/ports";
import ProtectedPage from "../components/auth/ProtectedPage";
import { Port, PortStatus } from "../types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const statusConfig: Record<PortStatus, { bg: string; text: string; border: string; dot: string }> = {
  "Operational": { bg: "rgba(74,99,71,0.08)", text: "#4A6347", border: "rgba(74,99,71,0.25)", dot: "#4A6347" },
  "Congested": { bg: "rgba(166,139,61,0.08)", text: "#A68B3D", border: "rgba(166,139,61,0.25)", dot: "#A68B3D" },
  "Critical": { bg: "rgba(139,82,82,0.08)", text: "#8B5252", border: "rgba(139,82,82,0.25)", dot: "#8B5252" },
  "Maintenance": { bg: "rgba(154,143,130,0.08)", text: "#7A7068", border: "rgba(154,143,130,0.25)", dot: "#9A8F82" },
};

function CongestionMeter({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#8B5252" : pct >= 60 ? "#A68B3D" : pct >= 40 ? "#B89B4A" : "#4A6347";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-body text-xs tracking-[0.25em] uppercase text-greige">Congestion</span>
        <span className="font-body font-num text-lg" style={{ color, fontWeight: 500, letterSpacing: "-0.01em" }}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-parchment rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function PortCard({ port }: { port: Port }) {
  const cfg = statusConfig[port.status];
  const isHotspot = port.status === "Congested" || port.status === "Critical";
  return (
    <div
      className="card-soft card-soft--hover p-6 cursor-default group"
      style={{
        borderColor: isHotspot ? cfg.border : "rgba(212,203,191,0.4)",
        boxShadow: isHotspot
          ? `inset 3px 0 0 0 ${cfg.dot}, 0 1px 2px rgba(26,24,22,0.025), 0 1px 3px rgba(26,24,22,0.025)`
          : undefined,
      }}
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-body text-xs tracking-[0.35em] uppercase text-stone mb-1.5">{port.region}</div>
          <div className="font-display text-xl text-charcoal-deep leading-tight" style={{ letterSpacing: "-0.01em" }}>
            {port.name}
          </div>
          <div className="font-body text-xs text-greige mt-0.5">{port.country} · {port.unlocode}</div>
        </div>
        <span
          className="font-body text-xs tracking-[0.2em] uppercase px-2 py-1 border flex-shrink-0 ml-2"
          style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
          {port.status}
        </span>
      </div>

      {/* Congestion meter */}
      <div className="mb-4">
        <CongestionMeter pct={port.congestionPct} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-sand/30">
        <div>
          <div className="font-body text-xs tracking-[0.2em] uppercase text-greige mb-0.5">Queue</div>
          <div className="text-stat-sm text-charcoal-deep">{port.queueCount}</div>
          <div className="font-body text-xs text-stone">vessels</div>
        </div>
        <div>
          <div className="font-body text-xs tracking-[0.2em] uppercase text-greige mb-0.5">Avg Wait</div>
          <div className="text-stat-sm text-charcoal-deep">{port.avgWaitHours}h</div>
          <div className="font-body text-xs text-stone">hours</div>
        </div>
        <div>
          <div className="font-body text-xs tracking-[0.2em] uppercase text-greige mb-0.5">TEU/Mo</div>
          <div className="text-stat-sm text-charcoal-deep">
            {(port.throughputTEU / 1000).toFixed(0)}K
          </div>
          <div className="font-body text-xs text-stone">units</div>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-sand/50 p-3 shadow-lg">
        <p className="font-body text-xs tracking-[0.25em] uppercase text-greige mb-1">{label}</p>
        <p className="font-body font-num text-base text-charcoal-deep font-medium">{payload[0].value.toLocaleString()} TEU/mo</p>
      </div>
    );
  }
  return null;
};

function PortsContent() {
  const [filter, setFilter] = useState<PortStatus | "All">("All");

  const filtered = filter === "All" ? ports : ports.filter((p) => p.status === filter);
  const chartData = [...ports]
    .sort((a, b) => b.throughputTEU - a.throughputTEU)
    .slice(0, 10)
    .map((p) => ({ name: p.unlocode, teu: Math.round(p.throughputTEU / 1000) }));

  return (
    <div className="min-h-full" style={{ background: "#FAF8F5" }}>
      {/* Header */}
      <div className="px-8 lg:px-12 pt-10 pb-8 border-b border-sand/30">
        <div className="text-label-sm text-greige mb-3">Operations</div>
        <h1 className="text-h1 text-charcoal-deep">
          Port Operations
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-px bg-gold-muted opacity-60" />
          <span className="font-body text-sm text-greige">
            20 global ports · Real-time congestion monitoring · AGI advisory
          </span>
        </div>
      </div>

      {/* Throughput Chart */}
      <div className="px-8 lg:px-12 pt-8 pb-6">
        <div className="bg-white border border-sand/40 p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-label-sm text-greige mb-1">Monthly</div>
              <div className="text-h2 text-charcoal-deep">
                Port Throughput Comparison — Top 10
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3" style={{ background: "#B89B4A" }} />
              <span className="font-body text-xs tracking-[0.15em] uppercase text-stone">TEU (thousands)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(180, 170, 155, 0.20)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9A8F82", fontSize: 10, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9A8F82", fontSize: 10, fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="teu" fill="#B89B4A" radius={[2, 2, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 lg:px-12 pb-5">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="tab-row flex-1 min-w-0">
            {(["All", "Operational", "Congested", "Critical", "Maintenance"] as const).map((f) => {
              const isActive = filter === f;
              const cfg = f !== "All" ? statusConfig[f as PortStatus] : null;
              const accent = isActive ? (cfg?.text ?? "#2D2A26") : "transparent";
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(f as any)}
                  className="tab-item"
                  style={{ borderBottomColor: accent }}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <span className="font-body font-num text-xs text-stone pb-3" style={{ fontWeight: 500 }}>
            {filtered.length} ports
          </span>
        </div>
      </div>

      {/* Port Grid */}
      <div className="px-8 lg:px-12 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((port) => (
          <PortCard key={port.id} port={port} />
        ))}
      </div>
    </div>
  );
}

export default function PortsPage() {
  return (
    <ProtectedPage path="/ports">
      <PortsContent />
    </ProtectedPage>
  );
}
