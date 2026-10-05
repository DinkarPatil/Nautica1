"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "../primitives";
import { fmtDelta } from "@/lib/voyage/format";
import type { ETASnapshot } from "@/types/voyage";

export function ETATrendCard({
  series,
  className,
}: {
  series: ETASnapshot[];
  className?: string;
}) {
  const data = useMemo(() => {
    if (series.length === 0) return [];
    const baseline = new Date(series[0].eta).getTime();
    return series.map((s) => {
      const t = new Date(s.ts).getTime();
      const etaMin = (new Date(s.eta).getTime() - baseline) / 60000;
      const band = 60 + (1 - s.confidence) * 240;
      return {
        ts: t,
        tsLabel: new Date(s.ts).toISOString().slice(11, 16),
        etaMin,
        bandLow: etaMin - band,
        bandHigh: etaMin + band,
        cause: s.cause,
        deltaMinFromPrev: s.deltaMinFromPrev,
      };
    });
  }, [series]);

  const last = series.at(-1);
  const lede = (() => {
    if (!last) return "ETA history will populate after first revision.";
    if (last.narration) return last.narration;
    if (last.deltaMinFromPrev === 0) return "ETA stable.";
    const direction = last.deltaMinFromPrev > 0 ? "shifted" : "recovered";
    return `ETA ${direction} ${fmtDelta(last.deltaMinFromPrev)}${last.cause ? ` — ${last.cause}` : ""}`;
  })();

  // ETA Drift Narrator: render one auto-generated sentence per snapshot, newest first.
  const narrations = useMemo(() => {
    return [...series]
      .reverse()
      .filter((s) => s.narration && s.deltaMinFromPrev !== 0)
      .slice(0, 5)
      .map((s) => ({
        ts: s.ts,
        delta: s.deltaMinFromPrev,
        cause: s.cause,
        narration: s.narration as string,
      }));
  }, [series]);

  return (
    <article className={cn("vg-card p-6", className)}>
      <div className="flex items-center justify-between mb-1">
        <p className="vg-label">ETA Trend</p>
        <span className="text-[11px] text-voyage-text-3">since departure</span>
      </div>
      <p className="text-[13px] text-voyage-text-2 mb-4">{lede}</p>

      <div className="h-[200px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="vgETABand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="tsLabel"
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            />
            <YAxis hide domain={["dataMin - 60", "dataMax + 60"]} />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.16)", strokeDasharray: "2 2" }}
              contentStyle={{
                background: "#11161F",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 8,
                color: "#F2F4F8",
                fontSize: 12,
              }}
              formatter={(v, name) =>
                name === "etaMin"
                  ? [fmtDelta(Math.round(Number(v))), "ETA Δ"]
                  : [String(v), String(name)]
              }
              labelStyle={{ color: "#A4ACBA" }}
            />
            <Area
              type="monotone"
              dataKey="bandHigh"
              stroke="none"
              fill="url(#vgETABand)"
              isAnimationActive
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="etaMin"
              stroke="#3B82F6"
              strokeWidth={1.75}
              fill="none"
              dot={{ r: 3, fill: "#11161F", stroke: "#3B82F6", strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: "#3B82F6", stroke: "#F2F4F8", strokeWidth: 1 }}
              isAnimationActive
              animationDuration={600}
            />
            <ReferenceLine
              x={data[data.length - 1]?.tsLabel}
              stroke="#A4ACBA"
              strokeDasharray="2 4"
              label={{ value: "NOW", position: "top", fill: "#A4ACBA", fontSize: 10 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {narrations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-voyage-border-2" data-testid="eta-narrator">
          <p className="vg-label mb-2">ETA Drift Narrator</p>
          <ul className="space-y-2">
            {narrations.map((n) => (
              <li key={n.ts} className="text-[12px] text-voyage-text-2 leading-relaxed">
                <span className="text-voyage-text-3 mr-2 tabular-nums">
                  {new Date(n.ts).toISOString().slice(11, 16)}
                </span>
                <span
                  className={
                    n.delta > 30
                      ? "text-voyage-warn"
                      : n.delta < -30
                      ? "text-voyage-ok"
                      : "text-voyage-text"
                  }
                >
                  {fmtDelta(n.delta)}
                </span>
                <span className="ml-2">— {n.narration}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
