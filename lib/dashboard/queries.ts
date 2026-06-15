import { createClient } from "@/lib/supabase/server";
import type { BodyCompositionDaily, CalorieDaily, CalorieIntakePFC, MuscleGroupSetCount, MuscleGroupSets } from "./types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function fetchBodyCompositions(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<BodyCompositionDaily[]> {
  const { data, error } = await supabase
    .from("body_compositions")
    .select("date, weight_kg, body_fat_pct, body_fat_kg, muscle_kg")
    .eq("user_id", userId)
    .eq("is_representative", true)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    date: row.date as string,
    weight_kg: row.weight_kg as number | null,
    body_fat_pct: row.body_fat_pct as number | null,
    body_fat_kg: row.body_fat_kg as number | null,
    muscle_kg: row.muscle_kg as number | null,
  }));
}

export async function fetchCalorieDaily(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalorieDaily[]> {
  const [intakesResult, burnsResult] = await Promise.all([
    supabase
      .from("calorie_intakes")
      .select("date, calories_kcal")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("calorie_burns")
      .select("date, adjusted_calories_kcal")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate),
  ]);
  if (intakesResult.error) throw intakesResult.error;
  if (burnsResult.error) throw burnsResult.error;

  const caloriesByDate = new Map<string, number>();
  for (const row of intakesResult.data ?? []) {
    const date = row.date as string;
    const value = row.calories_kcal as number | null;
    if (value === null) continue;
    caloriesByDate.set(date, (caloriesByDate.get(date) ?? 0) + value);
  }

  const adjustedByDate = new Map<string, number>();
  for (const row of burnsResult.data ?? []) {
    const date = row.date as string;
    const value = row.adjusted_calories_kcal as number | null;
    if (value === null) continue;
    adjustedByDate.set(date, (adjustedByDate.get(date) ?? 0) + value);
  }

  const dates = new Set<string>([...caloriesByDate.keys(), ...adjustedByDate.keys()]);

  return Array.from(dates).map((date) => ({
    date,
    calories_kcal: caloriesByDate.get(date) ?? null,
    adjusted_calories_kcal: adjustedByDate.get(date) ?? null,
  }));
}

export async function fetchCalorieIntakePFC(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalorieIntakePFC[]> {
  const { data, error } = await supabase
    .from("calorie_intakes")
    .select("date, calories_kcal, protein_g, fat_g, carbs_g")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    date: row.date as string,
    calories_kcal: row.calories_kcal as number | null,
    protein_g: row.protein_g as number | null,
    fat_g: row.fat_g as number | null,
    carbs_g: row.carbs_g as number | null,
  }));
}

export async function fetchCompletedWorkoutCount(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) throw error;

  return count ?? 0;
}

const TARGET_MUSCLE_GROUPS: { key: "chest" | "back" | "shoulder"; label: string }[] = [
  { key: "chest", label: "胸" },
  { key: "back", label: "背中" },
  { key: "shoulder", label: "肩" },
];

const ALL_MUSCLE_GROUPS: { key: "chest" | "back" | "shoulder" | "legs"; label: string }[] = [
  ...TARGET_MUSCLE_GROUPS,
  { key: "legs", label: "脚" },
];

export async function fetchMuscleGroupSetCounts(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<MuscleGroupSetCount[]> {
  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);
  if (workoutsError) throw workoutsError;

  const workoutIds = (workouts ?? []).map((row) => row.id as string);

  const actualByMuscleGroup = new Map<string, number>();
  if (workoutIds.length > 0) {
    const { data: sets, error: setsError } = await supabase
      .from("workout_sets")
      .select("exercise:exercises(primary_muscle_group)")
      .eq("user_id", userId)
      .eq("is_effective", true)
      .in("workout_id", workoutIds);
    if (setsError) throw setsError;

    for (const row of sets ?? []) {
      const exercise = row.exercise as unknown as { primary_muscle_group: string } | { primary_muscle_group: string }[] | null;
      const muscleGroup = Array.isArray(exercise) ? exercise[0]?.primary_muscle_group : exercise?.primary_muscle_group;
      if (!muscleGroup) continue;
      actualByMuscleGroup.set(muscleGroup, (actualByMuscleGroup.get(muscleGroup) ?? 0) + 1);
    }
  }

  return ALL_MUSCLE_GROUPS.map(({ key, label }) => ({
    muscleGroup: key,
    label,
    actualSets: actualByMuscleGroup.get(key) ?? 0,
  }));
}

async function fetchWeeklySetTargets(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<"chest" | "back" | "shoulder", number | null>> {
  const { data: alertSettings, error: alertSettingsError } = await supabase
    .from("alert_settings")
    .select("chest_weekly_sets_target, back_weekly_sets_target, shoulder_weekly_sets_target")
    .eq("user_id", userId)
    .maybeSingle();
  if (alertSettingsError) throw alertSettingsError;

  return {
    chest: (alertSettings?.chest_weekly_sets_target as number | null) ?? null,
    back: (alertSettings?.back_weekly_sets_target as number | null) ?? null,
    shoulder: (alertSettings?.shoulder_weekly_sets_target as number | null) ?? null,
  };
}

export async function fetchMuscleGroupSets(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<MuscleGroupSets[]> {
  const [counts, targets] = await Promise.all([
    fetchMuscleGroupSetCounts(supabase, userId, startDate, endDate),
    fetchWeeklySetTargets(supabase, userId),
  ]);

  const countByMuscleGroup = new Map(counts.map((c) => [c.muscleGroup, c.actualSets]));

  return TARGET_MUSCLE_GROUPS.map(({ key, label }) => ({
    muscleGroup: key,
    label,
    actualSets: countByMuscleGroup.get(key) ?? 0,
    targetSets: targets[key],
  }));
}
