import { cn } from "../primitives";
import type { VoyagePhase } from "@/types/voyage";

const PHASES: { key: VoyagePhase; label: string }[] = [
  { key: "departure", label: "Departure" },
  { key: "in_transit", label: "In-transit" },
  { key: "approach", label: "Approach" },
  { key: "docking", label: "Docking" },
];

export function PhaseIndicator({ phase, className }: { phase: VoyagePhase; className?: string }) {
  const activeIndex = PHASES.findIndex((p) => p.key === phase);
  return (
    <div className={cn("flex items-center", className)}>
      {PHASES.map((p, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <div key={p.key} className="flex items-center" style={{ flex: i < PHASES.length - 1 ? 1 : "none" }}>
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  "block rounded-full transition-colors duration-200",
                  "w-2.5 h-2.5",
                  isDone && "bg-voyage-accent",
                  isActive && "bg-voyage-accent ring-4 ring-voyage-accent-soft",
                  !isDone && !isActive && "bg-transparent border border-voyage-border"
                )}
              />
              <span
                className={cn(
                  "mt-2 text-[10px] uppercase tracking-[0.12em] whitespace-nowrap",
                  isActive
                    ? "text-voyage-text font-medium"
                    : isDone
                      ? "text-voyage-text-2"
                      : "text-voyage-text-3"
                )}
              >
                {p.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1 mx-2 mb-4",
                  isDone ? "bg-voyage-accent" : "bg-voyage-border-2"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
