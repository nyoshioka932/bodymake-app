import { createClient } from "@/lib/supabase/client";

export interface WorkoutSet {
  id: string;
  exercise_id: string;
  exercise_order: number;
  set_number: number;
  set_type: "warmup" | "main";
  weight_kg: number | null;
  reps: number | null;
}

export interface PreviousSetValue {
  weight_kg: number | null;
  reps: number | null;
}

export async function fetchWorkoutSets(workoutId: string): Promise<WorkoutSet[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workout_sets")
    .select("id, exercise_id, exercise_order, set_number, set_type, weight_kg, reps")
    .eq("workout_id", workoutId)
    .order("exercise_order", { ascending: true })
    .order("set_number", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    exercise_id: row.exercise_id as string,
    exercise_order: row.exercise_order as number,
    set_number: row.set_number as number,
    set_type: row.set_type as "warmup" | "main",
    weight_kg: row.weight_kg as number | null,
    reps: row.reps as number | null,
  }));
}

// 前セッションの同一種目の最後の有効セット（重量/reps）を前回値として返す
export async function fetchPreviousSetValues(
  exerciseId: string,
  currentWorkoutId: string
): Promise<PreviousSetValue | null> {
  const supabase = createClient();

  const { data: prevWorkout, error: prevError } = await supabase
    .from("workouts")
    .select("id")
    .eq("status", "completed")
    .neq("id", currentWorkoutId)
    .order("date", { ascending: false })
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (prevError) throw prevError;
  if (!prevWorkout) return null;

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("weight_kg, reps")
    .eq("workout_id", prevWorkout.id as string)
    .eq("exercise_id", exerciseId)
    .eq("set_type", "main")
    .order("set_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (setsError) throw setsError;
  if (!sets) return null;

  return {
    weight_kg: sets.weight_kg as number | null,
    reps: sets.reps as number | null,
  };
}
