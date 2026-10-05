"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { VoyageShell, VoyageTopBar } from "@/components/voyage/shell";
import {
  VoyageCreateForm,
  VoyageReadinessPanel,
  VoyageSetupCopilot,
  RoutePreviewStrip,
  emptyDraft,
  type VoyageDraft,
} from "@/components/voyage/create";
import { voyageApi } from "@/lib/voyage/voyageApi";
import type { VoyageReadiness } from "@/types/voyage";

export default function VoyageCreatePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<VoyageDraft>(emptyDraft);
  const [pending, startTransition] = useTransition();
  const [readiness, setReadiness] = useState<VoyageReadiness | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!readiness?.canStart;

  const handleApply = useCallback((field: string, value: string) => {
    setDraft((d) => {
      // The copilot may suggest fields that are stored as strings on the draft.
      if (field === "plannedArrival") {
        // Backend returns ISO strings; the form expects datetime-local input format.
        const local = value.length >= 16 ? value.slice(0, 16) : value;
        return { ...d, plannedArrival: local };
      }
      return { ...d, [field]: value } as VoyageDraft;
    });
  }, []);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const payload = {
        shipName: draft.shipName,
        imo: draft.imo || undefined,
        voyageType: draft.voyageType,
        origin: draft.origin,
        destination: draft.destination,
        plannedDeparture: draft.plannedDeparture,
        plannedArrival: draft.plannedArrival || undefined,
        sensitivity: draft.sensitivity,
        trackingMode: draft.trackingMode,
        alertPreference: draft.alertPreference,
        cargoPriority: draft.cargoPriority || undefined,
        delayToleranceMin: draft.delayToleranceMin || undefined,
        preferredRoute: draft.preferredRoute || undefined,
        watchlistCompany: draft.watchlistCompany || undefined,
        notes: draft.notes || undefined,
      };
      try {
        const { id } = await voyageApi.createVoyage(payload as any);
        router.push(`/voyage/${id}`);
      } catch (err: any) {
        setError(err?.message || "Voyage create failed");
      }
    });
  };

  return (
    <VoyageShell topBar={<VoyageTopBar />}>
      <div className="mx-auto max-w-[1280px] px-6 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-[28px] tracking-[-0.02em] font-medium text-voyage-text">Start a Voyage</h1>
          <p className="text-[14px] text-voyage-text-2 mt-2 max-w-xl">
            One form, then we take over. We track position, narrate every ETA shift, attribute every delay,
            and write the final report so you don't have to look for any of it.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <VoyageCreateForm draft={draft} onChange={setDraft} />
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <VoyageReadinessPanel draft={draft} onReadiness={setReadiness} />
            <VoyageSetupCopilot draft={draft} onApply={handleApply} />
          </div>
        </div>

        <div className="mt-8">
          <RoutePreviewStrip draft={draft} />
        </div>

        {error && (
          <div
            data-testid="voyage-create-error"
            className="mt-6 rounded-md border border-voyage-bad/40 bg-voyage-bad/10 px-4 py-3 text-[13px] text-voyage-bad"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" className="btn-vg-ghost" onClick={() => router.back()}>
            Cancel
          </button>
          <button
            type="button"
            data-testid="voyage-start-button"
            className="btn-vg-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || pending}
          >
            {pending ? "Starting…" : "Start Tracking Voyage"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </VoyageShell>
  );
}
