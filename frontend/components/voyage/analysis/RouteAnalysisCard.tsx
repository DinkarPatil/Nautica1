import { cn, MetricCell } from "../primitives";

export function RouteAnalysisCard({
  plannedNm,
  actualNm,
  maxDeviationNm,
  slowdownCount,
  rerouteWarnings = 0,
  className,
}: {
  plannedNm: number;
  actualNm: number;
  maxDeviationNm: number;
  slowdownCount: number;
  rerouteWarnings?: number;
  className?: string;
}) {
  return (
    <article className={cn("vg-card p-6", className)}>
      <div className="flex items-center justify-between mb-5">
        <p className="vg-label">Route Analysis</p>
        <span className="text-[11px] text-voyage-text-3">planned vs. actual</span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-voyage-border-2 rounded-lg overflow-hidden">
        <MetricCell label="Planned" value={`${plannedNm.toLocaleString()} nm`} />
        <MetricCell
          label="Actual"
          value={`${actualNm.toLocaleString()} nm`}
          tone={actualNm > plannedNm ? "warn" : "default"}
          sub={`+${(actualNm - plannedNm).toLocaleString()} nm`}
        />
        <MetricCell
          label="Max Deviation"
          value={`${maxDeviationNm.toFixed(1)} nm`}
          tone={maxDeviationNm > 5 ? "warn" : "default"}
          sub="south of plan"
        />
        <MetricCell
          label="Slowdowns / Reroutes"
          value={`${slowdownCount} / ${rerouteWarnings}`}
        />
      </div>
    </article>
  );
}
