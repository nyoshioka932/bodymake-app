import { createClient } from "@/lib/supabase/client";

export interface BodyCompositionRecord {
  id: string;
  measured_at: string;
  date: string;
  is_representative: boolean;
  weight_kg: number | null;
  body_fat_pct: number | null;
  body_fat_kg: number | null;
  muscle_kg: number | null;
}

export interface CalorieIntakeRecord {
  id: string;
  date: string;
  calories_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  source: string;
}

export async function fetchBodyCompositions(limit = 50): Promise<BodyCompositionRecord[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("body_compositions")
    .select("id, measured_at, date, is_representative, weight_kg, body_fat_pct, body_fat_kg, muscle_kg")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    measured_at: row.measured_at as string,
    date: row.date as string,
    is_representative: row.is_representative as boolean,
    weight_kg: row.weight_kg as number | null,
    body_fat_pct: row.body_fat_pct as number | null,
    body_fat_kg: row.body_fat_kg as number | null,
    muscle_kg: row.muscle_kg as number | null,
  }));
}

export async function fetchCalorieIntakes(limit = 50): Promise<CalorieIntakeRecord[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("calorie_intakes")
    .select("id, date, calories_kcal, protein_g, fat_g, carbs_g, source")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    date: row.date as string,
    calories_kcal: row.calories_kcal as number | null,
    protein_g: row.protein_g as number | null,
    fat_g: row.fat_g as number | null,
    carbs_g: row.carbs_g as number | null,
    source: row.source as string,
  }));
}
