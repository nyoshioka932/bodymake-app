import { createClient } from "@/lib/supabase/client";

export interface AlertSettings {
  weight_gain_threshold_kg: number | null;
  fat_mass_stagnation_days: number | null;
  fat_mass_stagnation_threshold_kg: number | null;
  calorie_balance_threshold_kcal: number | null;
  protein_shortage_days: number;
  chest_weekly_sets_target: number | null;
  back_weekly_sets_target: number | null;
  shoulder_weekly_sets_target: number | null;
}

export interface FullGoals {
  protein_g: number | null;
  fat_g: number | null;
  calorie_target_kcal: number | null;
  target_body_fat_pct: number | null;
}

export async function fetchAlertSettings(): Promise<AlertSettings | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("alert_settings")
    .select(
      "weight_gain_threshold_kg, fat_mass_stagnation_days, fat_mass_stagnation_threshold_kg, calorie_balance_threshold_kcal, protein_shortage_days, chest_weekly_sets_target, back_weekly_sets_target, shoulder_weekly_sets_target"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    weight_gain_threshold_kg: (data.weight_gain_threshold_kg as number | null) ?? null,
    fat_mass_stagnation_days: (data.fat_mass_stagnation_days as number | null) ?? null,
    fat_mass_stagnation_threshold_kg: (data.fat_mass_stagnation_threshold_kg as number | null) ?? null,
    calorie_balance_threshold_kcal: (data.calorie_balance_threshold_kcal as number | null) ?? null,
    protein_shortage_days: (data.protein_shortage_days as number) ?? 3,
    chest_weekly_sets_target: (data.chest_weekly_sets_target as number | null) ?? null,
    back_weekly_sets_target: (data.back_weekly_sets_target as number | null) ?? null,
    shoulder_weekly_sets_target: (data.shoulder_weekly_sets_target as number | null) ?? null,
  };
}

export async function fetchFullGoals(): Promise<FullGoals | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("goals")
    .select("protein_g, fat_g, calorie_target_kcal, target_body_fat_pct")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    protein_g: (data.protein_g as number | null) ?? null,
    fat_g: (data.fat_g as number | null) ?? null,
    calorie_target_kcal: (data.calorie_target_kcal as number | null) ?? null,
    target_body_fat_pct: (data.target_body_fat_pct as number | null) ?? null,
  };
}
