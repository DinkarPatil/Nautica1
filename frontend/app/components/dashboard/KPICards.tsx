"use client";

import { useEffect, useRef, useState } from "react";
import { Ship, AlertTriangle, TrendingUp, Leaf, Activity, Anchor, Sparkles } from "lucide-react";
import { useSimulation, KpiSnapshot } from "../../context/SimulationContext";

type KpiKey = keyof KpiSnapshot | "vessels" | "uptime";

interface KpiDef {
  key: KpiKey;
  label: string;
  unit: string;
  suffix: string;
  icon: typeof Ship;
  color: keyof typeof colorMap;
  description: string;
  baseDelta: string;
  baseDeltaPositive: boolean;
  optimizedDelta?: string;
}

const colorMap = {
  sapphire: { accent: "#4A5568", iconBg: "rgba(74,85,104,0.08)", iconColor: "#4A5568" },
  warning:  { accent: "#A68B3D", iconBg: "rgba(166,139,61,0.08)", iconColor: "#A68B3D" },
  error:    { accent: "#8B5252", iconBg: "rgba(139,82,82,0.08)", iconColor: "#8B5252" },
  gold:     { accent: "#B89B4A", iconBg: "rgba(184,155,74,0.08)", iconColor: "#B89B4A" },
  success:  { accent: "#4A6347", iconBg: "rgba(74,99,71,0.08)", iconColor: "#4A6347" },
};

const KPI_DEFS: KpiDef[] = [
  {
    key: "vessels", label: "Vessels Underway", unit: "", suffix: "", icon: Ship, color: "sapphire",
    description: "Active fleet across all oceans",
    baseDelta: "+3 from yesterday", baseDeltaPositive: true,
  },
  {
    key: "congestion", label: "Global Congestion", unit: "%", suffix: "", icon: Anchor, color: "warning",
    description: "Weighted avg. across 20 ports",
    baseDelta: "+2% since 08:00", baseDeltaPositive: false,
    optimizedDelta: "−5% via AI rerouting",
  },
  {
    key: "riskAlerts", label: "Risk Alerts", unit: "", suffix: " Active", icon: AlertTriangle, color: "error",
    description: "Sanctions, weather, geopolitical",
    baseDelta: "4 critical unread", baseDeltaPositive: false,
    optimizedDelta: "3 cleared by AI dispatch",
  },
  {
    key: "tradeVolume", label: "Trade Volume", unit: "B", suffix: "", icon: TrendingUp, color: "gold",
    description: "USD value of tracked cargo",
    baseDelta: "+12% vs last month", baseDeltaPositive: true,
    optimizedDelta: "+4.6% efficiency gain",
  },
  {
    key: "co2Saved", label: "CO₂ Saved", unit: "T", suffix: "", icon: Leaf, color: "success",
    description: "Via AGI speed optimization",
    baseDelta: "This month via AGI routing", baseDeltaPositive: true,
    optimizedDelta: "+320T post-simulation",
  },
  {
    key: "uptime", label: "System Uptime", unit: "%", suffix: "", icon: Activity, color: "sapphire",
    description: "Sovereign-grade availability",
    baseDelta: "30-day SLA: 99.99%", baseDeltaPositive: true,
  },
];

const STATIC: Record<"vessels" | "uptime", number> = {
  vessels: 78,
  uptime: 99.99,
};

function useAnimatedNumber(target: number, decimals: number) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const start = prev.current;
    const end = target;
    if (start === end) return;
    const duration = 1000;
    const steps = 40;
    const increment = (end - start) / steps;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      if (frame >= steps) {
        setValue(end);
        prev.current = end;
        clearInterval(id);
      } else {
        const next = start + increment * frame;
        setValue(parseFloat(next.toFixed(decimals)));
      }
    }, duration / steps);
    return () => clearInterval(id);
  }, [target, decimals]);

  return value;
}

function CountUp({ target, decimals = 0 }: { target: number; decimals?: number }) {
  const value = useAnimatedNumber(target, decimals);
  return <>{decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}</>;
}

function getValue(def: KpiDef, snap: KpiSnapshot): number {
  if (def.key === "vessels") return STATIC.vessels;
  if (def.key === "uptime") return STATIC.uptime;
  return snap[def.key];
}

export default function KPICards() {
  const { current, active, changedKeys } = useSimulation();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
      {KPI_DEFS.map((def, i) => {
        const { accent, iconBg, iconColor } = colorMap[def.color];
        const Icon = def.icon;
        const value = getValue(def, current);
        const decimals = value % 1 !== 0 ? 2 : 0;
        const isChanged = changedKeys.has(def.key as keyof KpiSnapshot);
        const isOptimized = active && (def.key === "congestion" || def.key === "riskAlerts" || def.key === "tradeVolume" || def.key === "co2Saved");
        // Only show the "AI Optimized" pill on the two headline metrics — keeps the
        // dashboard calm even when several KPIs technically changed.
        const showBadge = active && (def.key === "congestion" || def.key === "riskAlerts");
        const delta = isOptimized && def.optimizedDelta ? def.optimizedDelta : def.baseDelta;
        const deltaPositive = isOptimized ? true : def.baseDeltaPositive;

        return (
          <div
            key={def.label}
            className="animate-fade-in-up card-soft card-soft--hover p-6 group cursor-default relative overflow-hidden"
            style={{
              animationDelay: `${i * 0.08}s`,
              borderColor: isChanged ? "rgba(184,155,74,0.45)" : "rgba(212,203,191,0.4)",
              background: isChanged ? "rgba(184,155,74,0.025)" : "white",
            }}
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: accent, opacity: 0.35 }} />

            <div className="flex items-start justify-between mb-5">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: iconBg }}>
                <Icon size={15} style={{ color: iconColor }} strokeWidth={1.6} />
              </div>
              {showBadge && (
                <span
                  className="inline-flex items-center gap-1 font-body text-[10px] tracking-[0.05em] uppercase px-1.5 py-0.5"
                  style={{ color: "#9A7F35" }}
                >
                  <Sparkles size={9} strokeWidth={1.6} />
                  AI Optimized
                </span>
              )}
            </div>

            <div className="text-stat mb-3" style={{ color: "#2D2A26" }}>
              <CountUp target={value} decimals={decimals} />
              <span className="text-lg" style={{ color: accent, fontWeight: 400 }}>{def.unit}</span>
              {def.suffix && <span className="font-body font-normal text-sm text-greige">{def.suffix}</span>}
            </div>

            {/* Hairline divider */}
            <div className="w-7 h-px mb-3" style={{ background: accent, opacity: 0.4 }} />

            <div className="font-body text-xs tracking-[0.1em] uppercase text-stone leading-snug mb-1.5" style={{ fontWeight: 400 }}>
              {def.label}
            </div>
            <div className={`font-body text-xs ${deltaPositive ? "text-maritime-success" : "text-maritime-error"}`} style={{ fontWeight: 400 }}>
              {delta}
            </div>
          </div>
        );
      })}
    </div>
  );
}
