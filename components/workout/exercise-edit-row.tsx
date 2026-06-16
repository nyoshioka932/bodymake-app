"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteTemplateExercise, updateTemplateExercise } from "@/lib/workout/template-actions";
import type { TemplateExercise } from "@/lib/workout/types";

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

export function ExerciseEditRow({
  exercise,
  onUpdated,
  onDeleted,
}: {
  exercise: TemplateExercise;
  onUpdated: (updated: TemplateExercise) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState(exercise.default_sets?.toString() ?? "");
  const [reps, setReps] = useState(exercise.target_reps?.toString() ?? "");
  const [weight, setWeight] = useState(exercise.default_weight_kg?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const defaultSets = parseIntOrNull(sets);
      const targetReps = parseIntOrNull(reps);
      const defaultWeightKg = parseFloatOrNull(weight);
      await updateTemplateExercise({ id: exercise.id, defaultSets, targetReps, defaultWeightKg });
      onUpdated({ ...exercise, default_sets: defaultSets, target_reps: targetReps, default_weight_kg: defaultWeightKg });
      setEditing(false);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSets(exercise.default_sets?.toString() ?? "");
    setReps(exercise.target_reps?.toString() ?? "");
    setWeight(exercise.default_weight_kg?.toString() ?? "");
    setEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!confirm(`「${exercise.exercise_name}」をテンプレートから削除しますか？`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteTemplateExercise(exercise.id);
      onDeleted(exercise.id);
    } catch {
      setError("削除に失敗しました");
      setDeleting(false);
    }
  };

  return (
    <div className="text-foreground border-border border-b py-2 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground text-sm font-medium">{exercise.exercise_name}</span>
        <div className="flex gap-1">
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              編集
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting}>
            削除
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
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
              {saving ? "保存中..." : "保存"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-0.5 text-xs">
          {exercise.default_sets ?? "ー"}セット ×{" "}
          {exercise.target_reps ?? "ー"}rep /{" "}
          {exercise.default_weight_kg ?? "ー"}kg
        </p>
      )}
    </div>
  );
}
