"use client";

import { Copy, Download, Mail } from "lucide-react";
import { cn } from "../primitives";

export function ReportHeader({ generatedAt, className }: { generatedAt: string; className?: string }) {
  return (
    <header className={cn("flex items-center justify-between pb-6", className)}>
      <div>
        <p className="vg-label text-voyage-text-3">Glimmora · Voyage Report</p>
        <p className="text-[12px] text-voyage-text-3 mt-1 vg-mono">{generatedAt}</p>
      </div>
      <div className="flex items-center gap-2 print:hidden">
        <button type="button" className="btn-vg-secondary">
          <Copy className="w-3.5 h-3.5" />
          Copy link
        </button>
        <button type="button" className="btn-vg-secondary">
          <Mail className="w-3.5 h-3.5" />
          Share
        </button>
        <button
          type="button"
          className="btn-vg-primary"
          onClick={() => typeof window !== "undefined" && window.print()}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    </header>
  );
}
