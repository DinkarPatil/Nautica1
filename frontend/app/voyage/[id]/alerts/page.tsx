import { voyageApi } from "@/lib/voyage/voyageApi";
import { voyageApiLive } from "@/lib/voyage/voyageApiClient";
import { VoyageShell, VoyageStatusBar, VoyageTopBar } from "@/components/voyage/shell";
import { VoyageJourneyNav } from "@/components/voyage/shell/VoyageJourneyNav";
import { VoyageAlertsBoard } from "@/components/voyage/alerts/VoyageAlertsBoard";

export const dynamic = "force-dynamic";

export default async function VoyageAlertsPage({ params }: { params: { id: string } }) {
  // Fetch in parallel; gracefully degrade triage to empty if it fails.
  const [voyage, live, alerts, triage] = await Promise.all([
    voyageApi.getVoyage(params.id),
    voyageApi.getLive(params.id),
    voyageApi.getAlerts(params.id),
    voyageApiLive.getTriage(params.id).catch(() => ({
      voyageId: params.id,
      items: [],
      generatedAt: new Date().toISOString(),
    })),
  ]);

  return (
    <VoyageShell
      topBar={<VoyageTopBar voyage={voyage} phase={live.phase} />}
      statusBar={<VoyageStatusBar live={live} alerts={alerts} />}
    >
      <VoyageJourneyNav voyageId={params.id} active="alerts" alerts={alerts} />

      <div className="px-6 pt-4 pb-12 max-w-[1400px] mx-auto">
        <header className="mb-5">
          <h1 className="text-[22px] tracking-[-0.01em] font-medium text-voyage-text">Alerts &amp; Evidence</h1>
          <p className="text-[13px] text-voyage-text-3 mt-1 max-w-2xl">
            Triaged automatically. Tap to acknowledge or resolve — that's the only interaction here.
          </p>
        </header>

        <VoyageAlertsBoard voyageId={params.id} alerts={alerts} triage={triage} />
      </div>
    </VoyageShell>
  );
}
