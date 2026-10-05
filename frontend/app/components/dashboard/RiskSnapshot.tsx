"use client";

import { alerts } from "../../data/alerts";
import { ShieldAlert, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

const severityConfig = {
  critical: { color: "#8B5252", bg: "rgba(139,82,82,0.08)", label: "Critical", Icon: ShieldAlert },
  high: { color: "#A68B3D", bg: "rgba(166,139,61,0.08)", label: "High", Icon: AlertTriangle },
  medium: { color: "#4A5A6A", bg: "rgba(74,90,106,0.08)", label: "Medium", Icon: Info },
  low: { color: "#9A8F82", bg: "rgba(154,143,130,0.08)", label: "Low", Icon: Info },
};

const typeIcons: Record<string, string> = {
  sanctions: "⚖",
  weather: "🌊",
  geopolitical: "🌍",
  route: "🛤",
  cyber: "🔐",
};

export default function RiskSnapshot() {
  const top5 = alerts.filter((a) => !a.isRead).slice(0, 5);

  return (
    <div className="bg-white border border-sand/40 p-6 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-label-sm text-greige mb-1">Live Alerts</div>
          <div className="text-h2 text-charcoal-deep">
            Risk Intelligence
          </div>
        </div>
        <Link href="/risk" className="font-body text-xs tracking-[0.2em] uppercase text-gold-muted hover:text-gold-deep transition-colors duration-200 flex items-center gap-1">
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {top5.map((alert) => {
          const cfg = severityConfig[alert.severity];
          return (
            <div key={alert.id} className="flex items-start gap-3 p-3 border border-sand/30 hover:border-sand/60 transition-colors duration-200 cursor-pointer group">
              <div
                className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: cfg.bg }}
              >
                <span className="text-xs">{typeIcons[alert.type]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="font-body text-xs tracking-[0.25em] uppercase px-1.5 py-0.5"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <span className="font-body text-xs tracking-[0.15em] uppercase text-stone">
                    {alert.type}
                  </span>
                </div>
                <div className="font-body text-xs text-charcoal-warm leading-snug line-clamp-2 group-hover:text-charcoal-deep transition-colors">
                  {alert.title}
                </div>
                <div className="font-body text-xs text-stone mt-1">
                  {new Date(alert.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: cfg.color, opacity: 0.4 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
