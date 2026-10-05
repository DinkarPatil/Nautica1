"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, AlertCircle, Activity } from "lucide-react";
import { cn } from "../primitives";
import { voyageApiLive } from "@/lib/voyage/voyageApiClient";
import type { VoyageReadiness } from "@/types/voyage";
import type { VoyageDraft } from "./types";

/**
 * Voyage Readiness Score panel.
 *
 * Driven entirely by the backend's deterministic readiness service. The user
 * never has to interact with this — it auto-recomputes (debounced) every time
 * the draft changes. Frontend just displays.
 */
export function VoyageReadinessPanel({
  draft,
  className,
  onReadiness,
}: {
  draft: VoyageDraft;
  className?: string;
  onReadiness?: (r: VoyageReadiness) => void;
}) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; r: VoyageReadiness }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const payload = useMemo(() => buildPayload(draft), [draft]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setState((prev) => (prev.kind === "ok" ? prev : { kind: "loading" }));
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await voyageApiLive.readiness(payload);
        setState({ kind: "ok", r });
        onReadiness?.(r);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "readiness failed";
        setState({ kind: "error", message });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [payload, onReadiness]);

  const r = state.kind === "ok" ? state.r : null;
  const bandColor =
    r?.band === "green"
      ? "text-voyage-ok"
      : r?.band === "amber"
      ? "text-voyage-warn"
      : "text-voyage-bad";
  const Icon = r?.band === "green" ? ShieldCheck : r?.band === "amber" ? Activity : AlertCircle;

  return (
    <aside
      data-testid="voyage-readiness-panel"
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
        <Icon className={cn("w-3.5 h-3.5", bandColor)} />
        <p className="vg-label">Voyage Readiness</p>
        <span className="ml-auto vg-label">{state.kind === "loading" ? "computing…" : r?.band ?? "—"}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span
          data-testid="voyage-readiness-score"
          className={cn("font-display text-3xl tabular-nums", bandColor)}
          style={{ fontWeight: 400 }}
        >
          {r ? r.score : "—"}
        </span>
        <span className="text-[12px] text-voyage-text-3">/ 100</span>
      </div>
      <p className="text-[12px] text-voyage-text-3 mb-4">
        {r?.canStart
          ? "Setup is ready. Tracking can start."
          : "Setup incomplete — fill required fields to start tracking."}
      </p>

      {r && r.factors.length > 0 && (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {r.factors.map((f) => (
            <li
              key={f.field}
              className="flex items-start gap-2 text-[12px]"
              data-testid={`readiness-factor-${f.field}`}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                  f.status === "ok" && "bg-voyage-ok",
                  f.status === "warn" && "bg-voyage-warn",
                  f.status === "missing" && "bg-voyage-bad",
                )}
              />
              <div>
                <div className="text-voyage-text">{f.field}</div>
                <div className="text-voyage-text-3">{f.note}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {state.kind === "error" && (
        <p className="text-[12px] text-voyage-bad mt-3">Readiness unavailable: {state.message}</p>
      )}
    </aside>
  );
}

function buildPayload(d: VoyageDraft): Record<string, unknown> {
  return {
    shipName: d.shipName,
    imo: d.imo || undefined,
    voyageType: d.voyageType,
    origin: d.origin,
    destination: d.destination,
    plannedDeparture: d.plannedDeparture,
    plannedArrival: d.plannedArrival || undefined,
    sensitivity: d.sensitivity,
    trackingMode: d.trackingMode,
    alertPreference: d.alertPreference,
    cargoPriority: d.cargoPriority || undefined,
    delayToleranceMin: d.delayToleranceMin || undefined,
    preferredRoute: d.preferredRoute || undefined,
    watchlistCompany: d.watchlistCompany || undefined,
    notes: d.notes || undefined,
  };
}
