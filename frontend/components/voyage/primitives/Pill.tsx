import type { ReactNode } from "react";
import { cn } from "./cn";

export type PillTone = "accent" | "success" | "warning" | "danger" | "neutral" | "muted";

const TONE: Record<PillTone, string> = {
  accent: "bg-voyage-accent-soft text-voyage-accent border-voyage-accent/30",
  success: "bg-voyage-ok/10 text-voyage-ok border-voyage-ok/25",
  warning: "bg-voyage-warn/10 text-voyage-warn border-voyage-warn/25",
  danger: "bg-voyage-danger/10 text-voyage-danger border-voyage-danger/25",
  neutral: "bg-white/[0.04] text-voyage-text border-white/10",
  muted: "bg-white/[0.03] text-voyage-text-2 border-white/[0.06]",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium tracking-[0.04em]",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
