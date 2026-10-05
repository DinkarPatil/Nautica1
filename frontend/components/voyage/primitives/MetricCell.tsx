import type { ReactNode } from "react";
import { cn } from "./cn";

export type MetricTone = "default" | "ok" | "warn" | "danger" | "muted";

const TONE: Record<MetricTone, string> = {
  default: "text-voyage-text",
  ok: "text-voyage-ok",
  warn: "text-voyage-warn",
  danger: "text-voyage-danger",
  muted: "text-voyage-text-2",
};

export function MetricCell({
  label,
  value,
  sub,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: MetricTone;
  className?: string;
}) {
  return (
    <div className={cn("bg-voyage-elevated p-4", className)}>
      <p className="vg-label mb-1.5">{label}</p>
      <p className={cn("text-[20px] font-medium tracking-[-0.01em] vg-num leading-none", TONE[tone])}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-voyage-text-3 mt-1.5">{sub}</p>}
    </div>
  );
}
