"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "../primitives";
import { fmtDelta } from "@/lib/voyage/format";
import type { ETASnapshot } from "@/types/voyage";

const CAUSE_COLOR: Record<string, string> = {
  weather: "#F59E0B",
  congestion: "#EF4444",
  speed: "#3B82F6",
  routing: "#A4ACBA",
};

export function ETAShiftChart({
  series,
  className,
}: {
  series: ETASnapshot[];
  className?: string;
}) {
  const data = useMemo(() => {
    if (series.length === 0) return [];
    const baseline = new Date(series[0].eta).getTime();
    return series.map((s) => ({
      tsLabel: new Date(s.ts).toISOString().slice(5, 16).replace("T", " "),
      etaMin: (new Date(s.eta).getTime() - baseline) / 60000,
      cause: s.cause,
      delta: s.deltaMinFromPrev,
    }));
  }, [series]);

  return (
    <article className={cn("vg-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="vg-label">ETA Shift</p>
        <span className="text-[11px] text-voyage-text-3">{data.length} revisions</span>
      </div>

      <div className="h-[260px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="tsLabel"
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmtDelta(Math.round(v))}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "#11161F",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 8,
                fontSize: 12,
                color: "#F2F4F8",
              }}
              labelStyle={{ color: "#A4ACBA" }}
              formatter={(v, name) =>
                name === "etaMin"
                  ? [fmtDelta(Math.round(Number(v))), "ETA Δ"]
                  : [String(v), String(name)]
              }
            />
            <Line
              type="stepAfter"
              dataKey="etaMin"
              stroke="#3B82F6"
              strokeWidth={1.75}
              dot={{ r: 3, fill: "#11161F", stroke: "#3B82F6", strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: "#3B82F6", stroke: "#F2F4F8", strokeWidth: 1 }}
              isAnimationActive
              animationDuration={600}
            />
            {data.map((d, i) =>
              d.cause ? (
                <ReferenceDot
                  key={i}
                  x={d.tsLabel}
                  y={d.etaMin}
                  r={4}
                  fill={CAUSE_COLOR[d.cause] ?? "#A4ACBA"}
                  stroke="#11161F"
                  strokeWidth={2}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-voyage-text-3">
        {Object.entries(CAUSE_COLOR).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 capitalize">
            <span className="w-2 h-2 rounded-full" style={{ background: v }} />
            {k}
          </span>
        ))}
      </div>
    </article>
  );
}
