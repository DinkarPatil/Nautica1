"use client";

import { ChevronRight } from "lucide-react";
import { cn, EmptyState } from "../primitives";
import { fmtRelative } from "@/lib/voyage/format";
import type { Severity, VoyageAlert } from "@/types/voyage";

const TONE_DOT: Record<Severity, string> = {
  info: "bg-voyage-accent",
  warning: "bg-voyage-warn",
  danger: "bg-voyage-danger",
};

export function AlertsCard({
  alerts,
  onAck,
  className,
}: {
  alerts: VoyageAlert[];
  onAck?: (id: string) => void;
  className?: string;
}) {
  const open = alerts.filter((a) => !a.resolvedAt && !a.acknowledged);

  return (
    <article className={cn("vg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between px-6 pt-6 pb-3">
        <p className="vg-label">Alerts</p>
        <span className="text-[11px] text-voyage-text-3 vg-num">
          {open.length} active
        </span>
      </div>

      {open.length === 0 ? (
        <EmptyState title="No active alerts" body="The voyage is clear of open warnings." />
      ) : (
        <ul>
          {open.map((a) => (
            <li
              key={a.id}
              className="group relative px-6 py-3 border-t border-voyage-border-2 hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer"
              onClick={() => onAck?.(a.id)}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", TONE_DOT[a.severity])}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] text-voyage-text">{a.title}</p>
                    <time className="text-[11px] text-voyage-text-3 vg-mono shrink-0">
                      {fmtRelative(a.raisedAt)}
                    </time>
                  </div>
                  <p className="text-[12px] text-voyage-text-3 mt-0.5 line-clamp-1">{a.detail}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-voyage-text-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
