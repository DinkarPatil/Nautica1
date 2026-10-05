import { cn } from "../primitives";
import type { CauseFactor } from "@/types/voyage";

export function AttributionList({
  factors,
  className,
}: {
  factors: CauseFactor[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)}>
      {factors.map((f) => (
        <li key={f.key} className="flex items-baseline gap-4">
          <span className="vg-label w-24 shrink-0 capitalize">{f.key}</span>
          <span className="vg-num text-[14px] text-voyage-text w-12 shrink-0">{f.weightPct}%</span>
          {f.note && <span className="text-[13px] text-voyage-text-2 leading-[1.55]">{f.note}</span>}
        </li>
      ))}
    </ul>
  );
}
