"use client";

import { Anchor, AlertTriangle, Activity, Sparkles } from "lucide-react";
import type { Severity, VoyageStoryline } from "@/types/voyage";
import { cn } from "../primitives/cn";

/**
 * Voyage Storyline View — chronological narrative of the journey.
 *
 * No filters, no toggles. Reads top-to-bottom, oldest to newest. Each chapter
 * is one moment of the voyage with severity colour coding.
 */
export function VoyageStorylineCard({
  storyline,
  className,
}: {
  storyline: VoyageStoryline;
  className?: string;
}) {
  const chapters = storyline.chapters ?? [];

  return (
    <article className={cn("vg-card p-6", className)} data-testid="voyage-storyline">
      <header className="flex items-center gap-2 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-voyage-accent" />
        <p className="vg-label">Voyage Storyline</p>
        <span className="ml-auto vg-label">
          {chapters.length === 0 ? "—" : `${chapters.length} moments`}
        </span>
      </header>

      {chapters.length === 0 ? (
        <p className="text-[12px] text-voyage-text-3">
          The narrative will appear once tracking has produced enough telemetry.
        </p>
      ) : (
        <ol className="relative pl-7">
          <span aria-hidden className="absolute left-2 top-1 bottom-1 w-px bg-voyage-border-2" />
          {chapters.map((c) => {
            const Icon = iconFor(c.severity);
            const tone =
              c.severity === "danger"
                ? "text-voyage-bad"
                : c.severity === "warning"
                ? "text-voyage-warn"
                : "text-voyage-text-2";
            return (
              <li
                key={`${c.ts}-${c.label}`}
                data-testid="voyage-storyline-chapter"
                className="relative pb-5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-7 top-0 mt-0.5 w-4 h-4 rounded-full border bg-voyage-bg flex items-center justify-center",
                    tone,
                    "border-current",
                  )}
                >
                  <Icon className="w-2.5 h-2.5" />
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="vg-label">{new Date(c.ts).toLocaleString()}</span>
                  <span className={cn("text-[13px] font-medium", tone)}>{c.label}</span>
                  {c.sourceRef && (
                    <span className="vg-label text-voyage-text-3">ref {c.sourceRef}</span>
                  )}
                </div>
                <p className="text-[12px] text-voyage-text-2 leading-relaxed mt-1">{c.narration}</p>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-[10px] text-voyage-text-3 mt-2">
        Generated {new Date(storyline.generatedAt).toLocaleString()}
      </p>
    </article>
  );
}

function iconFor(severity: Severity) {
  if (severity === "danger") return AlertTriangle;
  if (severity === "warning") return Activity;
  return Anchor;
}
