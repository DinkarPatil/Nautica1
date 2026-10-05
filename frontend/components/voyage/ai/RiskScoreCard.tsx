"use client";

import { cn, Pill, type PillTone } from "../primitives";
import type { AIBriefRiskFactor, RiskBand, VoyageLiveSnapshot } from "@/types/voyage";

const BAND_TONE: Record<RiskBand, PillTone> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

const BAND_LABEL: Record<RiskBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function RiskScoreCard({
  live,
  factors,
  delta = 0,
  className,
}: {
  live: VoyageLiveSnapshot;
  factors: AIBriefRiskFactor[];
  delta?: number;
  className?: string;
}) {
  // Synthetic 24-segment sparkbar based on score; real impl will use a window of past scores.
  const bars = Array.from({ length: 24 }).map((_, i) =>
    Math.min(100, Math.max(20, live.riskScore - 12 + Math.sin(i / 2) * 8 + i * 0.4))
  );

  return (
    <article className={cn("vg-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="vg-label">Risk Score</p>
        <span className="text-[11px] text-voyage-text-3">last 6h</span>
      </div>

      <div className="flex items-end gap-4">
        <span className="text-[44px] leading-none font-medium tracking-[-0.02em] vg-num text-voyage-text">
          {Math.round(live.riskScore)}
        </span>
        <div className="pb-1.5">
          <Pill tone={BAND_TONE[live.riskBand]}>{BAND_LABEL[live.riskBand]}</Pill>
          {delta !== 0 && (
            <p className="text-[11px] text-voyage-text-3 mt-1 vg-num">
              {delta > 0 ? "+" : "−"}
              {Math.abs(delta)} since 12:00
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-px h-9">
        {bars.map((v, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm bg-voyage-accent"
            style={{
              height: `${v}%`,
              opacity: i === bars.length - 1 ? 1 : 0.4 + i / 60,
            }}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {factors.map((f) => (
          <RiskFactor key={f.key} label={f.key} value={f.value} />
        ))}
      </div>
    </article>
  );
}

function RiskFactor({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="vg-label mb-1.5 capitalize tracking-[0.1em]">{label}</p>
      <p className="text-[14px] vg-num text-voyage-text">{value}</p>
      <div className="h-[2px] mt-1.5 bg-voyage-border-2 rounded-full overflow-hidden">
        <span className="block h-full bg-voyage-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
