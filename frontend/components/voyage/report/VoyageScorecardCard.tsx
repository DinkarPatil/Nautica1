"use client";

import { Award } from "lucide-react";
import type { VoyageScorecard } from "@/types/voyage";
import { cn } from "../primitives/cn";

const COMPONENT_LABEL: Record<string, string> = {
  punctuality: "Punctuality",
  routeAdherence: "Route adherence",
  operationalSmoothness: "Operational smoothness",
};

export function VoyageScorecardCard({
  scorecard,
}: {
  scorecard: VoyageScorecard;
}) {
  const gradeTone =
    scorecard.grade === "A" || scorecard.grade === "B"
      ? "text-voyage-ok"
      : scorecard.grade === "C"
      ? "text-voyage-warn"
      : "text-voyage-bad";

  return (
    <article
      data-testid="voyage-scorecard"
      className="rounded-md border border-voyage-border-2 bg-voyage-elevated p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <Award className={cn("w-5 h-5", gradeTone)} />
        <span className={cn("font-display text-3xl tabular-nums", gradeTone)}>
          {scorecard.grade}
        </span>
        <div className="ml-auto text-right">
          <div className="font-display text-2xl tabular-nums text-voyage-text">{scorecard.overall}</div>
          <div className="vg-label">Overall</div>
        </div>
      </div>

      <p className="text-[13px] text-voyage-text-2 leading-relaxed mb-4">{scorecard.summary}</p>

      <ul className="space-y-3" data-testid="voyage-scorecard-components">
        {scorecard.components.map((c) => {
          const tone =
            c.score >= 80
              ? "bg-voyage-ok"
              : c.score >= 60
              ? "bg-voyage-warn"
              : "bg-voyage-bad";
          return (
            <li key={c.name} data-testid={`scorecard-${c.name}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[13px] text-voyage-text">{COMPONENT_LABEL[c.name] ?? c.name}</span>
                <span className="ml-auto vg-num text-voyage-text">{c.score}</span>
              </div>
              <div className="h-1 rounded-full bg-voyage-bg overflow-hidden">
                <span
                  className={cn("block h-full", tone)}
                  style={{ width: `${Math.max(2, Math.min(100, c.score))}%` }}
                />
              </div>
              <p className="text-[12px] text-voyage-text-3 mt-1">{c.note}</p>
            </li>
          );
        })}
      </ul>

      <p className="text-[10px] text-voyage-text-3 mt-4">
        Generated {new Date(scorecard.generatedAt).toLocaleString()}
      </p>
    </article>
  );
}
