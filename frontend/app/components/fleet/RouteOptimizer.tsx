"use client";

import { useMemo, useState } from "react";
import { X, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Vessel, Port } from "../../types";
import {
  RerouteRecommendation,
  findFleetRerouteOpportunity,
  recommendReroute,
} from "../../lib/aiCore";

interface Props {
  vessels: Vessel[];
  ports: Port[];
  selectedVessel?: Vessel | null;
  className?: string;
}

export default function RouteOptimizer({ vessels, ports, selectedVessel, className }: Props) {
  const [open, setOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<RerouteRecommendation | null>(null);
  const [evaluated, setEvaluated] = useState(false);

  const targetLabel = useMemo(
    () => (selectedVessel ? selectedVessel.name : "fleet-wide"),
    [selectedVessel]
  );

  const run = () => {
    setOpen(true);
    setThinking(true);
    setEvaluated(false);
    setResult(null);
    // Small delay simulates the "AI is thinking" beat.
    setTimeout(() => {
      const rec = selectedVessel
        ? recommendReroute(selectedVessel, ports)
        : findFleetRerouteOpportunity(vessels, ports);
      setResult(rec);
      setEvaluated(true);
      setThinking(false);
    }, 700);
  };

  const close = () => {
    setOpen(false);
    setResult(null);
    setEvaluated(false);
  };

  return (
    <>
      <button
        onClick={run}
        className={`inline-flex items-center gap-2 font-body text-xs tracking-[0.05em] uppercase px-4 py-2 border transition-all duration-200 hover:bg-ivory-warm ${className ?? ""}`}
        style={{ borderColor: "rgba(184,155,74,0.45)", color: "#9A7F35", background: "rgba(184,155,74,0.04)", fontWeight: 500 }}
      >
        <Sparkles size={12} strokeWidth={1.6} />
        Optimize route
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(26, 24, 22, 0.55)", backdropFilter: "blur(4px)" }}
          onClick={close}
        >
          <div
            className="bg-white border border-sand/50 w-full max-w-[520px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-sand/40"
              style={{ background: "rgba(184,155,74,0.06)" }}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={14} className="text-gold-muted" strokeWidth={1.6} />
                <span className="font-body text-xs tracking-[0.12em] uppercase text-gold-deep" style={{ fontWeight: 500 }}>
                  AI Command Core · Route Engine
                </span>
              </div>
              <button onClick={close} className="p-1 hover:bg-parchment rounded-sm transition-colors">
                <X size={14} className="text-stone" />
              </button>
            </div>

            {/* Body */}
            <div className="px-7 py-7 min-h-[220px] flex flex-col justify-center">
              {thinking && (
                <div className="flex items-center gap-3 text-stone">
                  <Loader2 size={16} className="animate-spin text-gold-muted" />
                  <span className="font-body text-sm">
                    Analyzing congestion vectors for {targetLabel}…
                  </span>
                </div>
              )}

              {!thinking && evaluated && !result && (
                <div>
                  <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-2">
                    No reroute required
                  </div>
                  <div className="text-h3 text-charcoal-deep mb-2">
                    All current corridors operating within nominal congestion bounds.
                  </div>
                  <p className="font-body text-sm text-stone leading-relaxed">
                    AI Command Core scanned destination ports for {targetLabel} and found no port exceeding the 60% congestion threshold with a viable lower-load alternative in the same region.
                  </p>
                </div>
              )}

              {!thinking && result && (
                <div>
                  <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-2">
                    Recommendation · {result.vessel.name}
                  </div>
                  <div className="text-h3 text-charcoal-deep mb-4 leading-snug">
                    High congestion detected at <span className="text-gold-deep">{result.fromPort.name}</span>.
                    <br />
                    Recommended reroute via <span className="text-gold-deep">{result.toPort.name}</span>.
                  </div>

                  {/* Route diagram */}
                  <div className="flex items-center gap-3 p-4 border border-sand/40" style={{ background: "rgba(237,232,223,0.4)" }}>
                    <div className="flex-1">
                      <div className="font-body text-xs tracking-[0.25em] uppercase text-greige mb-0.5">From</div>
                      <div className="font-body text-base text-charcoal-deep font-medium">{result.fromPort.name}</div>
                      <div className="font-body text-xs text-maritime-error mt-0.5">
                        {result.fromPort.congestionPct}% congested · {result.fromPort.avgWaitHours}h wait
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gold-muted flex-shrink-0" />
                    <div className="flex-1 text-right">
                      <div className="font-body text-xs tracking-[0.25em] uppercase text-greige mb-0.5">To</div>
                      <div className="font-body text-base text-charcoal-deep font-medium">{result.toPort.name}</div>
                      <div className="font-body text-xs text-maritime-success mt-0.5">
                        {result.toPort.congestionPct}% congested · {result.toPort.avgWaitHours}h wait
                      </div>
                    </div>
                  </div>

                  {/* Confidence + savings */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 border border-sand/30">
                      <div className="font-body text-xs tracking-[0.25em] uppercase text-greige mb-1">Confidence</div>
                      <div className="text-stat-sm text-charcoal-deep" style={{ fontSize: "1.5rem" }}>
                        {result.confidence}%
                      </div>
                    </div>
                    <div className="p-3 border border-sand/30">
                      <div className="font-body text-xs tracking-[0.25em] uppercase text-greige mb-1">Wait reduction</div>
                      <div className="text-stat-sm text-charcoal-deep" style={{ fontSize: "1.5rem" }}>
                        {result.hoursSaved.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-sand/30 flex items-center justify-between" style={{ background: "rgba(237,232,223,0.3)" }}>
              <span className="font-body text-xs text-stone">Rule-based routing · MVP preview</span>
              <button
                onClick={close}
                className="font-body text-xs tracking-[0.05em] uppercase px-4 py-2 border border-sand/60 text-charcoal-warm hover:bg-parchment transition-colors"
                style={{ fontWeight: 500 }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
