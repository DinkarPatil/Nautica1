"use client";

import { Sparkles } from "lucide-react";
import { cn } from "../primitives";
import { fmtRelative } from "@/lib/voyage/format";
import type { AIBrief } from "@/types/voyage";

export function AIBriefCard({ brief, className }: { brief: AIBrief; className?: string }) {
  return (
    <article
      className={cn(
        "rounded-xl bg-gradient-to-b from-voyage-elevated to-voyage-bg",
        "border border-voyage-border p-6 relative overflow-hidden",
        className
      )}
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-voyage-accent-line to-transparent"
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-voyage-accent" />
          <p className="vg-label">AI Brief</p>
        </div>
        <span className="text-[11px] text-voyage-text-3 vg-mono">
          updated {fmtRelative(brief.asOf)}
        </span>
      </div>

      <p className="text-[15px] leading-[1.6] text-voyage-text">{brief.whatIsHappening}</p>

      <div className="mt-4 pt-4 border-t border-voyage-border-2 space-y-3">
        <BriefRow label="What changed" body={brief.whatChanged} />
        <BriefRow label="Why" body={brief.whyETAMoved} />
        <BriefRow label="Recommendation" body={brief.recommendation} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button type="button" className="btn-vg-secondary">Show on map</button>
        <button type="button" className="btn-vg-ghost h-9 px-3 text-[12px]">Open analysis</button>
      </div>
    </article>
  );
}

function BriefRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="vg-label w-[88px] shrink-0 pt-0.5">{label}</span>
      <p className="text-[13px] leading-[1.55] text-voyage-text-2">{body}</p>
    </div>
  );
}
