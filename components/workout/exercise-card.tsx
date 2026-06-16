"use client";

import { useEffect, useState } from "react";
import { SetInputForm } from "@/components/workout/set-input-form";
import { Button } from "@/components/ui/button";
import { fetchPreviousSetValues } from "@/lib/workout/set-queries";
import { saveWorkoutSet, deleteWorkoutSet } from "@/lib/workout/set-actions";
import type { WorkoutSet, PreviousSetValue } from "@/lib/workout/set-queries";

export interface SessionExercise {
  exercise_id: string;
  exercise_name: string;
  exercise_order: number;
  sets: WorkoutSet[];
}

export function ExerciseCard({
  exercise,
  workoutId,
  onSetsChange,
}: {
  exercise: SessionExercise;
  workoutId: string;
  onSetsChange: (exerciseId: string, sets: WorkoutSet[]) => void;
}) {
  const [previousValue, setPreviousValue] = useState<PreviousSetValue | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPreviousSetValues(exercise.exercise_id, workoutId)
      .then((v) => { if (!cancelled) setPreviousValue(v); })
      .catch(() => {/* 前回値なしで続行 */});
    return () => { cancelled = true; };
  }, [exercise.exercise_id, workoutId]);

  const handleSave = async (setType: "warmup" | "main", weightKg: number | null, repsVal: number | null) => {
    const nextSetNumber = exercise.sets.length + 1;
    const saved = await saveWorkoutSet({
      workoutId,
      exerciseId: exercise.exercise_id,
      exerciseOrder: exercise.exercise_order,
      setNumber: nextSetNumber,
      setType,
      weightKg,
      reps: repsVal,
    });
    onSetsChange(exercise.exercise_id, [...exercise.sets, saved]);
  };

  const handleDelete = async (setId: string) => {
    await deleteWorkoutSet(setId);
    onSetsChange(
      exercise.exercise_id,
      exercise.sets.filter((s) => s.id !== setId)
    );
  };

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h3 className="text-foreground text-sm font-semibold">{exercise.exercise_name}</h3>

      {exercise.sets.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {exercise.sets.map((s) => (
            <li key={s.id} className="flex items-center justify-between">
              <span className="text-foreground text-xs">
                {s.set_type === "main" ? "メイン" : "WU"} {s.set_number}: {s.weight_kg ?? "ー"}kg × {s.reps ?? "ー"}rep
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(s.id)}
                className="h-6 px-1.5 text-xs"
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}

      <SetInputForm
        setNumber={exercise.sets.length + 1}
        previousValue={previousValue}
        onSave={handleSave}
      />
    </section>
  );
}
