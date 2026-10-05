"use client";

import { useState, useMemo } from "react";
import { Brain, RefreshCw, Sparkles } from "lucide-react";
import { agiDecisions } from "../../data/agi-decisions";
import { alerts } from "../../data/alerts";
import { AGIDecision } from "../../types";
import { shuffle, synthesizeDecisionFromAlert } from "../../lib/aiCore";
import ExecuteAIDecisionModal, {
  AIDecisionPayload,
} from "../ai/ExecuteAIDecisionModal";
import { useSimulation } from "../../context/SimulationContext";
import { useToast } from "../../context/ToastContext";

const categoryColors: Record<string, string> = {
  "Risk Warning": "#8B5252",
  "Route Optimization": "#B89B4A",
  "Trade Opportunity": "#4A6347",
  "Port Advisory": "#4A5568",
  "Weather Alert": "#A68B3D",
  "Sanctions Intelligence": "#8B5252",
};

function ConfidencePill({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center font-body font-num text-[10px] tracking-[0.05em] uppercase px-1.5 py-0.5"
      style={{ color: "#9A7F35", fontWeight: 400 }}
    >
      {value}% confidence
    </span>
  );
}

function decisionToPayload(d: AGIDecision): AIDecisionPayload {
  // Try to extract numeric savings from the saving string ("$240,000", "$3.7M", etc.).
  const raw = d.estimatedSaving ?? "";
  let fuelSavingsUsd: number | undefined;
  const millions = raw.match(/\$([\d.]+)\s*M/i);
  const thousands = raw.match(/\$([\d.,]+)/);
  if (millions) fuelSavingsUsd = Math.round(parseFloat(millions[1]) * 1_000_000);
  else if (thousands) fuelSavingsUsd = parseInt(thousands[1].replace(/,/g, ""), 10);

  // Try to extract delay-reduction hours from summary/saving text.
  const hoursMatch = (raw + " " + d.summary).match(/(\d+)\s*hours?/i);
  const estDelayReductionHrs = hoursMatch ? parseInt(hoursMatch[1], 10) : 18;

  return {
    title: d.title,
    body: d.summary,
    estDelayReductionHrs,
    fuelSavingsUsd: fuelSavingsUsd ?? 240_000,
    affectedVessels: d.affectedVessels?.length,
    confidence: d.confidence,
  };
}

export default function AGIFeed() {
  const [decisions, setDecisions] = useState<AGIDecision[]>(agiDecisions);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { active, revert } = useSimulation();
  const { toast } = useToast();

  const refresh = () => {
    setRefreshing(true);
    const candidates = alerts.filter((a) => !a.isRead);
    const seed = candidates[Math.floor(Math.random() * candidates.length)];
    const synth = seed ? synthesizeDecisionFromAlert(seed) : null;
    const next = shuffle(decisions);
    if (synth) next.unshift(synth);
    setDecisions(next.slice(0, 12));
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleRevert = () => {
    revert();
    toast({
      variant: "info",
      title: "Simulation reverted",
      message: "KPIs restored to baseline operational values.",
    });
  };

  // Top-priority executable decision = highest confidence among non-actioned.
  const featured = useMemo(() => {
    const open = decisions.filter((d) => !d.isActioned);
    return [...open].sort((a, b) => b.confidence - a.confidence)[0] ?? decisions[0];
  }, [decisions]);

  const items = useMemo(() => [...decisions, ...decisions], [decisions]);

  return (
    <div className="border border-sand/40 overflow-hidden" style={{ background: "#E8DCC4" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-2.5 border-b border-sand/40"
        style={{ background: "rgba(184,155,74,0.08)" }}
      >
        <Brain size={12} className="text-gold-muted" strokeWidth={1.6} />
        <span className="font-body text-xs tracking-[0.12em] uppercase text-gold-deep" style={{ fontWeight: 500 }}>
          AGI Intelligence Feed — Live
        </span>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-maritime-success animate-pulse" />
            <span className="font-body text-xs tracking-[0.1em] text-stone" style={{ fontWeight: 400 }}>Streaming</span>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 font-body text-xs tracking-[0.05em] uppercase px-2.5 py-1 border border-gold-muted/40 text-gold-deep hover:bg-gold-muted/10 transition-colors disabled:opacity-50"
            style={{ fontWeight: 400 }}
            title="Refresh AI Feed"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Marquee */}
      <div className="overflow-hidden py-3">
        <div className="animate-ticker" key={refreshKey}>
          {items.map((item, i) => {
            const color = categoryColors[item.category] || "#B89B4A";
            return (
              <span key={`${item.id}-${i}`} className="inline-flex items-center gap-3 mx-8">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span
                  className="font-body text-xs tracking-[0.3em] uppercase px-2 py-0.5"
                  style={{ background: color, color: "#FAF8F5", opacity: 0.9 }}
                >
                  {item.category}
                </span>
                <span className="font-body text-xs text-charcoal-warm whitespace-nowrap">
                  {item.summary}
                </span>
                <ConfidencePill value={item.confidence} />
                <span className="text-sand mx-2">◆</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Action strip */}
      {featured && (
        <div
          className="px-5 py-3 border-t border-sand/40 flex items-center gap-4 flex-wrap"
          style={{ background: "rgba(250, 248, 245, 0.6)" }}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <Sparkles size={12} className="text-gold-muted" strokeWidth={1.6} />
            <span className="font-body text-xs tracking-[0.1em] uppercase text-gold-deep" style={{ fontWeight: 400 }}>
              Top Recommendation
            </span>
          </div>
          <span className="font-body text-xs text-charcoal-warm truncate flex-1 min-w-[200px]">
            {featured.title}
          </span>
          <ConfidencePill value={featured.confidence} />
          <div className="flex items-center gap-2">
            {active && (
              <button
                onClick={handleRevert}
                className="font-body text-xs tracking-[0.05em] uppercase px-3 py-1.5 border border-sand/60 text-stone hover:bg-parchment transition-colors"
                style={{ fontWeight: 400 }}
              >
                Revert Simulation
              </button>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.05em] uppercase px-3 py-1.5 border transition-colors"
              style={{
                color: "#9A7F35",
                borderColor: "rgba(184,155,74,0.45)",
                background: "rgba(184,155,74,0.04)",
                fontWeight: 500,
              }}
            >
              <Sparkles size={11} strokeWidth={1.6} />
              Execute recommendation
            </button>
          </div>
        </div>
      )}

      {featured && (
        <ExecuteAIDecisionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          decision={decisionToPayload(featured)}
        />
      )}
    </div>
  );
}
