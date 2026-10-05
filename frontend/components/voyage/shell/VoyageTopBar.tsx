"use client";

import Link from "next/link";
import { Bell, ChevronRight, Search, Settings } from "lucide-react";
import { LiveDot, Pill, cn } from "../primitives";
import type { Voyage, VoyagePhase } from "@/types/voyage";

const PHASE_LABEL: Record<VoyagePhase, string> = {
  departure: "Departing",
  in_transit: "In Transit",
  approach: "Approaching",
  docking: "Docking",
};

export function VoyageTopBar({
  voyage,
  phase,
  rightSlot,
}: {
  voyage?: Voyage;
  phase?: VoyagePhase;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-14",
        "bg-voyage-bg/80 backdrop-blur-md",
        "border-b border-voyage-border-2",
        "flex items-center justify-between",
        "px-6"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/voyage"
          className="text-voyage-text-3 hover:text-voyage-text text-[13px] transition-colors duration-200"
        >
          Voyages
        </Link>
        {voyage && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-voyage-text-4 shrink-0" />
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-voyage-text font-medium text-[15px] tracking-[-0.005em] truncate">
                {voyage.ship.name}
              </span>
              {voyage.ship.imo && (
                <span className="text-voyage-text-3 text-[12px] vg-mono shrink-0">
                  IMO {voyage.ship.imo}
                </span>
              )}
              {phase && <Pill tone="accent">{PHASE_LABEL[phase]}</Pill>}
              <LiveDot />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightSlot}
        <button
          type="button"
          className={cn(
            "h-8 px-3 rounded-md text-[12px] text-voyage-text-2",
            "border border-voyage-border-2 bg-voyage-elevated/60",
            "flex items-center gap-2 hover:border-voyage-border transition-colors duration-200"
          )}
        >
          <Search className="w-3.5 h-3.5" />
          Ask voyage
          <kbd className="text-voyage-text-4 text-[10px] vg-mono">⌘K</kbd>
        </button>
        <IconButton aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </IconButton>
        <IconButton aria-label="Settings">
          <Settings className="w-4 h-4" />
        </IconButton>
      </div>
    </header>
  );
}

function IconButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, children, ...rest } = props;
  return (
    <button
      type="button"
      className={cn(
        "w-8 h-8 grid place-items-center rounded-md",
        "text-voyage-text-2 hover:text-voyage-text hover:bg-white/[0.04]",
        "transition-colors duration-200",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
