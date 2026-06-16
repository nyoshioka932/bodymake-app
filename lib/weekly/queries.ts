import { createClient } from "@/lib/supabase/client";
import type { BodyCompositionDaily, CalorieIntakePFC } from "@/lib/dashboard/types";

export interface GoalsData {
  protein_g: number | null;
  fat_g: number | null;
}

export async function fetchWeeklyBodyCompositions(
  startDate: string,
  endDate: string
): Promise<BodyCompositionDaily[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("body_compositions")
    .select("date, weight_kg, body_fat_pct, body_fat_kg, muscle_kg")
    .eq("user_id", user.id)
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

export async function fetchWeeklyCalorieIntakePFC(
  startDate: string,
  endDate: string
): Promise<CalorieIntakePFC[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("calorie_intakes")
    .select("date, calories_kcal, protein_g, fat_g, carbs_g")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) throw error;

  // 同一日に複数レコードがある場合は日別に合計する
  const byDate = new Map<string, { cal: number; p: number; f: number; c: number }>();
  for (const row of data ?? []) {
    const date = row.date as string;
    const prev = byDate.get(date) ?? { cal: 0, p: 0, f: 0, c: 0 };
    byDate.set(date, {
      cal: prev.cal + ((row.calories_kcal as number | null) ?? 0),
      p: prev.p + ((row.protein_g as number | null) ?? 0),
      f: prev.f + ((row.fat_g as number | null) ?? 0),
      c: prev.c + ((row.carbs_g as number | null) ?? 0),
    });
  }

  return Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    calories_kcal: v.cal || null,
    protein_g: v.p || null,
    fat_g: v.f || null,
    carbs_g: v.c || null,
  }));
}

export async function fetchGoals(): Promise<GoalsData | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("goals")
    .select("protein_g, fat_g")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    protein_g: (data.protein_g as number | null) ?? null,
    fat_g: (data.fat_g as number | null) ?? null,
  };
}
