"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface KpiSnapshot {
  congestion: number;
  riskAlerts: number;
  tradeVolume: number; // in $B
  co2Saved: number;
}

const BASELINE: KpiSnapshot = {
  congestion: 57,
  riskAlerts: 9,
  tradeVolume: 2.84,
  co2Saved: 4820,
};

const OPTIMIZED: KpiSnapshot = {
  congestion: 52,
  riskAlerts: 6,
  tradeVolume: 2.97,
  co2Saved: 5140,
};

interface SimulationContextValue {
  baseline: KpiSnapshot;
  current: KpiSnapshot;
  active: boolean;
  changedKeys: Set<keyof KpiSnapshot>;
  apply: () => void;
  revert: () => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [current, setCurrent] = useState<KpiSnapshot>(BASELINE);
  const [changedKeys, setChangedKeys] = useState<Set<keyof KpiSnapshot>>(new Set());

  const apply = useCallback(() => {
    const keys = (Object.keys(OPTIMIZED) as (keyof KpiSnapshot)[]).filter(
      (k) => OPTIMIZED[k] !== BASELINE[k]
    );
    setCurrent(OPTIMIZED);
    setChangedKeys(new Set(keys));
    setActive(true);
    // Clear the highlight flag after the pulse window so re-renders stay calm.
    setTimeout(() => setChangedKeys(new Set()), 2400);
  }, []);

  const revert = useCallback(() => {
    setCurrent(BASELINE);
    setActive(false);
    setChangedKeys(new Set());
  }, []);

  return (
    <SimulationContext.Provider
      value={{ baseline: BASELINE, current, active, changedKeys, apply, revert }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
