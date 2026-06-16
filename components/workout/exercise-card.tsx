"use client";

import { useEffect, useState } from "react";
import { SetInputForm } from "@/components/workout/set-input-form";
import { Button } from "@/components/ui/button";
import {
  fetchPreviousSetValues,
  fetchExerciseGrowthData,
} from "@/lib/workout/set-queries";
import { saveWorkoutSet, deleteWorkoutSet } from "@/lib/workout/set-actions";
import type { WorkoutSet, PreviousSetValue, ExerciseGrowthData } from "@/lib/workout/set-queries";

export interface SessionExercise {
  exercise_id: string;
  exercise_name: string;
  exercise_order: number;
  sets: WorkoutSet[];
}

function calcCurrentStats(sets: WorkoutSet[]) {
  const mainSets = sets.filter((s) => s.set_type === "main");
  if (mainSets.length === 0) return null;

  const maxWeight = mainSets.reduce((m, s) => Math.max(m, s.weight_kg ?? 0), 0);
  const maxReps = mainSets.reduce((m, s) => Math.max(m, s.reps ?? 0), 0);
  const totalVolume = mainSets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
  const maxE1RM = mainSets.reduce(
    (m, s) =>
      s.weight_kg !== null && s.reps !== null
        ? Math.max(m, s.weight_kg * (1 + s.reps / 30))
        : m,
    0
  );

  return {
    maxWeight: maxWeight || null,
    maxReps: maxReps || null,
    totalVolume: totalVolume || null,
    maxE1RM: maxE1RM || null,
  };
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
  const [growthData, setGrowthData] = useState<ExerciseGrowthData | null>(null);
  const [showGrowth, setShowGrowth] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchPreviousSetValues(exercise.exercise_id, workoutId),
      fetchExerciseGrowthData(exercise.exercise_id, workoutId),
    ])
      .then(([prev, growth]) => {
        if (cancelled) return;
        setPreviousValue(prev);
        setGrowthData(growth);
      })
      .catch(() => {/* 成長データなしで続行 */});
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

  const currentStats = calcCurrentStats(exercise.sets);
  const lastSession = growthData?.recentSessions[0] ?? null;

  const prevE1RM = lastSession?.maxEstimated1RM ?? null;
  const curE1RM = currentStats?.maxE1RM ?? null;
  const e1rmDiff =
    curE1RM !== null && prevE1RM !== null ? curE1RM - prevE1RM : null;

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">{exercise.exercise_name}</h3>
        {growthData && (
          <button
            type="button"
            className="text-muted-foreground text-xs underline"
            onClick={() => setShowGrowth((v) => !v)}
          >
            {showGrowth ? "成長非表示" : "成長表示"}
          </button>
        )}
      </div>

      {showGrowth && growthData && (
        <div className="border-border mb-2 rounded-md border p-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">PR（推定1RM）</span>
              <span className="text-foreground ml-1 font-medium">
                {growthData.allTimePR1RM !== null
                  ? `${growthData.allTimePR1RM.toFixed(1)} kg`
                  : "ー"}
              </span>
            </div>
            {e1rmDiff !== null && (
              <div>
                <span className="text-muted-foreground">前回比</span>
                <span className={`ml-1 font-medium ${e1rmDiff >= 0 ? "text-foreground" : "text-destructive"}`}>
                  {e1rmDiff >= 0 ? "+" : ""}{e1rmDiff.toFixed(1)} kg
                </span>
              </div>
            )}
            {currentStats && (
              <>
                <div>
                  <span className="text-muted-foreground">今回max</span>
                  <span className="text-foreground ml-1 font-medium">
                    {currentStats.maxWeight ?? "ー"}kg × {currentStats.maxReps ?? "ー"}rep
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">総ボリューム</span>
                  <span className="text-foreground ml-1 font-medium">
                    {currentStats.totalVolume ?? "ー"} kg
                  </span>
                </div>
              </>
            )}
          </div>

          {growthData.recentSessions.length > 0 && (
            <div className="mt-2">
              <p className="text-muted-foreground mb-1 text-xs">直近{growthData.recentSessions.length}回</p>
              <div className="flex gap-3">
                {growthData.recentSessions.map((s) => (
                  <div key={s.date} className="text-xs">
                    <p className="text-muted-foreground">{s.date.slice(5)}</p>
                    <p className="text-foreground font-medium">
                      {s.maxWeight ?? "ー"}×{s.maxReps ?? "ー"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {exercise.sets.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1">
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
