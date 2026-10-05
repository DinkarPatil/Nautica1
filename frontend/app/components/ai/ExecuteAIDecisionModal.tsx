"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useSimulation } from "../../context/SimulationContext";
import { useToast } from "../../context/ToastContext";

export interface AIDecisionPayload {
  title?: string;
  body: string;
  estDelayReductionHrs?: number;
  fuelSavingsUsd?: number;
  affectedVessels?: number;
  confidence: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  decision: AIDecisionPayload;
  /** Where to send the user after Apply. Defaults to "/dashboard" unless
   *  they're already there. Pass null to disable redirect. */
  redirectTo?: string | null;
}

const formatUsd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;

export default function ExecuteAIDecisionModal({ open, onClose, decision, redirectTo }: Props) {
  const { apply, active } = useSimulation();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleApply = () => {
    apply();
    toast({
      variant: "success",
      title: "AI Optimization Applied Successfully",
      message: "Maritime KPIs updated · Network rebalanced.",
    });
    onClose();

    // Default: send users back to /dashboard where the optimized KPIs
    // animate in. Skip if already there or if caller opts out.
    const target = redirectTo === undefined ? "/dashboard" : redirectTo;
    if (target && pathname !== target) {
      // Small delay so the toast paints before the route transition.
      setTimeout(() => router.push(target), 250);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: "rgba(26, 24, 22, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-sand/50 w-full max-w-[540px] shadow-2xl"
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
              AI Decision Execution
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-parchment rounded-sm transition-colors">
            <X size={14} className="text-stone" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-7">
          {decision.title && (
            <div className="font-body text-xs tracking-[0.1em] uppercase text-greige mb-2" style={{ fontWeight: 400 }}>
              {decision.title}
            </div>
          )}
          <p className="font-body text-charcoal-deep text-base leading-relaxed mb-5">
            {decision.body}
          </p>

          {/* Metric strip */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {decision.estDelayReductionHrs !== undefined && (
              <div className="p-3 border border-sand/30">
                <div className="font-body text-xs tracking-[0.1em] uppercase text-greige mb-1" style={{ fontWeight: 400 }}>Delay reduction</div>
                <div className="text-stat-sm text-charcoal-deep" style={{ fontSize: "1.5rem" }}>
                  {decision.estDelayReductionHrs}h
                </div>
              </div>
            )}
            {decision.fuelSavingsUsd !== undefined && (
              <div className="p-3 border border-sand/30">
                <div className="font-body text-xs tracking-[0.1em] uppercase text-greige mb-1" style={{ fontWeight: 400 }}>Fuel savings</div>
                <div className="text-stat-sm text-charcoal-deep" style={{ fontSize: "1.5rem" }}>
                  {formatUsd(decision.fuelSavingsUsd)}
                </div>
              </div>
            )}
            <div className="p-3 border border-sand/30" style={{ background: "rgba(184,155,74,0.05)" }}>
              <div className="font-body text-xs tracking-[0.1em] uppercase text-gold-deep mb-1" style={{ fontWeight: 400 }}>Confidence</div>
              <div className="text-stat-sm text-gold-deep" style={{ fontSize: "1.5rem" }}>
                {decision.confidence}%
              </div>
            </div>
          </div>

          {active && (
            <div
              className="flex items-center gap-2 px-3 py-2 mb-2 border-l-2"
              style={{ background: "rgba(184,155,74,0.06)", borderLeftColor: "#C9A962" }}
            >
              <Sparkles size={12} className="text-gold-muted" />
              <span className="font-body text-xs text-charcoal-warm">
                A previous AI optimization is already active. Applying again will recompute against the optimized baseline.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-sand/30 flex items-center justify-between gap-3" style={{ background: "rgba(237,232,223,0.3)" }}>
          <span className="font-body text-xs text-stone">Rule-based simulation · MVP preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="font-body text-xs tracking-[0.05em] uppercase px-4 py-2 border border-sand/60 text-stone hover:bg-parchment transition-colors"
              style={{ fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.05em] uppercase px-4 py-2 transition-colors"
              style={{
                color: "#9A7F35",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(184,155,74,0.55)",
                background: "rgba(184,155,74,0.06)",
                fontWeight: 500,
              }}
            >
              Apply simulation
              <ArrowRight size={12} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
