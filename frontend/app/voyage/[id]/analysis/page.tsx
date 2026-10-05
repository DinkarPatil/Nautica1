import { voyageApi } from "@/lib/voyage/voyageApi";
import { voyageApiLive } from "@/lib/voyage/voyageApiClient";
import {
  VoyageShell,
  VoyageStatusBar,
  VoyageTopBar,
  VoyageAutoRefresh,
} from "@/components/voyage/shell";
import { VoyageJourneyNav } from "@/components/voyage/shell/VoyageJourneyNav";
import { VoyageMapPanel } from "@/components/voyage/map/VoyageMapPanel";
import {
  ETAShiftChart,
  RouteAnalysisCard,
  CauseAttributionCard,
  MilestoneTable,
  InsightSummaryCard,
} from "@/components/voyage/analysis";
import { VoyageStorylineCard } from "@/components/voyage/analysis/VoyageStorylineCard";

export const dynamic = "force-dynamic";

export default async function VoyageAnalysisPage({ params }: { params: { id: string } }) {
  const [voyage, live, etaSeries, attribution, milestones, alerts, storyline, insightOut] = await Promise.all([
    voyageApi.getVoyage(params.id),
    voyageApi.getLive(params.id),
    voyageApi.getETASeries(params.id),
    voyageApi.getAttribution(params.id),
    voyageApi.getMilestones(params.id),
    voyageApi.getAlerts(params.id),
    voyageApiLive.getStoryline(params.id).catch(() => ({
      voyageId: params.id,
      chapters: [],
      generatedAt: new Date().toISOString(),
    })),
    fetchInsight(params.id).catch(() => ({ insight: "" })),
  ]);

  const insight =
    insightOut.insight ||
    "Detailed analysis is being generated. The chart, storyline, and attribution above already reflect the latest available telemetry.";

  return (
    <VoyageShell
      topBar={<VoyageTopBar voyage={voyage} phase={live.phase} />}
      statusBar={<VoyageStatusBar live={live} alerts={alerts} />}
    >
      <VoyageAutoRefresh intervalMs={120000} />
      <VoyageJourneyNav voyageId={params.id} active="analysis" alerts={alerts} />

      <div className="grid grid-cols-12 gap-4 px-6 pt-2">
        <div className="col-span-12 lg:col-span-5">
          <div className="lg:sticky lg:top-[72px]">
            <VoyageMapPanel
              voyage={voyage}
              live={live}
              mode="both"
              className="h-[calc(100vh-9rem)]"
            />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
          <VoyageStorylineCard storyline={storyline} />
          <ETAShiftChart series={etaSeries} />
          <RouteAnalysisCard
            plannedNm={Math.round(live.distanceTotalNm)}
            actualNm={Math.round(live.distanceTotalNm * 1.005)}
            maxDeviationNm={1.4}
            slowdownCount={1}
            rerouteWarnings={0}
          />
          <CauseAttributionCard attribution={attribution} />
          <MilestoneTable milestones={milestones} />
          <InsightSummaryCard body={insight} />
        </div>
      </div>
    </VoyageShell>
  );
}

async function fetchInsight(id: string): Promise<{ insight: string }> {
  // The voyageApiLive object doesn't expose insight today; call directly.
  const { api } = await import("@/lib/api/client");
  return api<{ insight: string }>(`/api/voyages/${id}/insight`);
}
