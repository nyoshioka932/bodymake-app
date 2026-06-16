"use client";

import { useEffect, useState } from "react";
import { AddExerciseToSession } from "@/components/workout/add-exercise-to-session";
import { ExerciseCard, type SessionExercise } from "@/components/workout/exercise-card";
import { Button } from "@/components/ui/button";
import { fetchWorkoutSets } from "@/lib/workout/set-queries";
import type { WorkoutSet } from "@/lib/workout/set-queries";
import type { TemplateExercise } from "@/lib/workout/types";

function buildInitialExercises(
  templateExercises: TemplateExercise[],
  setsByExercise: Map<string, WorkoutSet[]>
): SessionExercise[] {
  const result: SessionExercise[] = [];
  const seen = new Set<string>();

  for (const te of templateExercises) {
    seen.add(te.exercise_id);
    result.push({
      exercise_id: te.exercise_id,
      exercise_name: te.exercise_name,
      exercise_order: te.sort_order,
      sets: setsByExercise.get(te.exercise_id) ?? [],
    });
  }

  // テンプレートにない種目（再開時にDBから取得）
  for (const [exId, sets] of setsByExercise) {
    if (seen.has(exId)) continue;
    const firstSet = sets[0];
    result.push({
      exercise_id: exId,
      exercise_name: "", // 6-4で成長表示とともに名前解決
      exercise_order: firstSet.exercise_order,
      sets,
    });
  }

  return result.sort((a, b) => a.exercise_order - b.exercise_order);
}

export function WorkoutExercises({
  workoutId,
  initialTemplateExercises,
}: {
  workoutId: string;
  initialTemplateExercises: TemplateExercise[];
}) {
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchWorkoutSets(workoutId)
      .then((sets) => {
        if (cancelled) return;
        const byExercise = new Map<string, WorkoutSet[]>();
        for (const s of sets) {
          const prev = byExercise.get(s.exercise_id) ?? [];
          byExercise.set(s.exercise_id, [...prev, s]);
        }
        setExercises(buildInitialExercises(initialTemplateExercises, byExercise));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [workoutId, initialTemplateExercises]);

  const handleSetsChange = (exerciseId: string, sets: WorkoutSet[]) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.exercise_id === exerciseId ? { ...ex, sets } : ex))
    );
  };

  const handleAdd = (exercise: SessionExercise) => {
    setExercises((prev) => [...prev, exercise]);
    setShowAddForm(false);
  };

  if (loading) return <p className="text-muted-foreground p-2 text-sm">読み込み中...</p>;

  const existingIds = exercises.map((ex) => ex.exercise_id);
  const nextOrder =
    exercises.length > 0 ? Math.max(...exercises.map((ex) => ex.exercise_order)) + 10 : 0;

  return (
    <div className="flex flex-col gap-3">
      {exercises.length === 0 && (
        <p className="text-muted-foreground text-sm">種目を追加してください</p>
      )}
      {exercises.map((ex) => (
        <ExerciseCard
          key={ex.exercise_id}
          exercise={ex}
          workoutId={workoutId}
          onSetsChange={handleSetsChange}
        />
      ))}

      {showAddForm ? (
        <AddExerciseToSession
          existingExerciseIds={existingIds}
          nextOrder={nextOrder}
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <Button variant="outline" onClick={() => setShowAddForm(true)}>
          ＋ 種目を追加
        </Button>
      )}
    </div>
  );
}
