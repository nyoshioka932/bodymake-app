import { createClient } from "@/lib/supabase/client";

export async function addExerciseToTemplate({
  templateId,
  exerciseId,
  defaultSets,
  targetReps,
  defaultWeightKg,
  sortOrder,
}: {
  templateId: string;
  exerciseId: string;
  defaultSets: number | null;
  targetReps: number | null;
  defaultWeightKg: number | null;
  sortOrder: number;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("workout_template_exercises").insert({
    template_id: templateId,
    exercise_id: exerciseId,
    default_sets: defaultSets,
    target_reps: targetReps,
    default_weight_kg: defaultWeightKg,
    sort_order: sortOrder,
  });
  if (error) throw error;
}

export async function updateTemplateExercise({
  id,
  defaultSets,
  targetReps,
  defaultWeightKg,
}: {
  id: string;
  defaultSets: number | null;
  targetReps: number | null;
  defaultWeightKg: number | null;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workout_template_exercises")
    .update({ default_sets: defaultSets, target_reps: targetReps, default_weight_kg: defaultWeightKg })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTemplateExercise(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("workout_template_exercises").delete().eq("id", id);
  if (error) throw error;
}
