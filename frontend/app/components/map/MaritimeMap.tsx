"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { vessels } from "../../data/vessels";
import { ports } from "../../data/ports";
import { Vessel } from "../../types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const statusColors: Record<string, string> = {
  "En Route": "#C9A962",
  "At Port": "#4A5568",
  "Delayed": "#A68B3D",
  "Flagged": "#8B5252",
  "Anchored": "#9A8F82",
};

interface Props {
  showPorts?: boolean;
  height?: number;
}

export default function MaritimeMap({ showPorts = true, height = 380 }: Props) {
  const [tooltip, setTooltip] = useState<{ vessel: Vessel; x: number; y: number } | null>(null);

  return (
    <div className="relative bg-white border border-sand/40 overflow-hidden" style={{ height }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3 border-b border-sand/30" style={{ background: "rgba(250,248,245,0.9)" }}>
        <div>
          <div className="font-body text-xs tracking-[0.35em] uppercase text-greige">Live Position</div>
          <div className="font-display text-lg text-charcoal-deep" style={{ letterSpacing: "-0.01em" }}>
            Global Maritime Traffic
          </div>
        </div>
        <div className="flex items-center gap-4">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="font-body text-xs tracking-[0.15em] text-stone">{status}</span>
            </div>
          ))}
        </div>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 120, center: [10, 20] }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup>
          <rect width="100%" height="100%" fill="#EDE8DF" />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#5C6B7A"
                  stroke="#2C3E50"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#4A5568" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Port markers */}
          {showPorts &&
            ports.map((port) => (
              <Marker key={port.id} coordinates={[port.lng, port.lat]}>
                <rect
                  x={-3}
                  y={-3}
                  width={6}
                  height={6}
                  fill="#B89B4A"
                  transform="rotate(45)"
                  opacity={0.8}
                />
              </Marker>
            ))}

          {/* Vessel markers */}
          {vessels.map((vessel) => {
            const color = statusColors[vessel.status] || "#C9A962";
            const isHighRisk = vessel.riskScore >= 70;
            return (
              <Marker
                key={vessel.id}
                coordinates={[vessel.lng, vessel.lat]}
                onMouseEnter={(e: any) => {
                  setTooltip({ vessel, x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {isHighRisk ? (
                  <>
                    <circle r={6} fill={color} opacity={0.15} />
                    <circle r={3} fill={color} opacity={0.9} />
                  </>
                ) : (
                  <circle r={2.5} fill={color} opacity={0.85} />
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-charcoal-deep text-ivory-cream p-3 pointer-events-none shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 80, minWidth: 180 }}
        >
          <div className="font-body text-sm font-medium mb-1">{tooltip.vessel.name}</div>
          <div className="font-body text-xs text-greige tracking-[0.15em]">
            {tooltip.vessel.flagEmoji} {tooltip.vessel.flag} · {tooltip.vessel.type}
          </div>
          <div className="font-body text-xs text-taupe mt-1">
            {tooltip.vessel.lat.toFixed(2)}°N {tooltip.vessel.lng.toFixed(2)}°E
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusColors[tooltip.vessel.status] }}
            />
            <span className="font-body text-xs text-greige">{tooltip.vessel.status}</span>
            <span className="ml-auto font-body text-xs text-taupe">Risk: {tooltip.vessel.riskScore}</span>
          </div>
        </div>
      )}

      {/* Vessel count */}
      <div className="absolute bottom-4 right-5 bg-white/90 border border-sand/30 px-3 py-1.5 backdrop-blur-sm">
        <span className="font-body text-xs tracking-[0.2em] text-stone">
          {vessels.length} vessels tracked
        </span>
      </div>
    </div>
  );
}
