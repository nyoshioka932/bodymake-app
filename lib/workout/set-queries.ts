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

export interface RecentSession {
  date: string;
  maxWeight: number | null;
  maxReps: number | null;
  maxEstimated1RM: number | null;
}

export interface ExerciseGrowthData {
  recentSessions: RecentSession[]; // 直近最大3回
  allTimePR1RM: number | null;
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

export async function fetchExerciseGrowthData(
  exerciseId: string,
  currentWorkoutId: string
): Promise<ExerciseGrowthData> {
  const supabase = createClient();

  const [recentWorkoutsResult, prResult] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, date")
      .eq("status", "completed")
      .neq("id", currentWorkoutId)
      .order("date", { ascending: false })
      .limit(10),
    supabase
      .from("workout_sets")
      .select("estimated_1rm_kg")
      .eq("exercise_id", exerciseId)
      .eq("set_type", "main")
      .neq("workout_id", currentWorkoutId)
      .order("estimated_1rm_kg", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (recentWorkoutsResult.error) throw recentWorkoutsResult.error;
  if (prResult.error) throw prResult.error;

  const workoutIds = (recentWorkoutsResult.data ?? []).map((w) => w.id as string);
  const dateByWorkoutId = new Map(
    (recentWorkoutsResult.data ?? []).map((w) => [w.id as string, w.date as string])
  );

  const recentSessions: RecentSession[] = [];
  if (workoutIds.length > 0) {
    const { data: sets, error: setsError } = await supabase
      .from("workout_sets")
      .select("workout_id, weight_kg, reps, estimated_1rm_kg")
      .eq("exercise_id", exerciseId)
      .eq("set_type", "main")
      .in("workout_id", workoutIds);
    if (setsError) throw setsError;

    const byWorkout = new Map<string, { weight: number; reps: number; e1rm: number }[]>();
    for (const s of sets ?? []) {
      const wid = s.workout_id as string;
      const entry = byWorkout.get(wid) ?? [];
      entry.push({
        weight: s.weight_kg as number ?? 0,
        reps: s.reps as number ?? 0,
        e1rm: s.estimated_1rm_kg as number ?? 0,
      });
      byWorkout.set(wid, entry);
    }

    for (const [wid, entries] of byWorkout) {
      const date = dateByWorkoutId.get(wid);
      if (!date) continue;
      recentSessions.push({
        date,
        maxWeight: entries.reduce((max, e) => Math.max(max, e.weight), 0) || null,
        maxReps: entries.reduce((max, e) => Math.max(max, e.reps), 0) || null,
        maxEstimated1RM: entries.reduce((max, e) => Math.max(max, e.e1rm), 0) || null,
      });
    }
    recentSessions.sort((a, b) => b.date.localeCompare(a.date));
  }

  return {
    recentSessions: recentSessions.slice(0, 3),
    allTimePR1RM: (prResult.data?.estimated_1rm_kg as number | null) ?? null,
  };
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
