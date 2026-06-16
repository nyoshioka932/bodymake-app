"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchLastCompletedWorkout } from "@/lib/workout/workout-queries";
import { createWorkout } from "@/lib/workout/workout-actions";
import type { SplitType, WorkoutSession, WorkoutTemplate } from "@/lib/workout/types";
import { SPLIT_TYPE_LABELS } from "@/lib/workout/types";

export function WorkoutStartScreen({
  templates,
  onStart,
}: {
  templates: WorkoutTemplate[];
  onStart: (session: WorkoutSession) => void;
}) {
  const [mode, setMode] = useState<"select" | "template-list">("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (splitType: SplitType | null) => {
    setLoading(true);
    setError(null);
    try {
      const session = await createWorkout(splitType);
      onStart(session);
    } catch {
      setError("セッションの作成に失敗しました");
      setLoading(false);
    }
  };

  const handleFromLastMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const last = await fetchLastCompletedWorkout();
      const session = await createWorkout(last?.split_type ?? null);
      onStart(session);
    } catch {
      setError("セッションの作成に失敗しました");
      setLoading(false);
    }
  };

  if (mode === "template-list") {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">テンプレートを選択</h2>
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={loading}
            onClick={() => start(t.split_type)}
            className="border-border bg-card text-foreground flex w-full items-center justify-between rounded-lg border p-3 text-left disabled:opacity-50"
          >
            <span className="text-sm font-medium">{t.name}</span>
            <span className="text-muted-foreground text-xs">{SPLIT_TYPE_LABELS[t.split_type]}</span>
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setMode("select")} disabled={loading}>
          戻る
        </Button>
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">筋トレを開始</h2>
      <Button onClick={() => setMode("template-list")} disabled={loading}>
        テンプレートから開始
      </Button>
      <Button variant="outline" onClick={handleFromLastMenu} disabled={loading}>
        {loading ? "作成中..." : "前回メニューから開始"}
      </Button>
      <Button variant="outline" onClick={() => start(null)} disabled={loading}>
        空セッションから開始
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
