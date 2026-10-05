"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { agiDecisions } from "../data/agi-decisions";
import ProtectedPage from "../components/auth/ProtectedPage";
import RoleGate from "../components/auth/RoleGate";
import { AGICategory, AGIDecision } from "../types";
import { Brain, ChevronDown, ChevronUp, CheckCircle, Zap, Sparkles, ArrowRight } from "lucide-react";
import ExecuteAIDecisionModal, { AIDecisionPayload } from "../components/ai/ExecuteAIDecisionModal";

const categoryConfig: Record<AGICategory, { color: string; bg: string; border: string; dot: string }> = {
  "Risk Warning": { color: "#8B5252", bg: "rgba(139,82,82,0.08)", border: "rgba(139,82,82,0.25)", dot: "#8B5252" },
  "Route Optimization": { color: "#B89B4A", bg: "rgba(184,155,74,0.08)", border: "rgba(184,155,74,0.25)", dot: "#B89B4A" },
  "Trade Opportunity": { color: "#4A6347", bg: "rgba(74,99,71,0.08)", border: "rgba(74,99,71,0.25)", dot: "#4A6347" },
  "Port Advisory": { color: "#4A5568", bg: "rgba(74,85,104,0.08)", border: "rgba(74,85,104,0.25)", dot: "#4A5568" },
  "Weather Alert": { color: "#A68B3D", bg: "rgba(166,139,61,0.08)", border: "rgba(166,139,61,0.25)", dot: "#A68B3D" },
  "Sanctions Intelligence": { color: "#8B5252", bg: "rgba(139,82,82,0.08)", border: "rgba(139,82,82,0.25)", dot: "#8B5252" },
};

const priorityConfig = {
  critical: { color: "#8B5252", label: "Critical Priority" },
  high: { color: "#A68B3D", label: "High Priority" },
  medium: { color: "#B89B4A", label: "Medium Priority" },
  low: { color: "#9A8F82", label: "Low Priority" },
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? "#4A6347" : value >= 75 ? "#B89B4A" : value >= 60 ? "#A68B3D" : "#8B5252";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-[5px] bg-parchment rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="font-body font-num text-sm w-10 text-right" style={{ fontWeight: 600, color }}>
        {value}%
      </span>
    </div>
  );
}

function AGICard({ decision }: { decision: AGIDecision }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = categoryConfig[decision.category];
  const priCfg = priorityConfig[decision.priority];

  return (
    <div
      className="group bg-white transition-all duration-200 hover:-translate-y-px"
      style={{
        borderLeft: `2px solid ${cfg.dot}`,
        borderTop: "1px solid rgba(212,203,191,0.35)",
        borderRight: "1px solid rgba(212,203,191,0.35)",
        borderBottom: "1px solid rgba(212,203,191,0.35)",
        boxShadow: "0 1px 2px rgba(26,24,22,0.025), 0 1px 3px rgba(26,24,22,0.025)",
      }}
    >
      <div className="px-8 py-7 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 min-w-0">
            {/* Tag row — uniform weight 500, dotted priority + actioned */}
            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 font-body text-[11px] tracking-[0.08em] uppercase"
                style={{ color: cfg.color, fontWeight: 500 }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                {decision.category}
              </span>
              <span className="text-sand/70">·</span>
              <span
                className="font-body text-[11px] tracking-[0.08em] uppercase"
                style={{ color: priCfg.color, fontWeight: 500 }}
              >
                {priCfg.label}
              </span>
              {decision.isActioned && (
                <>
                  <span className="text-sand/70">·</span>
                  <span className="flex items-center gap-1 font-body text-[11px] tracking-[0.08em] uppercase text-maritime-success" style={{ fontWeight: 500 }}>
                    <CheckCircle size={10} strokeWidth={1.6} />
                    Actioned
                  </span>
                </>
              )}
            </div>

            {/* Title — serif, medium, generous line-height; sits below page H1 */}
            <h3
              className="font-display text-charcoal-deep mb-3"
              style={{ fontSize: "17px", fontWeight: 500, lineHeight: 1.5, letterSpacing: 0 }}
            >
              {decision.title}
            </h3>

            {/* Summary — slightly lighter than title for layered hierarchy */}
            <p
              className="font-body text-sm leading-[1.65] mb-7 max-w-3xl"
              style={{ color: "#5A554D", fontWeight: 400 }}
            >
              {decision.summary}
            </p>

            {/* Confidence — visible but supporting */}
            <div className="max-w-[280px]">
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className="font-body text-[11px] tracking-[0.08em] uppercase"
                  style={{ color: "#7A7068", fontWeight: 500 }}
                >
                  Confidence
                </span>
              </div>
              <ConfidenceBar value={decision.confidence} />
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-5 flex-shrink-0">
            {/* Timestamp */}
            <div className="text-right">
              <div className="font-body font-num text-xs text-charcoal-warm" style={{ fontWeight: 500 }}>
                {new Date(decision.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </div>
              <div className="font-body font-num text-[11px] text-greige mt-1" style={{ fontWeight: 400 }}>
                {new Date(decision.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
              </div>
            </div>

            {/* Saving */}
            {decision.estimatedSaving && (
              <div className="text-right max-w-[200px]">
                <div className="font-body text-[10px] tracking-[0.08em] uppercase text-greige mb-1.5" style={{ fontWeight: 500 }}>
                  Est. impact
                </div>
                <div className="font-body text-xs text-maritime-success leading-snug" style={{ fontWeight: 500 }}>
                  {decision.estimatedSaving}
                </div>
              </div>
            )}

            {/* Expand toggle */}
            <button
              className="flex items-center gap-1 font-body text-xs tracking-[0.04em] text-gold-muted hover:text-gold-deep transition-colors duration-150"
              style={{ fontWeight: 500 }}
            >
              {expanded ? "Less" : "Reasoning"}
              {expanded ? <ChevronUp size={12} strokeWidth={1.6} /> : <ChevronDown size={12} strokeWidth={1.6} />}
            </button>
          </div>
        </div>

        {/* Affected assets — lightest tier, bottom of hierarchy */}
        {(decision.affectedVessels?.length || decision.affectedPorts?.length) && (
          <div className="flex items-center gap-3 mt-7 pt-5 border-t border-sand/30 flex-wrap">
            <span className="font-body text-[10px] tracking-[0.1em] uppercase text-greige" style={{ fontWeight: 500 }}>Affects</span>
            {decision.affectedVessels?.length && (
              <span className="font-body text-xs text-stone" style={{ fontWeight: 400 }}>
                {decision.affectedVessels.length} vessel{decision.affectedVessels.length > 1 ? "s" : ""}
              </span>
            )}
            {decision.affectedVessels?.length && decision.affectedPorts?.length && (
              <span className="text-sand/70">·</span>
            )}
            {decision.affectedPorts?.length && (
              <span className="font-body text-xs text-stone" style={{ fontWeight: 400 }}>
                {decision.affectedPorts.length} port{decision.affectedPorts.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded reasoning */}
      {expanded && (
        <div className="px-8 pb-7 pt-0">
          <div className="border-t border-sand/30 pt-5 px-5 pb-5" style={{ background: cfg.bg }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={12} strokeWidth={1.6} style={{ color: cfg.color }} />
              <span className="font-body text-[11px] tracking-[0.08em] uppercase" style={{ color: cfg.color, fontWeight: 500 }}>
                AGI reasoning — Full analysis
              </span>
            </div>
            <p className="font-body text-sm leading-[1.65]" style={{ color: "#5A554D", fontWeight: 400 }}>
              {decision.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const categories: (AGICategory | "All")[] = [
  "All",
  "Risk Warning",
  "Route Optimization",
  "Trade Opportunity",
  "Port Advisory",
  "Weather Alert",
  "Sanctions Intelligence",
];

// Highest-priority featured decision = critical first, then highest confidence,
// then most recent. Cross-page entry points scroll the user to this card.
const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;
function pickFeatured(list: AGIDecision[]): AGIDecision | undefined {
  return [...list].sort((a, b) => {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  })[0];
}

function FeaturedDecisionCard({ decision, focused }: { decision: AGIDecision; focused: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cfg = categoryConfig[decision.category];

  // When linked with ?focus=top, gently scroll into view.
  useEffect(() => {
    if (focused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focused]);

  const payload: AIDecisionPayload = {
    title: decision.category,
    body: decision.summary,
    estDelayReductionHrs: 18,
    fuelSavingsUsd: 240_000,
    affectedVessels: decision.affectedVessels?.length ?? 7,
    confidence: decision.confidence,
  };

  return (
    <>
      <div
        ref={cardRef}
        className="card-soft px-8 py-7 mb-5 relative"
        style={{
          borderLeft: `2px solid ${cfg.dot}`,
          background: focused ? "rgba(184,155,74,0.04)" : "white",
          boxShadow: focused
            ? "0 0 0 1px rgba(184,155,74,0.35), 0 1px 2px rgba(26,24,22,0.025), 0 1px 3px rgba(26,24,22,0.025)"
            : undefined,
        }}
      >
        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-body text-[11px] tracking-[0.08em] uppercase" style={{ color: "#9A7F35", fontWeight: 500 }}>
                <Sparkles size={11} strokeWidth={1.6} />
                Top recommendation
              </span>
              <span className="text-sand/70">·</span>
              <span className="inline-flex items-center gap-1.5 font-body text-[11px] tracking-[0.08em] uppercase" style={{ color: cfg.color, fontWeight: 500 }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                {decision.category}
              </span>
              <span className="text-sand/70">·</span>
              <span className="font-body font-num text-[11px] tracking-[0.08em] uppercase" style={{ color: "#9A7F35", fontWeight: 500 }}>
                {decision.confidence}% confidence
              </span>
            </div>

            <h3
              className="font-display text-charcoal-deep mb-3"
              style={{ fontSize: "20px", fontWeight: 500, lineHeight: 1.4 }}
            >
              {decision.title}
            </h3>

            <p className="font-body text-sm leading-[1.65] max-w-3xl mb-5" style={{ color: "#5A554D", fontWeight: 400 }}>
              {decision.summary}
            </p>

            <button
              onClick={() => setModalOpen(true)}
              className="btn-base btn-subtle"
            >
              <Sparkles size={12} strokeWidth={1.6} />
              Execute recommendation
              <ArrowRight size={12} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>

      <ExecuteAIDecisionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        decision={payload}
      />
    </>
  );
}

function AGIContent() {
  const searchParams = useSearchParams();
  const focusFlag = searchParams.get("focus") === "top";

  const [categoryFilter, setCategoryFilter] = useState<AGICategory | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const featured = useMemo(() => pickFeatured(agiDecisions), []);

  const filtered = agiDecisions.filter((d) => {
    if (featured && d.id === featured.id) return false; // already shown above
    if (categoryFilter !== "All" && d.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && d.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    critical: agiDecisions.filter((d) => d.priority === "critical").length,
    actioned: agiDecisions.filter((d) => d.isActioned).length,
    avgConfidence: Math.round(agiDecisions.reduce((s, d) => s + d.confidence, 0) / agiDecisions.length),
    totalSavings: agiDecisions.filter((d) => d.estimatedSaving).length,
  };

  return (
    <div className="min-h-full" style={{ background: "#FAF8F5" }}>
      {/* Header */}
      <div className="px-8 lg:px-12 pt-10 pb-8 border-b border-sand/30">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-label-sm text-greige mb-3">Intelligence</div>
            <h1 className="text-h1 text-charcoal-deep">
              AGI Decision Engine
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-12 h-px bg-gold-muted opacity-60" />
              <span className="font-body text-sm text-greige">
                {agiDecisions.length} decisions · {stats.actioned} actioned · {stats.avgConfidence}% avg confidence
              </span>
            </div>
          </div>

          {/* AGI Status indicator */}
          <div className="text-right" style={{ background: "#2C3E50" }} >
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 justify-end mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-maritime-success animate-pulse" />
                <span className="font-body text-[11px] tracking-[0.08em] uppercase text-ivory-cream/60" style={{ fontWeight: 400 }}>Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-gold-soft" strokeWidth={1.6} />
                <span className="text-h2 text-ivory-cream">
                  AGI Online
                </span>
              </div>
              <div className="font-body text-xs text-sapphire-mist mt-1" style={{ fontWeight: 400 }}>
                claude-sonnet-4-6 · Maritime domain
              </div>
              <RoleGate anyPermission={["RUN_AGI", "VIEW_ALL"]}>
                <button className="mt-3 flex items-center gap-2 border border-white/20 px-4 py-2 text-ivory-cream/70 hover:border-gold-muted hover:text-gold-soft transition-colors duration-200 ml-auto">
                  <Zap size={11} strokeWidth={1.6} />
                  <span className="font-body text-xs tracking-[0.04em] uppercase" style={{ fontWeight: 500 }}>Run analysis</span>
                </button>
              </RoleGate>
            </div>
          </div>
        </div>
      </div>

      {/* Stats — calmer weight, softer color, breathing room */}
      <div className="px-8 lg:px-12 pt-7 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total decisions", value: agiDecisions.length, color: "#4A5568" },
            { label: "Critical priority", value: stats.critical, color: "#8B5252" },
            { label: "Actioned", value: stats.actioned, color: "#4A6347" },
            { label: "Avg confidence", value: `${stats.avgConfidence}%`, color: "#B89B4A" },
          ].map((s) => (
            <div key={s.label} className="card-soft px-6 py-5">
              <div
                className="font-body font-num mb-2.5"
                style={{ fontWeight: 500, fontSize: "26px", lineHeight: 1.1, letterSpacing: "-0.015em", color: s.color, opacity: 0.92 }}
              >
                {s.value}
              </div>
              <div className="font-body text-[11px] tracking-[0.08em] uppercase text-greige" style={{ fontWeight: 400 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters — text tabs + inline pill priorities */}
      <div className="px-8 lg:px-12 pb-6">
        {/* Category — text-tab navigation. All tabs identical weight/tone;
            active state = stronger color + 2px accent underline. */}
        <div
          className="flex items-center flex-wrap border-b border-sand/40 overflow-x-auto"
          role="tablist"
          aria-label="Decision categories"
        >
          {categories.map((c) => {
            const isActive = categoryFilter === c;
            const cfg = c !== "All" ? categoryConfig[c] : null;
            const accent = isActive && cfg ? cfg.color : isActive ? "#2D2A26" : "transparent";
            return (
              <button
                key={c}
                role="tab"
                aria-selected={isActive}
                onClick={() => setCategoryFilter(c)}
                className="relative font-body text-sm px-4 py-3 transition-colors duration-150 whitespace-nowrap"
                style={{
                  fontWeight: 500,
                  color: isActive ? "#1A1816" : "#9A8F82",
                  borderBottom: "2px solid",
                  borderBottomColor: accent,
                  marginBottom: "-1px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#4A453D";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#9A8F82";
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Priority — inline pill row with separators */}
        <div className="flex items-center gap-1 mt-5 flex-wrap">
          <span className="font-body text-[11px] tracking-[0.1em] uppercase text-greige mr-3" style={{ fontWeight: 500 }}>
            Priority
          </span>
          {["all", "critical", "high", "medium", "low"].map((p, idx) => {
            const isActive = priorityFilter === p;
            const dotColor =
              p === "critical" ? "#8B5252" :
              p === "high"     ? "#A68B3D" :
              p === "medium"   ? "#B89B4A" :
              p === "low"      ? "#9A8F82" : null;
            return (
              <span key={p} className="inline-flex items-center">
                {idx > 0 && <span className="text-sand/70 px-1.5">·</span>}
                <button
                  onClick={() => setPriorityFilter(p)}
                  className="inline-flex items-center gap-1.5 font-body text-xs px-1.5 py-0.5 transition-colors duration-150"
                  style={{
                    fontWeight: 500,
                    color: isActive ? "#1A1816" : "#9A8F82",
                    textTransform: "capitalize",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#4A453D"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#9A8F82"; }}
                >
                  {dotColor && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor, opacity: isActive ? 1 : 0.45 }} />
                  )}
                  {p}
                </button>
              </span>
            );
          })}
          <span className="ml-auto font-body font-num text-xs text-stone" style={{ fontWeight: 500 }}>
            {filtered.length} {filtered.length === 1 ? "decision" : "decisions"}
          </span>
        </div>
      </div>

      {/* Featured + decision list */}
      <div className="px-8 lg:px-12 pb-12">
        {featured && categoryFilter === "All" && priorityFilter === "all" && (
          <FeaturedDecisionCard decision={featured} focused={focusFlag} />
        )}
        <div className="space-y-4">
          {filtered.map((decision) => (
            <AGICard key={decision.id} decision={decision} />
          ))}

          {filtered.length === 0 && !featured && (
            <div className="bg-white border border-sand/40 p-14 text-center">
              <Brain size={28} className="text-taupe mx-auto mb-4" strokeWidth={1.4} />
              <h3 className="text-h3 text-charcoal-deep mb-2">No decisions match this filter</h3>
              <p className="font-body text-sm text-greige" style={{ fontWeight: 400 }}>
                Try adjusting your category or priority filter
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AGIPage() {
  return (
    <ProtectedPage path="/agi">
      <AGIContent />
    </ProtectedPage>
  );
}
