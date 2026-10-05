"use client";

import { useCallback } from "react";
import { Download, Printer } from "lucide-react";
import type { VoyageReport, VoyageScorecard } from "@/types/voyage";

export function VoyageReportExport({
  report,
  scorecard,
}: {
  report: VoyageReport;
  scorecard: VoyageScorecard | null;
}) {
  const downloadJson = useCallback(() => {
    const payload = JSON.stringify({ report, scorecard }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.voyage.id}-report.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [report, scorecard]);

  const print = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  return (
    <div className="mt-8 flex items-center gap-3 print:hidden" data-testid="voyage-report-export">
      <button
        type="button"
        onClick={downloadJson}
        className="btn-vg-ghost text-[12px]"
        data-testid="voyage-report-download"
      >
        <Download className="w-3.5 h-3.5" />
        Download JSON
      </button>
      <button
        type="button"
        onClick={print}
        className="btn-vg-ghost text-[12px]"
        data-testid="voyage-report-print"
      >
        <Printer className="w-3.5 h-3.5" />
        Print
      </button>
    </div>
  );
}
