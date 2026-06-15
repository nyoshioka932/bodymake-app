"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import type { TrendMetricKey, TrendPoint } from "@/lib/dashboard/types";

const METRIC_OPTIONS: { key: TrendMetricKey; label: string; unit: string }[] = [
  { key: "weight_kg", label: "体重", unit: "kg" },
  { key: "body_fat_pct", label: "体脂肪率", unit: "%" },
  { key: "body_fat_kg", label: "体脂肪量", unit: "kg" },
  { key: "muscle_kg", label: "骨格筋量", unit: "kg" },
];

export function TrendChartClient({ series }: { series: Record<TrendMetricKey, TrendPoint[]> }) {
  const [metric, setMetric] = useState<TrendMetricKey>("weight_kg");
  const data = series[metric];
  const unit = METRIC_OPTIONS.find((option) => option.key === metric)?.unit ?? "";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {METRIC_OPTIONS.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant={metric === option.key ? "default" : "outline"}
            onClick={() => setMetric(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} unit={unit} width={48} />
            <Tooltip formatter={(value) => `${value} ${unit}`} />
            <Line
              type="monotone"
              dataKey="value"
              name="当日値"
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              dot={false}
              connectNulls={false}
              opacity={0.6}
            />
            <Line
              type="monotone"
              dataKey="movingAverage"
              name="7日移動平均"
              stroke="var(--foreground)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
