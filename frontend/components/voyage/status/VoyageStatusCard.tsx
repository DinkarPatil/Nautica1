"use client";

import { MetricCell, Pill, ProgressRing, cn } from "../primitives";
import { fmtDelta, fmtETA, toneFromDelta } from "@/lib/voyage/format";
import { PhaseIndicator } from "./PhaseIndicator";
import type { Voyage, VoyageLiveSnapshot, VoyageStatus } from "@/types/voyage";

const STATUS_LABEL: Record<VoyageStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  active: "Active",
  in_transit: "In Transit",
  approaching_destination: "Approaching",
  delayed: "Delayed",
  completed: "Completed",
  archived: "Archived",
  // Legacy values still mapped for backward-compatibility:
  created: "Created",
  departed: "Departed",
  approaching: "Approaching",
  docked: "Docked",
  aborted: "Aborted",
};

export function VoyageStatusCard({
  voyage,
  live,
  className,
}: {
  voyage: Voyage;
  live: VoyageLiveSnapshot;
  className?: string;
}) {
  const days = Math.floor(live.distanceTotalNm / (live.sog * 24)) || 7;
  const dayOf = Math.max(1, Math.round((days * live.progressPct) / 100));

  return (
    <article className={cn("vg-card p-6", className)}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="vg-label">Voyage Status</p>
          <div className="flex items-center gap-2 mt-2">
            <Pill tone="accent">{STATUS_LABEL[voyage.status]}</Pill>
            <span className="text-voyage-text-3 text-[12px]">
              Day {dayOf} of {days}
            </span>
          </div>
        </div>
        <ProgressRing value={live.progressPct} />
      </div>

      <div className="mb-5">
        <PhaseIndicator phase={live.phase} />
      </div>

      <div className="grid grid-cols-3 gap-px bg-voyage-border-2 rounded-lg overflow-hidden">
        <MetricCell label="ETA" value={fmtETA(live.currentETA)} sub={`UTC · ${voyage.destination.name}`} />
        <MetricCell
          label="ETA Δ"
          value={fmtDelta(live.etaDeltaMin)}
          sub="vs. plan"
          tone={toneFromDelta(live.etaDeltaMin)}
        />
        <MetricCell
          label="Distance"
          value={`${live.distanceRemainingNm.toLocaleString()} nm`}
          sub={`of ${live.distanceTotalNm.toLocaleString()}`}
        />
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-[11px] text-voyage-text-3 mb-1.5">
          <span>{voyage.origin.name}</span>
          <span className="vg-num text-voyage-text-2">{Math.round(live.progressPct)}%</span>
          <span>{voyage.destination.name}</span>
        </div>
        <div className="h-[3px] rounded-full bg-voyage-border-2 overflow-hidden">
          <div
            className="h-full bg-voyage-accent rounded-full transition-[width] duration-500"
            style={{ width: `${live.progressPct}%` }}
          />
        </div>
      </div>
    </article>
  );
}
