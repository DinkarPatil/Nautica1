/**
 * Real backend client for the voyage feature.
 *
 * Drop-in replacement for the mock `voyageApi` (same method names, same shapes).
 * Activated when NEXT_PUBLIC_USE_MOCK !== "1".
 */

import { api } from "@/lib/api/client";
import type {
  AIBrief,
  CauseAttribution,
  CopilotResult,
  ETASnapshot,
  Milestone,
  Port,
  StateTransition,
  Voyage,
  VoyageAlert,
  VoyageEvent,
  VoyageLiveSnapshot,
  VoyageReadiness,
  VoyageReport,
  VoyageScorecard,
  VoyageStoryline,
  VoyageTriage,
} from "@/types/voyage";

export const voyageApiLive = {
  async getVoyage(id: string): Promise<Voyage> {
    return api<Voyage>(`/api/voyages/${id}`);
  },
  async getLive(id: string): Promise<VoyageLiveSnapshot> {
    return api<VoyageLiveSnapshot>(`/api/voyages/${id}/live`);
  },
  async getEvents(id: string): Promise<VoyageEvent[]> {
    return api<VoyageEvent[]>(`/api/voyages/${id}/events`);
  },
  async getAlerts(id: string): Promise<VoyageAlert[]> {
    return api<VoyageAlert[]>(`/api/voyages/${id}/alerts`);
  },
  async getBrief(id: string): Promise<AIBrief> {
    return api<AIBrief>(`/api/voyages/${id}/brief`);
  },
  async getETASeries(id: string): Promise<ETASnapshot[]> {
    return api<ETASnapshot[]>(`/api/voyages/${id}/eta-series`);
  },
  async getAttribution(id: string): Promise<CauseAttribution> {
    return api<CauseAttribution>(`/api/voyages/${id}/attribution`);
  },
  async getMilestones(id: string): Promise<Milestone[]> {
    return api<Milestone[]>(`/api/voyages/${id}/milestones`);
  },
  async getReport(id: string): Promise<VoyageReport> {
    return api<VoyageReport>(`/api/voyages/${id}/report`);
  },
  async searchPorts(q: string): Promise<Port[]> {
    return api<Port[]>(
      `/api/ports/search?q=${encodeURIComponent(q || "")}`
    );
  },
  async lookupShip(
    imo: string
  ): Promise<{ matched: boolean; ship?: { name: string; type: string; flag: string } }> {
    return api(
      `/api/ships/lookup?imo=${encodeURIComponent(imo)}`
    );
  },
  async createVoyage(input: Record<string, unknown>): Promise<{ id: string }> {
    return api<{ id: string }>(`/api/voyages`, {
      method: "POST",
      body: input,
    });
  },
  async ackAlert(
    voyageId: string,
    alertId: string
  ): Promise<{ id: string; acknowledged: true }> {
    return api(
      `/api/voyages/${voyageId}/alerts/${alertId}/acknowledge`,
      { method: "POST" }
    );
  },
  async resolveAlert(
    voyageId: string,
    alertId: string
  ): Promise<{ id: string; lifecycle: "resolved"; resolvedAt: string }> {
    return api(
      `/api/voyages/${voyageId}/alerts/${alertId}/resolve`,
      { method: "POST" }
    );
  },
  async getTriage(voyageId: string): Promise<VoyageTriage> {
    return api<VoyageTriage>(`/api/voyages/${voyageId}/alerts/triage`);
  },
  async getStoryline(voyageId: string): Promise<VoyageStoryline> {
    return api<VoyageStoryline>(`/api/voyages/${voyageId}/storyline`);
  },
  async getScorecard(voyageId: string): Promise<VoyageScorecard> {
    return api<VoyageScorecard>(`/api/voyages/${voyageId}/scorecard`);
  },
  async getTransitions(voyageId: string): Promise<StateTransition[]> {
    return api<StateTransition[]>(`/api/voyages/${voyageId}/transitions`);
  },
  async startVoyage(voyageId: string): Promise<{ id: string; state: string }> {
    return api(`/api/voyages/${voyageId}/start`, { method: "POST" });
  },
  async readiness(draft: Record<string, unknown>): Promise<VoyageReadiness> {
    return api<VoyageReadiness>("/api/voyages/readiness", {
      method: "POST",
      body: draft,
    });
  },
  async copilot(draft: Record<string, unknown>): Promise<CopilotResult> {
    return api<CopilotResult>("/api/voyages/copilot", {
      method: "POST",
      body: draft,
    });
  },
};
