import { Sparkles } from "lucide-react";
import { cn } from "../primitives";

export function InsightSummaryCard({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  return (
    <article
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
        <p className="vg-label">Insight Summary</p>
      </div>
      <p className="text-[14px] leading-[1.65] text-voyage-text whitespace-pre-line">{body}</p>
    </article>
  );
}
