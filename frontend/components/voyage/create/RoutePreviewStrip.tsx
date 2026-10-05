"use client";

import { useMemo } from "react";
import { cn } from "../primitives";
import type { VoyageDraft } from "./types";

function haversineNm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 3440.065;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export function RoutePreviewStrip({
  draft,
  className,
}: {
  draft: VoyageDraft;
  className?: string;
}) {
  const ready = !!draft.origin && !!draft.destination;

  const distanceNm = useMemo(() => {
    if (!ready) return 0;
    return Math.round(haversineNm(draft.origin!, draft.destination!));
  }, [ready, draft.origin, draft.destination]);

  const durationLabel = useMemo(() => {
    if (!ready) return "—";
    const hours = distanceNm / 14; // assume 14 kn average
    const days = Math.floor(hours / 24);
    const h = Math.round(hours - days * 24);
    return `~${days}d ${h}h`;
  }, [ready, distanceNm]);

  const confidence = ready ? (draft.imo ? 4 : 3) : 0;

  return (
    <div
      className={cn(
        "rounded-xl bg-voyage-elevated border border-voyage-border-2 p-5 flex items-center gap-6",
        className
      )}
    >
      <div className="flex-1 h-16 rounded-md bg-voyage-sunken relative overflow-hidden">
        {ready ? (
          <RouteSpark origin={draft.origin!} destination={draft.destination!} />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[12px] text-voyage-text-3">
            Add origin and destination to preview
          </div>
        )}
      </div>
      <PreviewStat label="Distance" value={ready ? `${distanceNm.toLocaleString()} nm` : "—"} />
      <PreviewStat label="Duration" value={durationLabel} />
      <PreviewStat label="Confidence" value={<DotsConfidence value={confidence} />} />
    </div>
  );
}

function RouteSpark({
  origin,
  destination,
}: {
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
}) {
  const W = 600;
  const H = 64;
  const dx = destination.lon - origin.lon;
  const dy = destination.lat - origin.lat;
  const len = Math.max(Math.abs(dx), Math.abs(dy));
  const x1 = 20;
  const y1 = H / 2;
  const x2 = W - 20;
  const y2 = H / 2 - (dy / len) * 20;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#3B82F6"
        strokeWidth={1.5}
        strokeOpacity={0.6}
        strokeDasharray="4 4"
      />
      <circle cx={x1} cy={y1} r={4} fill="none" stroke="#A4ACBA" strokeWidth={1.5} />
      <circle cx={x2} cy={y2} r={5} fill="#3B82F6" />
    </svg>
  );
}

function PreviewStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-right pr-2">
      <p className="vg-label mb-1">{label}</p>
      <div className="text-[14px] vg-num text-voyage-text">{value}</div>
    </div>
  );
}

function DotsConfidence({ value, of = 5 }: { value: number; of?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: of }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            i < value ? "bg-voyage-accent" : "bg-voyage-border"
          )}
        />
      ))}
    </span>
  );
}
