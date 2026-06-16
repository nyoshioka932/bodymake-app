import { createClient } from "@/lib/supabase/client";
import { formatDateJST } from "@/lib/dashboard/calculations";
import type { SplitType, WorkoutSession } from "./types";

export async function createWorkout(splitType: SplitType | null): Promise<WorkoutSession> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const today = formatDateJST(new Date());
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      date: today,
      split_type: splitType,
      status: "in_progress",
      started_at: now,
    })
    .select("id, date, split_type, status, memo, started_at, completed_at")
    .single();
  if (error) throw error;

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

export async function completeWorkout(id: string): Promise<void> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("workouts")
    .update({ status: "completed", completed_at: now })
    .eq("id", id);
  if (error) throw error;
}

export async function discardWorkout(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("workouts").update({ status: "discarded" }).eq("id", id);
  if (error) throw error;
}

export async function updateWorkoutMemo(id: string, memo: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("workouts").update({ memo: memo || null }).eq("id", id);
  if (error) throw error;
}
