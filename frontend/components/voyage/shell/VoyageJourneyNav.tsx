"use client";

import Link from "next/link";
import { Activity, AlertTriangle, BarChart3, FileText } from "lucide-react";
import type { VoyageAlert } from "@/types/voyage";
import { cn } from "../primitives/cn";

type ActiveTab = "live" | "alerts" | "analysis" | "report";

/**
 * Top-of-page navigation strip for the voyage journey.
 *
 * Always shows the four pages of the flow + an unack-alert badge so the
 * operator never has to hunt for new issues. Critical-point UX: the badge
 * is the only thing that draws their eye when there's something to do.
 */
export function VoyageJourneyNav({
  voyageId,
  active,
  alerts = [],
}: {
  voyageId: string;
  active: ActiveTab;
  alerts?: VoyageAlert[];
}) {
  const newCount = alerts.filter((a) => (a.lifecycle ?? (a.acknowledged ? "acknowledged" : "new")) === "new").length;

  const tabs: { key: ActiveTab; href: string; label: string; Icon: typeof Activity; badge?: number }[] = [
    { key: "live", href: `/voyage/${voyageId}`, label: "Live", Icon: Activity },
    { key: "alerts", href: `/voyage/${voyageId}/alerts`, label: "Alerts", Icon: AlertTriangle, badge: newCount },
    { key: "analysis", href: `/voyage/${voyageId}/analysis`, label: "Analysis", Icon: BarChart3 },
    { key: "report", href: `/voyage/${voyageId}/report`, label: "Report", Icon: FileText },
  ];

  return (
    <nav
      data-testid="voyage-journey-nav"
      className="px-6 pt-3 pb-2 border-b border-voyage-border-2 bg-voyage-bg/80 sticky top-0 z-10 backdrop-blur"
    >
      <ul className="flex items-center gap-1">
        {tabs.map(({ key, href, label, Icon, badge }) => {
          const isActive = key === active;
          return (
            <li key={key}>
              <Link
                href={href}
                data-testid={`voyage-nav-${key}`}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-md text-[12px] tracking-[0.04em] uppercase transition-colors",
                  isActive
                    ? "bg-voyage-elevated text-voyage-text border border-voyage-border"
                    : "text-voyage-text-3 hover:text-voyage-text border border-transparent hover:bg-voyage-elevated/60",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {badge && badge > 0 ? (
                  <span
                    className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-voyage-bad/30 text-voyage-bad text-[10px] px-1"
                    data-testid={`voyage-nav-${key}-badge`}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
