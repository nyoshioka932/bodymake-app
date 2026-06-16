"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  fetchRecordedExercises,
  fetchExerciseE1RMHistory,
} from "@/lib/workout/growth-queries";
import type { RecordedExercise, E1RMPoint } from "@/lib/workout/growth-queries";

const inputClass =
  "border-border bg-background text-foreground rounded-md border px-2 py-1 text-sm w-full";

export function ExerciseGrowthSection() {
  const [exercises, setExercises] = useState<RecordedExercise[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [history, setHistory] = useState<E1RMPoint[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecordedExercises()
      .then((list) => {
        setExercises(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {/* 種目なしで続行 */});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetchExerciseE1RMHistory(selectedId)
      .then((data) => {
        if (cancelled) return;
        setHistory(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setHistory([]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setHistory(null);
    setLoading(true);
  };

  if (exercises.length === 0) {
    return (
      <section className="border-border bg-card rounded-lg border p-3">
        <h2 className="mb-2 text-sm font-semibold">種目別成長</h2>
        <p className="text-muted-foreground text-xs">筋トレ記録がありません</p>
      </section>
    );
  }

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">種目別成長</h2>
      <select
        className={inputClass}
        value={selectedId}
        onChange={(e) => handleSelect(e.target.value)}
      >
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>

      <div className="mt-3">
        {loading || history === null ? (
          <p className="text-muted-foreground py-8 text-center text-xs">読み込み中...</p>
        ) : history.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-xs">データがありません</p>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} width={48} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="e1rm"
                  name="推定1RM"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
