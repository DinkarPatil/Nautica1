import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { VoyageShell, VoyageTopBar } from "@/components/voyage/shell";
import { Pill } from "@/components/voyage/primitives";

const VOYAGES = [
  {
    id: "v_001",
    ship: "MV Nordic Falcon",
    imo: "9876543",
    route: "Algeciras → Rotterdam",
    status: "in_transit" as const,
    etaDelta: "+2h 14m",
    progress: 58,
  },
];

export default function VoyageListPage() {
  return (
    <VoyageShell topBar={<VoyageTopBar />}>
      <div className="mx-auto max-w-[1280px] px-6 pt-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] tracking-[-0.02em] font-medium text-voyage-text">Voyages</h1>
            <p className="text-[14px] text-voyage-text-2 mt-2">
              One vessel. One journey. One continuous story.
            </p>
          </div>
          <Link href="/voyage/new" className="btn-vg-primary">
            <Plus className="w-4 h-4" />
            Start a Voyage
          </Link>
        </div>

        <div className="vg-card overflow-hidden">
          <ul>
            {VOYAGES.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/voyage/${v.id}`}
                  className="flex items-center gap-6 px-6 py-5 hover:bg-white/[0.02] transition-colors duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-voyage-text font-medium text-[15px]">{v.ship}</span>
                      <span className="text-voyage-text-3 text-[12px] vg-mono">IMO {v.imo}</span>
                      <Pill tone="accent">In Transit</Pill>
                    </div>
                    <p className="text-[13px] text-voyage-text-2 mt-1.5">{v.route}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="vg-label">ETA Δ</p>
                    <p className="text-[14px] vg-num text-voyage-warn mt-1">{v.etaDelta}</p>
                  </div>
                  <div className="w-32 shrink-0">
                    <p className="vg-label text-right">Progress</p>
                    <div className="h-[3px] mt-2 bg-voyage-border-2 rounded-full overflow-hidden">
                      <span
                        className="block h-full bg-voyage-accent rounded-full"
                        style={{ width: `${v.progress}%` }}
                      />
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-voyage-text-4 group-hover:text-voyage-text transition-colors duration-200" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </VoyageShell>
  );
}
