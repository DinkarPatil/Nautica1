import { voyageApi } from "@/lib/voyage/voyageApi";
import {
  VoyageShell,
  VoyageStatusBar,
  VoyageTopBar,
  VoyageAutoRefresh,
} from "@/components/voyage/shell";
import { VoyageJourneyNav } from "@/components/voyage/shell/VoyageJourneyNav";
import { VoyageMapPanel } from "@/components/voyage/map/VoyageMapPanel";
import { VoyageStatusCard } from "@/components/voyage/status/VoyageStatusCard";
import { EventTimelineCard } from "@/components/voyage/timeline/EventTimelineCard";
import { ETATrendCard } from "@/components/voyage/chart/ETATrendCard";
import { AIBriefCard, RiskScoreCard, AlertsCard, ChatComposer } from "@/components/voyage/ai";

export const dynamic = "force-dynamic";

export default async function VoyageLivePage({ params }: { params: { id: string } }) {
  const [voyage, live, events, alerts, briefRes, etaSeries] = await Promise.all([
    voyageApi.getVoyage(params.id),
    voyageApi.getLive(params.id),
    voyageApi.getEvents(params.id),
    voyageApi.getAlerts(params.id),
    // Brief is the slowest call (Vertex). If it fails or times out, render the
    // page anyway with a placeholder; auto-refresh will retry it shortly.
    voyageApi.getBrief(params.id).catch(() => null),
    voyageApi.getETASeries(params.id),
  ]);

  const brief = briefRes ?? {
    voyageId: params.id,
    asOf: new Date().toISOString(),
    whatIsHappening: "Generating live brief…",
    whatChanged: "",
    whyETAMoved: "",
    riskBand: "low" as const,
    recommendation: "",
    riskFactors: [],
  };

  return (
    <VoyageShell
      topBar={<VoyageTopBar voyage={voyage} phase={live.phase} />}
      statusBar={<VoyageStatusBar live={live} alerts={alerts} />}
    >
      <VoyageAutoRefresh intervalMs={45000} />
      <VoyageJourneyNav voyageId={params.id} active="live" alerts={alerts} />

      <div className="grid grid-cols-12 gap-4 px-6 pt-2">
        {/* Left — Map (sticky) */}
        <div className="col-span-12 lg:col-span-5">
          <div className="lg:sticky lg:top-[72px]">
            <VoyageMapPanel
              voyage={voyage}
              live={live}
              className="h-[calc(100vh-9rem)]"
            />
          </div>
        </div>

        {/* Center — Intelligence */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <VoyageStatusCard voyage={voyage} live={live} />
          <ETATrendCard series={etaSeries} />
          <EventTimelineCard events={events} />
        </div>

        {/* Right — AI rail */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <AIBriefCard brief={brief} />
          <RiskScoreCard live={live} factors={brief.riskFactors} delta={8} />
          <AlertsCard alerts={alerts} />
          <ChatComposer voyageId={voyage.id} />
        </div>
      </div>
    </VoyageShell>
  );
}
