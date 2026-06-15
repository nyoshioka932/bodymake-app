import { average, getDateRange } from "@/lib/dashboard/calculations";
import {
  fetchCalorieIntakePFC,
  fetchCompletedWorkoutCount,
  fetchMuscleGroupSetCounts,
} from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

function formatNumber(value: number | null, decimals: number): string {
  if (value === null) return "ー";
  return value.toFixed(decimals);
}

export async function WeeklySummarySection({ userId, today }: { userId: string; today: string }) {
  const supabase = await createClient();
  const last7Dates = getDateRange(today, 7);
  const startDate = last7Dates[0];

  const [pfcRows, workoutCount, muscleGroupSetCounts] = await Promise.all([
    fetchCalorieIntakePFC(supabase, userId, startDate, today),
    fetchCompletedWorkoutCount(supabase, userId, startDate, today),
    fetchMuscleGroupSetCounts(supabase, userId, startDate, today),
  ]);

  const avgCalories = average(pfcRows.map((row) => row.calories_kcal));
  const avgProtein = average(pfcRows.map((row) => row.protein_g));
  const avgFat = average(pfcRows.map((row) => row.fat_g));
  const avgCarbs = average(pfcRows.map((row) => row.carbs_g));

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">直近7日サマリー</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">摂取カロリー平均</dt>
          <dd className="font-medium">
            {formatNumber(avgCalories, 0)} <span className="text-muted-foreground text-xs">kcal/日</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">筋トレ回数</dt>
          <dd className="font-medium">
            {workoutCount} <span className="text-muted-foreground text-xs">回</span>
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground text-xs">PFC平均（g/日）</dt>
          <dd className="font-medium">
            P {formatNumber(avgProtein, 0)} ・ F {formatNumber(avgFat, 0)} ・ C {formatNumber(avgCarbs, 0)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground text-xs">部位別セット数</dt>
          <dd className="font-medium">
            {muscleGroupSetCounts.map((m) => `${m.label} ${m.actualSets}`).join(" ・ ")}
          </dd>
        </div>
      </dl>
    </section>
  );
}
