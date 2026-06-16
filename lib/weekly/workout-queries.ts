import { createClient } from "@/lib/supabase/client";
import { SPLIT_TYPE_LABELS } from "@/lib/workout/types";
import type { SplitType } from "@/lib/workout/types";

export interface SplitSetCount {
  split: SplitType;
  label: string;
  count: number;
}

export interface ExerciseGrowth {
  exercise_id: string;
  exercise_name: string;
  currentMaxE1RM: number;
  prevMaxE1RM: number | null;
  diffE1RM: number | null;
}

export interface WeeklyWorkoutSummary {
  sessionCount: number;
  splitSetCounts: SplitSetCount[];
  exerciseGrowths: ExerciseGrowth[];
}

export async function fetchWeeklyWorkoutSummary(
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string
): Promise<WeeklyWorkoutSummary> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  // 当週の completed セッション取得
  const { data: sessions, error: sessionsError } = await supabase
    .from("workouts")
    .select("id, split_type")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("date", startDate)
    .lte("date", endDate);
  if (sessionsError) throw sessionsError;

  const workoutIds = (sessions ?? []).map((s) => s.id as string);
  const sessionCount = workoutIds.length;

  if (sessionCount === 0) {
    return { sessionCount: 0, splitSetCounts: [], exerciseGrowths: [] };
  }

  // 当週のメインセット取得（部位別集計 + 種目別推定1RM）
  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("exercise_id, estimated_1rm_kg, exercises(name, primary_muscle_group)")
    .in("workout_id", workoutIds)
    .eq("set_type", "main");
  if (setsError) throw setsError;

  // 部位別セット数集計
  const splitCountMap = new Map<SplitType, number>();
  // 種目別 max 推定1RM（当週）
  const exerciseMaxE1RM = new Map<string, { name: string; e1rm: number }>();

  for (const row of sets ?? []) {
    const exRaw = row.exercises as unknown as { name: string; primary_muscle_group: string } | { name: string; primary_muscle_group: string }[] | null;
    const ex = Array.isArray(exRaw) ? exRaw[0] : exRaw;
    if (!ex) continue;

    const muscle = ex.primary_muscle_group as SplitType;
    splitCountMap.set(muscle, (splitCountMap.get(muscle) ?? 0) + 1);

    const exId = row.exercise_id as string;
    const e1rm = (row.estimated_1rm_kg as number | null) ?? 0;
    const prev = exerciseMaxE1RM.get(exId);
    if (!prev || e1rm > prev.e1rm) {
      exerciseMaxE1RM.set(exId, { name: ex.name, e1rm });
    }
  }

  // 部位別セット数リスト（0件部位は除外）
  const splitSetCounts: SplitSetCount[] = (Object.keys(SPLIT_TYPE_LABELS) as SplitType[])
    .filter((split) => splitCountMap.has(split))
    .map((split) => ({
      split,
      label: SPLIT_TYPE_LABELS[split],
      count: splitCountMap.get(split)!,
    }));

  // 前週の同種目の最高推定1RM取得
  const exerciseIds = Array.from(exerciseMaxE1RM.keys());
  const prevE1RMMap = new Map<string, number>();

  if (exerciseIds.length > 0) {
    // 前週の completed セッション取得
    const { data: prevSessions, error: prevSessErr } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("date", prevStartDate)
      .lte("date", prevEndDate);
    if (prevSessErr) throw prevSessErr;

    const prevWorkoutIds = (prevSessions ?? []).map((s) => s.id as string);

    if (prevWorkoutIds.length > 0) {
      const { data: prevSets, error: prevSetsErr } = await supabase
        .from("workout_sets")
        .select("exercise_id, estimated_1rm_kg")
        .in("workout_id", prevWorkoutIds)
        .in("exercise_id", exerciseIds)
        .eq("set_type", "main");
      if (prevSetsErr) throw prevSetsErr;

      for (const row of prevSets ?? []) {
        const exId = row.exercise_id as string;
        const e1rm = (row.estimated_1rm_kg as number | null) ?? 0;
        const prev = prevE1RMMap.get(exId) ?? 0;
        if (e1rm > prev) prevE1RMMap.set(exId, e1rm);
      }
    }
  }

  // 種目別成長リスト（当週に記録あり、かつ前週比プラスまたは前週なし）
  const exerciseGrowths: ExerciseGrowth[] = Array.from(exerciseMaxE1RM.entries())
    .map(([exId, { name, e1rm }]) => {
      const prev = prevE1RMMap.get(exId) ?? null;
      const diff = prev !== null ? e1rm - prev : null;
      return {
        exercise_id: exId,
        exercise_name: name,
        currentMaxE1RM: e1rm,
        prevMaxE1RM: prev,
        diffE1RM: diff,
      };
    })
    .filter((g) => g.currentMaxE1RM > 0 && (g.diffE1RM === null || g.diffE1RM > 0))
    .sort((a, b) => (b.diffE1RM ?? 0) - (a.diffE1RM ?? 0));

  return { sessionCount, splitSetCounts, exerciseGrowths };
}
