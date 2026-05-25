"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function HandicapTrend({
  data,
}: {
  data: Array<{ label: number; differential: number; date: string }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: -10 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--muted)"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted)"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--accent)", strokeDasharray: 4 }}
            contentStyle={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border-strong)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--muted)" }}
            itemStyle={{ color: "var(--foreground)" }}
            formatter={(v) => [`${Number(v).toFixed(1)} diff`, ""]}
            labelFormatter={(_, p) => {
              const date = p?.[0]?.payload?.date;
              return date
                ? new Date(date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";
            }}
          />
          <Line
            type="monotone"
            dataKey="differential"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
