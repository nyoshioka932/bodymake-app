import { createClient } from "@/lib/supabase/client";
import type { WorkoutSet } from "./set-queries";

function calcVolumeKg(weightKg: number | null, reps: number | null): number | null {
  if (weightKg === null || reps === null) return null;
  return weightKg * reps;
}

// エプリー式: weight × (1 + reps / 30)
function calcEstimated1RM(weightKg: number | null, reps: number | null): number | null {
  if (weightKg === null || reps === null || reps <= 0) return null;
  return weightKg * (1 + reps / 30);
}

export async function saveWorkoutSet({
  workoutId,
  exerciseId,
  exerciseOrder,
  setNumber,
  setType,
  weightKg,
  reps,
}: {
  workoutId: string;
  exerciseId: string;
  exerciseOrder: number;
  setNumber: number;
  setType: "warmup" | "main";
  weightKg: number | null;
  reps: number | null;
}): Promise<WorkoutSet> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const isEffective = setType === "main";
  const volumeKg = calcVolumeKg(weightKg, reps);
  const estimated1rm = calcEstimated1RM(weightKg, reps);

  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      user_id: user.id,
      workout_id: workoutId,
      exercise_id: exerciseId,
      exercise_order: exerciseOrder,
      set_number: setNumber,
      set_type: setType,
      weight_kg: weightKg,
      reps,
      volume_kg: volumeKg,
      estimated_1rm_kg: estimated1rm,
      is_effective: isEffective,
    })
    .select("id, exercise_id, exercise_order, set_number, set_type, weight_kg, reps")
    .single();
  if (error) throw error;

  return {
    id: data.id as string,
    exercise_id: data.exercise_id as string,
    exercise_order: data.exercise_order as number,
    set_number: data.set_number as number,
    set_type: data.set_type as "warmup" | "main",
    weight_kg: data.weight_kg as number | null,
    reps: data.reps as number | null,
  };
}

export async function deleteWorkoutSet(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("workout_sets").delete().eq("id", id);
  if (error) throw error;
}
