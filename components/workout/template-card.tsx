"use client";

import { useEffect, useState } from "react";
import { AddExerciseForm } from "@/components/workout/add-exercise-form";
import { ExerciseEditRow } from "@/components/workout/exercise-edit-row";
import { Button } from "@/components/ui/button";
import { fetchTemplateExercises } from "@/lib/workout/template-queries";
import type { TemplateExercise, WorkoutTemplate } from "@/lib/workout/types";
import { SPLIT_TYPE_LABELS } from "@/lib/workout/types";

export function TemplateCard({ template }: { template: WorkoutTemplate }) {
  const [expanded, setExpanded] = useState(false);
  // null = not yet fetched; [] = fetched but empty
  const [exercises, setExercises] = useState<TemplateExercise[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!expanded || exercises !== null) return;

    let cancelled = false;
    fetchTemplateExercises(template.id)
      .then((data) => { if (!cancelled) setExercises(data); })
      .catch(() => { if (!cancelled) setFetchError("種目の読み込みに失敗しました"); });

    return () => { cancelled = true; };
  }, [expanded, exercises, template.id]);

  const handleUpdated = (updated: TemplateExercise) => {
    setExercises((prev) => prev?.map((ex) => (ex.id === updated.id ? updated : ex)) ?? null);
  };

  const handleDeleted = (id: string) => {
    setExercises((prev) => prev?.filter((ex) => ex.id !== id) ?? null);
  };

  const handleAdded = (exercise: TemplateExercise) => {
    setExercises((prev) => (prev ? [...prev, exercise] : [exercise]));
    setShowAddForm(false);
  };

  const isLoading = expanded && exercises === null && fetchError === null;
  const existingExerciseIds = exercises?.map((ex) => ex.exercise_id) ?? [];
  const nextSortOrder =
    exercises && exercises.length > 0
      ? Math.max(...exercises.map((ex) => ex.sort_order)) + 10
      : 0;

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <h2 className="text-sm font-semibold">{template.name}</h2>
          <span className="text-muted-foreground text-xs">{SPLIT_TYPE_LABELS[template.split_type]}</span>
        </div>
        <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-3">
          {isLoading && <p className="text-muted-foreground text-xs">読み込み中...</p>}
          {fetchError && <p className="text-destructive text-xs">{fetchError}</p>}
          {exercises !== null && exercises.length === 0 && (
            <p className="text-muted-foreground text-xs">種目が登録されていません</p>
          )}
          {exercises !== null &&
            exercises.map((ex) => (
              <ExerciseEditRow
                key={ex.id}
                exercise={ex}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}

          {showAddForm ? (
            <AddExerciseForm
              templateId={template.id}
              existingExerciseIds={existingExerciseIds}
              nextSortOrder={nextSortOrder}
              onAdded={handleAdded}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
                ＋ 種目を追加
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
