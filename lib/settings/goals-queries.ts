import { createClient } from "@/lib/supabase/client";

export interface GoalsFormData {
  protein_g: number | null;
  fat_g: number | null;
  calorie_target_kcal: number | null;
  target_body_fat_pct: number | null;
  weekly_weight_loss_target_kg: number | null;
}

export async function fetchGoalsFormData(): Promise<GoalsFormData | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("goals")
    .select("protein_g, fat_g, calorie_target_kcal, target_body_fat_pct, weekly_weight_loss_target_kg")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  return {
    protein_g: (data?.protein_g as number | null) ?? null,
    fat_g: (data?.fat_g as number | null) ?? null,
    calorie_target_kcal: (data?.calorie_target_kcal as number | null) ?? null,
    target_body_fat_pct: (data?.target_body_fat_pct as number | null) ?? null,
    weekly_weight_loss_target_kg: (data?.weekly_weight_loss_target_kg as number | null) ?? null,
  };
}

export async function upsertGoals(values: GoalsFormData): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const { error } = await supabase
    .from("goals")
    .upsert(
      {
        user_id: user.id,
        protein_g: values.protein_g,
        fat_g: values.fat_g,
        calorie_target_kcal: values.calorie_target_kcal,
        target_body_fat_pct: values.target_body_fat_pct,
        weekly_weight_loss_target_kg: values.weekly_weight_loss_target_kg,
      },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
