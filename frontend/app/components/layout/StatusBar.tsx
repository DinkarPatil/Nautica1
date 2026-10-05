"use client";

import { useEffect, useState } from "react";
import { vessels } from "../../data/vessels";
import { alerts } from "../../data/alerts";

export default function StatusBar() {
  const [uptime, setUptime] = useState("99.99%");
  const activeVessels = vessels.filter((v) => v.status !== "At Port").length;
  const criticalAlerts = alerts.filter((a) => a.severity === "critical" && !a.isRead).length;

  return (
    <footer
      className="fixed bottom-0 left-[280px] right-0 h-[40px] z-40 flex items-center px-8 gap-8"
      style={{
        background: "#2D2A26",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-maritime-success" />
        <span className="font-body text-xs tracking-[0.25em] uppercase text-ivory-cream/80">
          Uptime {uptime}
        </span>
      </div>

      <div className="w-px h-3 bg-white/20" />

      <span className="font-body text-xs tracking-[0.25em] uppercase text-ivory-cream/80">
        {activeVessels} Vessels Underway
      </span>

      <div className="w-px h-3 bg-white/20" />

      <span className="font-body text-xs tracking-[0.25em] uppercase text-ivory-cream/80">
        Last Sync: {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
      </span>

      <div className="w-px h-3 bg-white/20" />

      {criticalAlerts > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-maritime-error animate-pulse" />
          <span className="font-body text-xs tracking-[0.25em] uppercase text-red-300">
            {criticalAlerts} Critical Alerts
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span className="font-body text-xs tracking-[0.2em] text-ivory-cream/40">
          GlimmoraNautica © MMXXVI — Sovereign-Grade Maritime Intelligence
        </span>
      </div>
    </footer>
  );
}
