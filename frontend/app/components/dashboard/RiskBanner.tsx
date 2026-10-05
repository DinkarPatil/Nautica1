"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { alerts } from "../../data/alerts";
import { computeRiskPulse } from "../../lib/aiCore";
import ExecuteAIDecisionModal, {
  AIDecisionPayload,
} from "../ai/ExecuteAIDecisionModal";

export default function RiskBanner() {
  const pulse = useMemo(() => computeRiskPulse(alerts), []);
  const [modalOpen, setModalOpen] = useState(false);

  if (!pulse.trigger) return null;

  const decision: AIDecisionPayload = {
    title: "Network-Wide Reroute Advisory",
    body: "AI recommends rerouting 7 vessels via Cape of Good Hope to bypass active threat corridors and congestion clusters.",
    estDelayReductionHrs: 18,
    fuelSavingsUsd: 240_000,
    affectedVessels: 7,
    confidence: 96,
  };

  return (
    <>
      <div
        className="flex items-center gap-4 px-6 py-3 border-l-2 flex-wrap"
        style={{
          background: "rgba(139, 82, 82, 0.06)",
          borderLeftColor: "#8B5252",
          borderTop: "1px solid rgba(139, 82, 82, 0.18)",
          borderRight: "1px solid rgba(139, 82, 82, 0.18)",
          borderBottom: "1px solid rgba(139, 82, 82, 0.18)",
        }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
              style={{ background: "#8B5252" }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#8B5252" }} />
          </span>
          <AlertTriangle size={14} className="text-maritime-error" strokeWidth={1.6} />
          <span className="font-body text-xs tracking-[0.1em] uppercase text-maritime-error" style={{ fontWeight: 500 }}>
            High risk detected · Maritime network
          </span>
        </div>

        <div className="hidden md:flex items-center gap-5 ml-2 text-stone">
          {pulse.criticalCount > 0 && (
            <span className="font-body text-xs">
              <span className="font-body font-num text-base text-maritime-error font-medium mr-1">{pulse.criticalCount}</span>
              critical
            </span>
          )}
          <span className="font-body text-xs">
            <span className="font-body font-num text-base text-charcoal-deep font-medium mr-1">{pulse.unreadCount}</span>
            unread
          </span>
          {pulse.topAlertTitle && (
            <span className="font-body text-xs text-charcoal-warm truncate max-w-[360px]">
              · {pulse.topAlertTitle}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {/* Primary path — inspect the AI's reasoning before acting */}
          <Link
            href="/agi?focus=top"
            className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.05em] uppercase px-3 py-1.5 border transition-colors"
            style={{
              borderColor: "rgba(184,155,74,0.45)",
              color: "#9A7F35",
              background: "rgba(184,155,74,0.04)",
              fontWeight: 500,
            }}
          >
            <Sparkles size={11} strokeWidth={1.6} />
            View AI decision
            <ArrowRight size={11} strokeWidth={1.6} />
          </Link>
          {/* Secondary — execute right here without leaving */}
          <button
            onClick={() => setModalOpen(true)}
            className="font-body text-xs tracking-[0.05em] uppercase px-3 py-1.5 text-stone hover:text-charcoal-warm transition-colors"
            style={{ fontWeight: 500 }}
          >
            Execute
          </button>
          <Link
            href="/risk"
            className="flex items-center gap-1.5 font-body text-xs tracking-[0.05em] uppercase text-maritime-error hover:underline"
            style={{ fontWeight: 500 }}
          >
            Review
            <ArrowUpRight size={12} strokeWidth={1.6} />
          </Link>
        </div>
      </div>

      <ExecuteAIDecisionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        decision={decision}
      />
    </>
  );
}
