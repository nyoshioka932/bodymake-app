"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchAvailableExercises } from "@/lib/workout/template-queries";
import type { Exercise } from "@/lib/workout/types";
import type { SessionExercise } from "@/components/workout/exercise-card";

export function AddExerciseToSession({
  existingExerciseIds,
  nextOrder,
  onAdd,
  onCancel,
}: {
  existingExerciseIds: string[];
  nextOrder: number;
  onAdd: (exercise: SessionExercise) => void;
  onCancel: () => void;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableExercises(existingExerciseIds)
      .then(setExercises)
      .catch(() => setError("種目の取得に失敗しました"))
      .finally(() => setLoading(false));
    // マウント時のスナップショットで取得するため依存配列には含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    if (!selectedId) {
      setError("種目を選択してください");
      return;
    }
    const ex = exercises.find((e) => e.id === selectedId);
    if (!ex) return;
    onAdd({
      exercise_id: ex.id,
      exercise_name: ex.name,
      exercise_order: nextOrder,
      sets: [],
    });
  };

  if (loading) return <p className="text-muted-foreground text-xs">読み込み中...</p>;

  return (
    <div className="border-border mt-2 flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-foreground text-sm font-medium">種目を追加</p>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="border-border bg-background text-foreground w-full rounded-md border px-2 py-2"
      >
        <option value="">選択してください</option>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd}>
          追加
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
