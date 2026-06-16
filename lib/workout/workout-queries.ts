import { createClient } from "@/lib/supabase/client";
import type { SplitType, WorkoutSession } from "./types";

export async function fetchInProgressWorkout(): Promise<WorkoutSession | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workouts")
    .select("id, date, split_type, status, memo, started_at, completed_at")
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id as string,
    date: data.date as string,
    split_type: (data.split_type as SplitType | null) ?? null,
    status: "in_progress",
    memo: data.memo as string | null,
    started_at: data.started_at as string | null,
    completed_at: data.completed_at as string | null,
  };
}

export async function fetchLastCompletedWorkout(): Promise<{
  split_type: SplitType | null;
} | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workouts")
    .select("split_type")
    .eq("status", "completed")
    .order("date", { ascending: false })
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return { split_type: (data.split_type as SplitType | null) ?? null };
}
