"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { congestionHistory } from "../../data/ports";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-sand/50 p-4 shadow-lg">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="font-body text-xs text-charcoal-warm capitalize">{entry.dataKey}:</span>
            <span className="font-body font-num text-sm text-charcoal-deep font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CongestionChart() {
  return (
    <div className="bg-white border border-sand/40 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="font-body text-xs tracking-[0.35em] uppercase text-greige mb-2">
            7-Day Trend
          </div>
          <div className="text-h2 text-charcoal-deep">
            Global Congestion Index
          </div>
        </div>
        <div className="flex items-center gap-4">
          {[
            { color: "#B89B4A", label: "Global" },
            { color: "#4A5568", label: "Pacific" },
            { color: "#9A8F82", label: "Atlantic" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className="w-3 h-px" style={{ background: s.color }} />
              <span className="font-body text-xs tracking-[0.15em] uppercase text-stone">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={congestionHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(180, 170, 155, 0.20)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9A8F82", fontSize: 10, fontFamily: "Inter", letterSpacing: 1 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9A8F82", fontSize: 10, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            domain={[30, 80]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="global"
            stroke="#B89B4A"
            strokeWidth={2}
            dot={{ fill: "#B89B4A", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#B89B4A" }}
          />
          <Line
            type="monotone"
            dataKey="pacific"
            stroke="#4A5568"
            strokeWidth={2}
            dot={{ fill: "#4A5568", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#4A5568" }}
          />
          <Line
            type="monotone"
            dataKey="atlantic"
            stroke="#9A8F82"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={{ fill: "#9A8F82", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#9A8F82" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
