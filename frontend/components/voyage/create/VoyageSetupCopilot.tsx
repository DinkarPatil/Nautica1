"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "../primitives";
import { voyageApiLive } from "@/lib/voyage/voyageApiClient";
import type { CopilotResult, CopilotSuggestion } from "@/types/voyage";
import type { VoyageDraft } from "./types";

/**
 * Voyage Setup Copilot — sits beside the form and proactively suggests fields
 * the operator hasn't filled in yet. Auto-runs (debounced) whenever the draft
 * changes, so the operator never has to ask. Click to apply.
 */
export function VoyageSetupCopilot({
  draft,
  onApply,
  className,
}: {
  draft: VoyageDraft;
  onApply: (field: string, value: string) => void;
  className?: string;
}) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; result: CopilotResult }
    | { kind: "error" }
  >({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't run until the operator has at least a ship name + ports — saves
    // wasted Vertex calls on empty forms.
    if (!draft.shipName || (!draft.origin && !draft.destination)) {
      setState({ kind: "idle" });
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setState((s) => (s.kind === "ok" ? s : { kind: "loading" }));
    timer.current = setTimeout(async () => {
      try {
        const result = await voyageApiLive.copilot({
          shipName: draft.shipName,
          imo: draft.imo || undefined,
          voyageType: draft.voyageType,
          origin: draft.origin,
          destination: draft.destination,
          plannedDeparture: draft.plannedDeparture,
          plannedArrival: draft.plannedArrival || undefined,
          sensitivity: draft.sensitivity,
          trackingMode: draft.trackingMode,
          alertPreference: draft.alertPreference,
          cargoPriority: draft.cargoPriority || undefined,
          delayToleranceMin: draft.delayToleranceMin || undefined,
          preferredRoute: draft.preferredRoute || undefined,
          watchlistCompany: draft.watchlistCompany || undefined,
          notes: draft.notes || undefined,
        });
        setState({ kind: "ok", result });
      } catch {
        setState({ kind: "error" });
      }
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft]);

  const result = state.kind === "ok" ? state.result : null;
  const suggestions: CopilotSuggestion[] = result?.suggestions ?? [];
  const nextQuestion = result?.nextQuestion?.trim();

  return (
    <aside
      data-testid="voyage-copilot"
      className={cn(
        "rounded-xl bg-gradient-to-b from-voyage-elevated to-voyage-bg border border-voyage-border p-6 relative overflow-hidden",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-voyage-accent-line to-transparent"
      />
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-voyage-accent" />
        <p className="vg-label">Setup Copilot</p>
        <span className="ml-auto vg-label">
          {state.kind === "loading" ? "thinking…" : state.kind === "ok" ? "ready" : "—"}
        </span>
      </div>

      {nextQuestion && (
        <p className="text-[13px] text-voyage-text mb-4 leading-relaxed">
          <span className="text-voyage-accent">Next:</span> {nextQuestion}
        </p>
      )}

      {suggestions.length === 0 && state.kind === "ok" && (
        <p className="text-[12px] text-voyage-text-3">
          The draft looks complete. Hit start when ready.
        </p>
      )}

      {suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((s) => (
            <li
              key={`${s.field}-${s.suggestedValue}`}
              data-testid={`copilot-suggestion-${s.field}`}
              className="rounded-md border border-voyage-border-2 bg-voyage-bg px-3 py-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="vg-label">{s.field}</span>
                <span className="text-[12px] text-voyage-text font-medium ml-auto">
                  {s.suggestedValue}
                </span>
              </div>
              <p className="text-[12px] text-voyage-text-3 mb-2">{s.reason}</p>
              <button
                type="button"
                onClick={() => onApply(s.field, s.suggestedValue)}
                className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-voyage-accent hover:text-voyage-text"
              >
                Apply <ArrowRight className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {state.kind === "idle" && (
        <p className="text-[12px] text-voyage-text-3">
          Add ship name and at least one port — I'll suggest the rest.
        </p>
      )}
      {state.kind === "error" && (
        <p className="text-[12px] text-voyage-bad">Copilot unavailable just now.</p>
      )}
    </aside>
  );
}
