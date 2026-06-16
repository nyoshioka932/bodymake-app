import { createClient } from "@/lib/supabase/client";

export interface AlertSettingsFormData {
  weight_gain_threshold_kg: number | null;
  protein_shortage_days: number;
  chest_weekly_sets_target: number | null;
  back_weekly_sets_target: number | null;
  shoulder_weekly_sets_target: number | null;
}

export async function fetchAlertSettingsFormData(): Promise<AlertSettingsFormData | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("alert_settings")
    .select(
      "weight_gain_threshold_kg, protein_shortage_days, chest_weekly_sets_target, back_weekly_sets_target, shoulder_weekly_sets_target"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  return {
    weight_gain_threshold_kg: (data?.weight_gain_threshold_kg as number | null) ?? null,
    protein_shortage_days: (data?.protein_shortage_days as number) ?? 3,
    chest_weekly_sets_target: (data?.chest_weekly_sets_target as number | null) ?? null,
    back_weekly_sets_target: (data?.back_weekly_sets_target as number | null) ?? null,
    shoulder_weekly_sets_target: (data?.shoulder_weekly_sets_target as number | null) ?? null,
  };
}

export async function upsertAlertSettings(values: AlertSettingsFormData): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const { error } = await supabase
    .from("alert_settings")
    .upsert(
      {
        user_id: user.id,
        weight_gain_threshold_kg: values.weight_gain_threshold_kg,
        protein_shortage_days: values.protein_shortage_days,
        chest_weekly_sets_target: values.chest_weekly_sets_target,
        back_weekly_sets_target: values.back_weekly_sets_target,
        shoulder_weekly_sets_target: values.shoulder_weekly_sets_target,
      },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
