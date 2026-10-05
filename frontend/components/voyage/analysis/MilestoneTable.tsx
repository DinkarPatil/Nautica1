import { cn } from "../primitives";
import { fmtDelta, fmtETA } from "@/lib/voyage/format";
import type { Milestone } from "@/types/voyage";

export function MilestoneTable({
  milestones,
  className,
}: {
  milestones: Milestone[];
  className?: string;
}) {
  return (
    <article className={cn("vg-card p-6", className)}>
      <p className="vg-label mb-4">Milestone Comparison</p>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left">
            <th className="vg-label py-2.5 font-medium">Milestone</th>
            <th className="vg-label py-2.5 font-medium">Plan</th>
            <th className="vg-label py-2.5 font-medium">Actual / Projected</th>
            <th className="vg-label py-2.5 font-medium text-right">Delta</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((m) => {
            const actual = m.actualTs ?? m.projectedTs;
            const delta = m.deltaMin ?? 0;
            return (
              <tr
                key={m.key}
                className="border-t border-voyage-border-2 hover:bg-white/[0.02] transition-colors duration-150"
              >
                <td className="py-3 text-voyage-text">{m.name}</td>
                <td className="py-3 vg-mono text-voyage-text-2">{fmtETA(m.plannedTs)}</td>
                <td className="py-3 vg-mono text-voyage-text">
                  {actual ? fmtETA(actual) : "—"}
                  {!m.actualTs && m.projectedTs && (
                    <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-voyage-text-3">
                      proj.
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    "py-3 vg-mono text-right",
                    delta > 60 ? "text-voyage-warn" : delta < 0 ? "text-voyage-ok" : "text-voyage-text-2"
                  )}
                >
                  {delta === 0 ? "—" : fmtDelta(delta)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}
