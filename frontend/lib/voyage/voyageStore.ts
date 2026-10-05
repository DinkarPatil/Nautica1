"use client";

import { create } from "zustand";
import type {
  AIBrief,
  ETASnapshot,
  EventCategory,
  StreamEvent,
  Voyage,
  VoyageAlert,
  VoyageEvent,
  VoyageLiveSnapshot,
} from "@/types/voyage";

type MapMode = "live" | "planned" | "both" | "planned-vs-actual";

interface VoyageStore {
  voyage?: Voyage;
  live?: VoyageLiveSnapshot;
  events: VoyageEvent[];
  alerts: VoyageAlert[];
  brief?: AIBrief;
  etaSeries: ETASnapshot[];

  timelineFilter: EventCategory | "all";
  mapMode: MapMode;
  staleSinceMs?: number;

  hydrate: (data: {
    voyage?: Voyage;
    live?: VoyageLiveSnapshot;
    events?: VoyageEvent[];
    alerts?: VoyageAlert[];
    brief?: AIBrief;
    etaSeries?: ETASnapshot[];
  }) => void;
  applyStream: (e: StreamEvent) => void;
  ackAlert: (id: string) => void;
  setTimelineFilter: (c: EventCategory | "all") => void;
  setMapMode: (m: MapMode) => void;
}

export const useVoyageStore = create<VoyageStore>((set) => ({
  events: [],
  alerts: [],
  etaSeries: [],
  timelineFilter: "all",
  mapMode: "live",

  hydrate: (data) =>
    set((s) => ({
      voyage: data.voyage ?? s.voyage,
      live: data.live ?? s.live,
      events: data.events ?? s.events,
      alerts: data.alerts ?? s.alerts,
      brief: data.brief ?? s.brief,
      etaSeries: data.etaSeries ?? s.etaSeries,
    })),

  applyStream: (e) =>
    set((s) => {
      switch (e.kind) {
        case "snapshot": {
          const next = e.payload;
          const etaChanged = !s.live || s.live.currentETA !== next.currentETA;
          const series =
            etaChanged && s.live
              ? [
                  ...s.etaSeries,
                  {
                    ts: next.asOf,
                    eta: next.currentETA,
                    confidence: next.etaConfidence,
                    deltaMinFromPrev: next.etaDeltaMin - (s.live?.etaDeltaMin ?? 0),
                  },
                ]
              : s.etaSeries;
          return { live: next, etaSeries: series, staleSinceMs: undefined };
        }
        case "event":
          return { events: [e.payload, ...s.events].slice(0, 200) };
        case "alert":
          return { alerts: [e.payload, ...s.alerts] };
        case "brief":
          return { brief: e.payload };
        default:
          return s;
      }
    }),

  ackAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    })),

  setTimelineFilter: (c) => set({ timelineFilter: c }),
  setMapMode: (m) => set({ mapMode: m }),
}));
