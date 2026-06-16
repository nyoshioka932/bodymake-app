import { createClient } from "@/lib/supabase/client";
import type { Exercise, SplitType, TemplateExercise, WorkoutTemplate } from "./types";

export async function fetchTemplates(): Promise<WorkoutTemplate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workout_templates")
    .select("id, name, split_type, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    split_type: row.split_type as SplitType,
    sort_order: row.sort_order as number,
  }));
}

export async function fetchTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workout_template_exercises")
    .select("id, template_id, exercise_id, default_sets, target_reps, default_weight_kg, sort_order, exercise:exercises(name, primary_muscle_group)")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const raw = row.exercise as unknown as
      | { name: string; primary_muscle_group: string }
      | { name: string; primary_muscle_group: string }[]
      | null;
    const ex = Array.isArray(raw) ? raw[0] : raw;
    return {
      id: row.id as string,
      template_id: row.template_id as string,
      exercise_id: row.exercise_id as string,
      exercise_name: ex?.name ?? "",
      primary_muscle_group: (ex?.primary_muscle_group ?? "chest") as SplitType,
      default_sets: row.default_sets as number | null,
      target_reps: row.target_reps as number | null,
      default_weight_kg: row.default_weight_kg as number | null,
      sort_order: row.sort_order as number,
    };
  });
}

export async function fetchAvailableExercises(excludeExerciseIds: string[]): Promise<Exercise[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, primary_muscle_group, is_preset, user_id")
    .order("name", { ascending: true });
  if (error) throw error;

  const excludeSet = new Set(excludeExerciseIds);
  return (data ?? [])
    .filter((row) => !excludeSet.has(row.id as string))
    .map((row) => ({
      id: row.id as string,
      name: row.name as string,
      primary_muscle_group: row.primary_muscle_group as SplitType,
      is_preset: row.is_preset as boolean,
      user_id: row.user_id as string | null,
    }));
}
