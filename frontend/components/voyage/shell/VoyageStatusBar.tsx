"use client";

import { LiveDot } from "../primitives";
import { fmtDelta, fmtRelative } from "@/lib/voyage/format";
import type { VoyageAlert, VoyageLiveSnapshot } from "@/types/voyage";

const RISK_LETTER: Record<string, string> = {
  low: "L",
  medium: "M",
  high: "H",
};

const RISK_COLOR: Record<string, string> = {
  low: "text-voyage-ok",
  medium: "text-voyage-warn",
  high: "text-voyage-danger",
};

export function VoyageStatusBar({
  live,
  alerts,
}: {
  live?: VoyageLiveSnapshot;
  alerts?: VoyageAlert[];
}) {
  const openAlerts = alerts?.filter((a) => !a.resolvedAt && !a.acknowledged) ?? [];

  return (
    <footer
      className="fixed bottom-0 inset-x-0 h-9 z-30 bg-voyage-bg/85 backdrop-blur border-t border-voyage-border-2 flex items-center justify-between px-6 text-[11px] text-voyage-text-3 vg-mono"
    >
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-2">
          <LiveDot /> ONLINE
        </span>
        <span>AIS sync {live ? fmtRelative(live.asOf) : "—"}</span>
        <span>
          {openAlerts.length} {openAlerts.length === 1 ? "alert" : "alerts"}
        </span>
      </div>
      <div className="flex items-center gap-5">
        {live && (
          <span>
            Risk{" "}
            <span className={RISK_COLOR[live.riskBand] ?? ""}>
              {RISK_LETTER[live.riskBand] ?? "—"}
            </span>
          </span>
        )}
        {live && (
          <span>
            ETA Δ{" "}
            <span className={live.etaDeltaMin > 0 ? "text-voyage-warn" : "text-voyage-text-2"}>
              {fmtDelta(live.etaDeltaMin)}
            </span>
          </span>
        )}
        <span className="uppercase tracking-[0.14em]">v 1.0</span>
      </div>
    </footer>
  );
}
