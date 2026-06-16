import { createClient } from "@/lib/supabase/client";

export interface RecordedExercise {
  id: string;
  name: string;
}

export interface E1RMPoint {
  date: string;
  e1rm: number;
}

export async function fetchRecordedExercises(): Promise<RecordedExercise[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // ユーザーが completed セッションに記録した種目を重複なく取得
  const { data: workouts, error: wErr } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "completed");
  if (wErr) throw wErr;

  const workoutIds = (workouts ?? []).map((w) => w.id as string);
  if (workoutIds.length === 0) return [];

  const { data: sets, error: sErr } = await supabase
    .from("workout_sets")
    .select("exercise_id, exercises(id, name)")
    .in("workout_id", workoutIds)
    .eq("set_type", "main");
  if (sErr) throw sErr;

  const seen = new Map<string, string>();
  for (const row of sets ?? []) {
    const exRaw = row.exercises as unknown as { id: string; name: string } | { id: string; name: string }[] | null;
    const ex = Array.isArray(exRaw) ? exRaw[0] : exRaw;
    if (!ex || seen.has(ex.id)) continue;
    seen.set(ex.id, ex.name);
  }

  return Array.from(seen.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export async function fetchExerciseE1RMHistory(exerciseId: string): Promise<E1RMPoint[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: workouts, error: wErr } = await supabase
    .from("workouts")
    .select("id, date")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("date", { ascending: true });
  if (wErr) throw wErr;

  const workoutIds = (workouts ?? []).map((w) => w.id as string);
  const dateByWorkoutId = new Map((workouts ?? []).map((w) => [w.id as string, w.date as string]));

  if (workoutIds.length === 0) return [];

  const { data: sets, error: sErr } = await supabase
    .from("workout_sets")
    .select("workout_id, estimated_1rm_kg")
    .in("workout_id", workoutIds)
    .eq("exercise_id", exerciseId)
    .eq("set_type", "main")
    .not("estimated_1rm_kg", "is", null);
  if (sErr) throw sErr;

  // ワークアウトごとに最高e1RMを集計
  const maxByWorkout = new Map<string, number>();
  for (const row of sets ?? []) {
    const wid = row.workout_id as string;
    const e1rm = row.estimated_1rm_kg as number;
    const prev = maxByWorkout.get(wid) ?? 0;
    if (e1rm > prev) maxByWorkout.set(wid, e1rm);
  }

  return Array.from(maxByWorkout.entries())
    .map(([wid, e1rm]) => ({ date: dateByWorkoutId.get(wid)!, e1rm }))
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}
