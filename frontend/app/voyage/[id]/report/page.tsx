import { voyageApi } from "@/lib/voyage/voyageApi";
import { voyageApiLive } from "@/lib/voyage/voyageApiClient";
import { fmtETA, fmtDuration, fmtDelta } from "@/lib/voyage/format";
import {
  ReportSection,
  ReportHeader,
  ReportFooter,
  AttributionList,
} from "@/components/voyage/report";
import { ETATrendCard } from "@/components/voyage/chart/ETATrendCard";
import { MilestoneTable } from "@/components/voyage/analysis/MilestoneTable";
import { VoyageScorecardCard } from "@/components/voyage/report/VoyageScorecardCard";
import { VoyageReportExport } from "@/components/voyage/report/VoyageReportExport";
import { VoyageJourneyNav } from "@/components/voyage/shell/VoyageJourneyNav";

export const dynamic = "force-dynamic";

export default async function VoyageReportPage({ params }: { params: { id: string } }) {
  const [report, scorecard, alerts] = await Promise.all([
    voyageApi.getReport(params.id),
    voyageApiLive.getScorecard(params.id).catch(() => null),
    voyageApi.getAlerts(params.id),
  ]);
  const v = report.voyage;

  const riskEvents = report.events.filter(
    (e) => e.severity === "warning" || e.severity === "danger"
  );

  return (
    <>
      <VoyageJourneyNav voyageId={params.id} active="report" alerts={alerts} />
      <div className="mx-auto max-w-[880px] px-6 pt-6 pb-16">
      <ReportHeader generatedAt={fmtETA(new Date().toISOString()) + " UTC"} />

      <div className="pb-2">
        <h1 className="text-[28px] tracking-[-0.02em] font-medium text-voyage-text">
          {v.ship.name}
        </h1>
        <p className="text-[14px] text-voyage-text-2 mt-2">
          {v.origin.name} → {v.destination.name}
          <span className="text-voyage-text-3">
            {" · "}
            {v.actualDeparture && v.actualArrival
              ? `${fmtETA(v.actualDeparture)} → ${fmtETA(v.actualArrival)} UTC`
              : "—"}
            {" · "}
            {fmtDuration(report.durationActualMin)}
          </span>
        </p>
      </div>

      {scorecard && (
        <ReportSection title="Voyage Scorecard">
          <VoyageScorecardCard scorecard={scorecard} />
        </ReportSection>
      )}

      <ReportSection title="Summary">
        <p className="text-[15px] leading-[1.65] text-voyage-text">{report.summary}</p>
      </ReportSection>

      <ReportSection title="ETA Trend">
        <ETATrendCard series={report.etaSeries} />
      </ReportSection>

      <ReportSection title="Delay Attribution">
        <AttributionList factors={report.attribution.factors} />
      </ReportSection>

      <ReportSection title="Risk Events">
        <ul className="space-y-2.5">
          {riskEvents.length === 0 && (
            <li className="text-[13px] text-voyage-text-3">No risk events of note.</li>
          )}
          {riskEvents.map((e) => (
            <li key={e.id} className="flex items-baseline gap-3">
              <span className="text-[12px] text-voyage-text-3 vg-mono w-32 shrink-0">
                {fmtETA(e.ts)} UTC
              </span>
              <span className="text-[13px] text-voyage-text">{e.title}</span>
              {e.detail && (
                <span className="text-[12px] text-voyage-text-3">— {e.detail}</span>
              )}
            </li>
          ))}
        </ul>
      </ReportSection>

      <ReportSection title="Milestones">
        <MilestoneTable milestones={report.milestones} />
      </ReportSection>

      <ReportSection title="Final Status">
        <p className="text-[14px] text-voyage-text leading-[1.65]">
          Final risk score{" "}
          <span className="vg-num text-voyage-text">{report.finalRiskScore}</span>{" "}
          ({v.actualArrival ? "Arrived" : "In progress"}). Total delta{" "}
          <span className="vg-num">
            {fmtDelta(report.durationActualMin - report.durationPlannedMin)}
          </span>{" "}
          vs. plan.
        </p>
        <p className="text-[14px] text-voyage-text-2 leading-[1.65] mt-3 italic">
          {report.aiConclusion}
        </p>
      </ReportSection>

      <VoyageReportExport report={report} scorecard={scorecard} />
      <ReportFooter voyageId={v.id} />
      </div>
    </>
  );
}
