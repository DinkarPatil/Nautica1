"use client";

import { useState } from "react";
import { cn, EmptyState } from "../primitives";
import type { Severity, VoyageEvent } from "@/types/voyage";

type Filter = "all" | "eta" | "weather" | "route";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "eta", label: "ETA" },
  { key: "weather", label: "Weather" },
  { key: "route", label: "Routing" },
];

const DOT_BY_SEVERITY: Record<Severity, string> = {
  info: "border-voyage-accent",
  warning: "border-voyage-warn",
  danger: "border-voyage-danger",
};

function shortTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

export function EventTimelineCard({
  events,
  className,
}: {
  events: VoyageEvent[];
  className?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "eta") return e.category === "eta";
    if (filter === "weather") return e.category === "weather";
    if (filter === "route") return e.category === "route" || e.category === "speed";
    return true;
  });

  return (
    <article className={cn("vg-card p-6", className)}>
      <div className="flex items-center justify-between mb-5">
        <p className="vg-label">Event Timeline</p>
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "h-6 px-2 rounded-md text-[11px] uppercase tracking-[0.08em] transition-colors duration-200",
                  active
                    ? "bg-white/[0.06] text-voyage-text"
                    : "text-voyage-text-3 hover:text-voyage-text"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No events yet" body="Events will appear as the voyage progresses." />
      ) : (
        <ol className="relative">
          <span aria-hidden className="absolute left-[7px] top-2 bottom-2 w-px bg-voyage-border-2" />
          {filtered.map((e) => (
            <li
              key={e.id}
              className="relative pl-7 py-3.5 border-b border-voyage-border-2 last:border-0"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-[18px] w-[15px] h-[15px] rounded-full border-2 bg-voyage-elevated",
                  DOT_BY_SEVERITY[e.severity]
                )}
              />
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[14px] text-voyage-text leading-snug">{e.title}</p>
                  {e.detail && (
                    <p className="text-[12px] text-voyage-text-3 mt-0.5 truncate">{e.detail}</p>
                  )}
                </div>
                <time className="text-[11px] text-voyage-text-3 vg-mono whitespace-nowrap">
                  {shortTime(e.ts)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
