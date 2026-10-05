"use client";

import ProtectedPage from "../components/auth/ProtectedPage";
import RoleGate from "../components/auth/RoleGate";
import KPICards from "../components/dashboard/KPICards";
import MaritimeMap from "../components/map/MaritimeMap";
import CongestionChart from "../components/dashboard/CongestionChart";
import AGIFeed from "../components/dashboard/AGIFeed";
import RiskSnapshot from "../components/dashboard/RiskSnapshot";
import RiskBanner from "../components/dashboard/RiskBanner";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../types";

function DashboardContent() {
  const { user } = useAuth();
  const roleLabel = user ? ROLE_LABELS[user.role] : "";

  return (
    <div className="min-h-full" style={{ background: "#FAF8F5" }}>
      {/* Page header */}
      <div className="px-8 lg:px-12 pt-10 pb-8 border-b border-sand/30">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-3">
              {roleLabel} · Command & Control
            </div>
            <h1 className="text-h1 text-charcoal-deep">
              Executive Bridge
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-10 h-px bg-gold-muted opacity-50" />
              <span className="font-body text-sm text-greige">
                100 vessels · 20 ports · Live intelligence
              </span>
            </div>
          </div>
          <div className="text-right hidden lg:block">
            <div className="font-body font-num text-3xl text-charcoal-deep" style={{ fontWeight: 400, letterSpacing: "-0.01em" }}>
              {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            <div className="font-body text-xs tracking-[0.2em] uppercase text-greige mt-1">
              {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC · GlimmoraNautica HQ
            </div>
          </div>
        </div>
      </div>

      {/* Risk auto-detection banner */}
      <RoleGate anyPermission={["VIEW_ALL_ALERTS"]}>
        <div className="px-8 lg:px-12 pt-5">
          <RiskBanner />
        </div>
      </RoleGate>

      {/* KPI Strip — full for executive/fleet_ops/ai_core, filtered for others */}
      <div className="px-8 lg:px-12 pt-5 pb-5">
        <KPICards />
      </div>

      {/* AGI Ticker */}
      <RoleGate anyPermission={["VIEW_ALL", "VIEW_TRADE_AGI", "RUN_AGI"]}>
        <div className="px-8 lg:px-12 pb-5">
          <AGIFeed />
        </div>
      </RoleGate>

      {/* Main grid: Map + Risk */}
      <div className="px-8 lg:px-12 pb-5 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <MaritimeMap height={420} />
        </div>
        <RoleGate anyPermission={["VIEW_ALL", "VIEW_ALL_ALERTS"]}>
          <div className="xl:col-span-1">
            <RiskSnapshot />
          </div>
        </RoleGate>
      </div>

      {/* Charts */}
      <div className="px-8 lg:px-12 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RoleGate anyPermission={["VIEW_ALL", "VIEW_PORTS", "VIEW_ASSIGNED_PORTS"]}>
          <CongestionChart />
        </RoleGate>

        {/* Fleet Status */}
        <div className="bg-white border border-sand/40 p-7">
          <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-1">Fleet Composition</div>
          <div className="text-h2 text-charcoal-deep mb-6">
            Status Overview
          </div>
          <div className="space-y-4">
            {[
              { label: "En Route", count: 54, pct: 54, color: "#C9A962" },
              { label: "At Port", count: 22, pct: 22, color: "#4A5568" },
              { label: "Delayed", count: 11, pct: 11, color: "#A68B3D" },
              { label: "Flagged", count: 7, pct: 7, color: "#8B5252" },
              { label: "Anchored", count: 6, pct: 6, color: "#9A8F82" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="font-body text-sm text-charcoal-warm">{item.label}</span>
                  </div>
                  <span className="text-stat-sm text-charcoal-deep">
                    {item.count}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-parchment rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.pct}%`, background: item.color, transition: "width 1s ease" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedPage path="/dashboard">
      <DashboardContent />
    </ProtectedPage>
  );
}
