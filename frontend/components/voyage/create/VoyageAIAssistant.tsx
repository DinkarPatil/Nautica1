"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "../primitives";
import { voyageApi } from "@/lib/voyage/voyageApi";
import type { VoyageDraft } from "./types";

const TRACK_LIST = [
  "Live ETA",
  "Route deviation",
  "Weather risk",
  "Port congestion",
  "Speed anomalies",
  "Final voyage report",
];

export function VoyageAIAssistant({
  draft,
  className,
}: {
  draft: VoyageDraft;
  className?: string;
}) {
  const [imoState, setImoState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "matched"; ship: { name: string; type: string; flag: string } }
    | { kind: "missing" }
  >({ kind: "idle" });

  useEffect(() => {
    if (!/^\d{6,}$/.test(draft.imo.trim())) {
      setImoState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setImoState({ kind: "loading" });
    voyageApi.lookupShip(draft.imo.trim()).then((r) => {
      if (cancelled) return;
      setImoState(r.matched && r.ship ? { kind: "matched", ship: r.ship } : { kind: "missing" });
    });
    return () => {
      cancelled = true;
    };
  }, [draft.imo]);

  const suggestions: string[] = [];
  if (!draft.cargoPriority)
    suggestions.push("Add cargo priority so we can weight delay alerts correctly.");
  if (!draft.delayToleranceMin)
    suggestions.push("Set delay tolerance to skip noise from minor ETA shifts.");
  if (draft.sensitivity === "Normal")
    suggestions.push("Mark monitoring sensitivity = Strict for time-critical voyages.");

  return (
    <aside
      className={cn(
        "rounded-xl bg-gradient-to-b from-voyage-elevated to-voyage-bg border border-voyage-border p-6 relative overflow-hidden",
        className
      )}
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-voyage-accent-line to-transparent"
      />

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-voyage-accent" />
        <p className="vg-label">Voyage AI</p>
      </div>

      <p className="text-[13px] text-voyage-text-2 mb-2">
        Once you start, I will track:
      </p>
      <ul className="space-y-1.5">
        {TRACK_LIST.map((t) => (
          <li key={t} className="flex items-center gap-2 text-[13px] text-voyage-text">
            <span aria-hidden className="w-1 h-1 rounded-full bg-voyage-accent" />
            {t}
          </li>
        ))}
      </ul>

      {imoState.kind !== "idle" && (
        <div className="mt-5 pt-5 border-t border-voyage-border-2">
          <p className="vg-label mb-2">Validation</p>
          {imoState.kind === "loading" && (
            <p className="text-[12px] text-voyage-text-3">Looking up IMO…</p>
          )}
          {imoState.kind === "matched" && (
            <p className="text-[12px] text-voyage-text-2">
              <span className="text-voyage-ok">✓</span> IMO {draft.imo} —{" "}
              <span className="text-voyage-text">{imoState.ship.name}</span>
              <span className="text-voyage-text-3"> · {imoState.ship.flag} flag · {imoState.ship.type}</span>
            </p>
          )}
          {imoState.kind === "missing" && (
            <p className="text-[12px] text-voyage-text-2">
              <span className="text-voyage-warn">!</span> IMO not found in registry. Verify the last 4 digits, or continue without — we will track by name.
            </p>
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-5 pt-5 border-t border-voyage-border-2">
          <p className="vg-label mb-3">Suggestions</p>
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s} className="flex gap-2 text-[12px] text-voyage-text-2">
                <span aria-hidden className="text-voyage-accent">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
