import type { Port } from "@/types/voyage";

export interface VoyageDraft {
  shipName: string;
  imo: string;
  voyageType: string;
  origin?: Port;
  destination?: Port;
  plannedDeparture: string;
  plannedArrival: string;
  sensitivity: string;
  trackingMode: string;
  alertPreference: string;
  cargoPriority: string;
  delayToleranceMin: string;
  preferredRoute: string;
  watchlistCompany: string;
  notes: string;
}

export const emptyDraft: VoyageDraft = {
  shipName: "",
  imo: "",
  voyageType: "Container",
  plannedDeparture: "",
  plannedArrival: "",
  sensitivity: "Normal",
  trackingMode: "Real-time",
  alertPreference: "Full intelligence",
  cargoPriority: "",
  delayToleranceMin: "",
  preferredRoute: "",
  watchlistCompany: "",
  notes: "",
};
