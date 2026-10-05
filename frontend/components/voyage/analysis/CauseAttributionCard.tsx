"use client";

import { useState } from "react";
import { cn } from "../primitives";
import type { CauseAttribution, CauseKey } from "@/types/voyage";

export function CauseAttributionCard({
  attribution,
  onSelect,
  className,
}: {
  attribution: CauseAttribution;
  onSelect?: (k: CauseKey | null) => void;
  className?: string;
}) {
  const [selected, setSelected] = useState<CauseKey | null>(null);

  return (
    <article className={cn("vg-card p-6", className)}>
      <div className="flex items-center justify-between mb-5">
        <p className="vg-label">Cause Attribution</p>
        {selected && (
          <button
            type="button"
            className="text-[11px] text-voyage-text-3 hover:text-voyage-text"
            onClick={() => {
              setSelected(null);
              onSelect?.(null);
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1">
        {attribution.factors.map((f) => {
          const active = selected === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                const next = active ? null : f.key;
                setSelected(next);
                onSelect?.(next);
              }}
              className={cn(
                "w-full flex items-center gap-4 py-2.5 group rounded-md px-1 transition-colors duration-200",
                active && "bg-white/[0.03]"
              )}
            >
              <span
                className={cn(
                  "vg-label w-24 text-left transition-colors duration-200 capitalize",
                  active ? "text-voyage-text" : "group-hover:text-voyage-text-2"
                )}
              >
                {f.key}
              </span>
              <span className="flex-1 h-1.5 rounded-full bg-voyage-border-2 overflow-hidden">
                <span
                  className="block h-full bg-voyage-accent rounded-full transition-[width] duration-700"
                  style={{ width: `${f.weightPct}%` }}
                />
              </span>
              <span className="w-12 text-right vg-num text-[13px] text-voyage-text">
                {f.weightPct}%
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-voyage-border-2">
        {selected ? (
          <p className="text-[12px] text-voyage-text-2 leading-[1.55]">
            {attribution.factors.find((f) => f.key === selected)?.note ?? "—"}
          </p>
        ) : (
          <p className="text-[12px] text-voyage-text-3">Select a factor to filter the timeline.</p>
        )}
      </div>
    </article>
  );
}
