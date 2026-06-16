"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addExerciseToTemplate } from "@/lib/workout/template-actions";
import { fetchAvailableExercises } from "@/lib/workout/template-queries";
import type { Exercise, TemplateExercise } from "@/lib/workout/types";

function parseIntOrNull(s: string): number | null {
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

function parseFloatOrNull(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

const inputClass =
  "border-border bg-background text-foreground rounded-md border px-2 py-1 text-sm w-full placeholder:text-muted-foreground";

export function AddExerciseForm({
  templateId,
  existingExerciseIds,
  nextSortOrder,
  onAdded,
  onCancel,
}: {
  templateId: string;
  existingExerciseIds: string[];
  nextSortOrder: number;
  onAdded: (exercise: TemplateExercise) => void;
  onCancel: () => void;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableExercises(existingExerciseIds)
      .then(setExercises)
      .catch(() => setError("種目の取得に失敗しました"))
      .finally(() => setLoading(false));
    // existingExerciseIdsはマウント時点のスナップショットで取得すればよいため、依存配列には含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!selectedId) {
      setError("種目を選択してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const defaultSets = parseIntOrNull(sets);
      const targetReps = parseIntOrNull(reps);
      const defaultWeightKg = parseFloatOrNull(weight);
      await addExerciseToTemplate({
        templateId,
        exerciseId: selectedId,
        defaultSets,
        targetReps,
        defaultWeightKg,
        sortOrder: nextSortOrder,
      });
      const ex = exercises.find((e) => e.id === selectedId)!;
      onAdded({
        id: crypto.randomUUID(),
        template_id: templateId,
        exercise_id: selectedId,
        exercise_name: ex.name,
        primary_muscle_group: ex.primary_muscle_group,
        default_sets: defaultSets,
        target_reps: targetReps,
        default_weight_kg: defaultWeightKg,
        sort_order: nextSortOrder,
      });
    } catch {
      setError("追加に失敗しました");
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-2 text-xs">読み込み中...</p>;
  }

  if (exercises.length === 0) {
    return <p className="text-muted-foreground py-2 text-xs">追加できる種目がありません</p>;
  }

  return (
    <div className="border-border mt-2 flex flex-col gap-2 rounded-md border p-3">
      <p className="text-sm font-medium">種目を追加</p>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">種目</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border-border bg-background text-foreground rounded-md border px-2 py-1 text-sm w-full"
        >
          <option value="">選択してください</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">セット数</span>
          <input
            type="number"
            min="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className={inputClass}
            placeholder="例: 3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">目標rep</span>
          <input
            type="number"
            min="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className={inputClass}
            placeholder="例: 10"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">目安重量(kg)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
            placeholder="例: 60"
          />
        </label>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "追加中..." : "追加"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
