import { KpiCards } from "@/components/dashboard/kpi-cards";
import { buildKpiCards } from "@/lib/dashboard/build-kpis";
import { addDays, calculateNetCaloriesByDate, getDateRange } from "@/lib/dashboard/calculations";
import {
  fetchBodyCompositions,
  fetchCalorieDaily,
  fetchCompletedWorkoutCount,
  fetchMuscleGroupSets,
} from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export async function KpiSection({ userId, today }: { userId: string; today: string }) {
  const supabase = await createClient();

  const last7Dates = getDateRange(today, 7);
  const prev7Dates = getDateRange(addDays(today, -7), 7);
  const startDate = prev7Dates[0];

  const [bodyCompositions, calorieDaily, workoutCount, muscleGroupSets] = await Promise.all([
    fetchBodyCompositions(supabase, userId, startDate, today),
    fetchCalorieDaily(supabase, userId, last7Dates[0], today),
    fetchCompletedWorkoutCount(supabase, userId, last7Dates[0], today),
    fetchMuscleGroupSets(supabase, userId, last7Dates[0], today),
  ]);

  const netCaloriesByDate = calculateNetCaloriesByDate(calorieDaily);

  const kpis = buildKpiCards({
    bodyCompositions,
    netCaloriesByDate,
    last7Dates,
    prev7Dates,
    workoutCount,
    muscleGroupSets,
  });

  return <KpiCards kpis={kpis} />;
}
