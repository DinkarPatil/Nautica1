"use client";

import { useMemo } from "react";
import { Layers, Maximize2, Ruler } from "lucide-react";
import { cn } from "../primitives";
import { fmtCoord } from "@/lib/voyage/format";
import type { Coordinate, Voyage, VoyageLiveSnapshot } from "@/types/voyage";

type MapMode = "live" | "planned" | "both";

/**
 * MVP map: SVG mercator projection of planned route + actual position.
 * Designed to be swapped out for Mapbox/MapLibre without changing the
 * surrounding chrome (header, footer info strip).
 */
export function VoyageMapPanel({
  voyage,
  live,
  mode = "live",
  onModeChange,
  className,
}: {
  voyage?: Voyage;
  live?: VoyageLiveSnapshot;
  mode?: MapMode;
  onModeChange?: (m: MapMode) => void;
  className?: string;
}) {
  const projected = useMemo(() => {
    const points = voyage?.routePlanned ?? [];
    if (points.length === 0) return null;
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    if (live) {
      lats.push(live.position.lat);
      lons.push(live.position.lon);
    }
    const minLat = Math.min(...lats) - 2;
    const maxLat = Math.max(...lats) + 2;
    const minLon = Math.min(...lons) - 2;
    const maxLon = Math.max(...lons) + 2;
    const W = 800;
    const H = 600;
    const project = (c: Coordinate) => ({
      x: ((c.lon - minLon) / (maxLon - minLon)) * W,
      y: H - ((c.lat - minLat) / (maxLat - minLat)) * H,
    });
    return {
      W,
      H,
      route: points.map(project),
      vessel: live ? project(live.position) : null,
      origin: voyage ? project(voyage.origin) : null,
      destination: voyage ? project(voyage.destination) : null,
    };
  }, [live, voyage]);

  return (
    <section
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-voyage-sunken border border-voyage-border-2",
        "flex flex-col",
        className
      )}
    >
      {/* Floating header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-voyage-bg/70 backdrop-blur border border-voyage-border-2">
          {(["live", "planned", "both"] as MapMode[]).map((m) => {
            const active = m === mode;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange?.(m)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[11px] font-medium uppercase tracking-[0.08em] transition-colors duration-200",
                  active ? "bg-white/[0.06] text-voyage-text" : "text-voyage-text-2 hover:text-voyage-text"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <MapTool aria-label="Layers"><Layers className="w-3.5 h-3.5" /></MapTool>
          <MapTool aria-label="Distance probe"><Ruler className="w-3.5 h-3.5" /></MapTool>
          <MapTool aria-label="Maximize"><Maximize2 className="w-3.5 h-3.5" /></MapTool>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        {projected ? (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${projected.W} ${projected.H}`}
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="vgVesselGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </radialGradient>
              <pattern id="vgGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>

            <rect width={projected.W} height={projected.H} fill="#080B11" />
            <rect width={projected.W} height={projected.H} fill="url(#vgGrid)" />

            {/* Planned route */}
            {(mode === "planned" || mode === "both" || mode === "live") && (
              <polyline
                points={projected.route.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={1.5}
                strokeOpacity={mode === "live" ? 0.35 : 0.6}
                strokeDasharray="6 6"
                strokeLinecap="round"
              />
            )}

            {/* Origin marker */}
            {projected.origin && (
              <g>
                <circle cx={projected.origin.x} cy={projected.origin.y} r={5} fill="none" stroke="#A4ACBA" strokeWidth={1.5} />
              </g>
            )}

            {/* Destination marker */}
            {projected.destination && (
              <g>
                <circle cx={projected.destination.x} cy={projected.destination.y} r={18} fill="rgba(59,130,246,0.12)" />
                <circle cx={projected.destination.x} cy={projected.destination.y} r={6} fill="#3B82F6" />
              </g>
            )}

            {/* Vessel */}
            {projected.vessel && live && (
              <g
                transform={`translate(${projected.vessel.x} ${projected.vessel.y}) rotate(${live.heading})`}
                style={{ transition: "transform 1000ms cubic-bezier(0.4,0,0.2,1)" }}
              >
                <circle r={20} fill="url(#vgVesselGlow)" />
                <path d="M 0 -10 L 7 8 L 0 4 L -7 8 Z" fill="#3B82F6" stroke="#F2F4F8" strokeWidth={1} strokeLinejoin="round" />
              </g>
            )}
          </svg>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-voyage-text-3 text-[12px]">
            Awaiting route…
          </div>
        )}

        {/* Bottom info strip */}
        {live && (
          <div className="absolute bottom-3 left-3 right-3 z-10 px-4 py-2.5 rounded-lg bg-voyage-bg/80 backdrop-blur border border-voyage-border-2 flex items-center justify-between text-[12px]">
            <span className="vg-mono text-voyage-text-2">{fmtCoord(live.position.lat, live.position.lon)}</span>
            <div className="flex items-center gap-5">
              <span><span className="text-voyage-text-3">SOG</span> <span className="vg-mono text-voyage-text">{live.sog.toFixed(1)} kn</span></span>
              <span><span className="text-voyage-text-3">COG</span> <span className="vg-mono text-voyage-text">{String(live.cog).padStart(3, "0")}°</span></span>
              <span><span className="text-voyage-text-3">HDG</span> <span className="vg-mono text-voyage-text">{String(live.heading).padStart(3, "0")}°</span></span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MapTool({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="w-7 h-7 grid place-items-center rounded-md bg-voyage-bg/70 backdrop-blur border border-voyage-border-2 text-voyage-text-2 hover:text-voyage-text transition-colors duration-200"
      {...rest}
    >
      {children}
    </button>
  );
}
