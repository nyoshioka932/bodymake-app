import { getTodayJST } from "@/lib/dashboard/calculations";
import type { BodyCompositionDaily, CalorieIntakePFC } from "@/lib/dashboard/types";
import { fetchWeeklyBodyCompositions, fetchWeeklyCalorieIntakePFC } from "@/lib/weekly/queries";
import { fetchWeeklyWorkoutSummary } from "@/lib/weekly/workout-queries";
import type { SplitSetCount } from "@/lib/weekly/workout-queries";
import { fetchAlertSettings, fetchFullGoals } from "@/lib/weekly/action-queries";
import type { AlertSettings, FullGoals } from "@/lib/weekly/action-queries";

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface AlertData {
  bodyLast7: BodyCompositionDaily[];
  bodyPrev7: BodyCompositionDaily[];
  pfcRows7: CalorieIntakePFC[];
  splitSetCounts: SplitSetCount[];
  goals: FullGoals | null;
  alertSettings: AlertSettings | null;
}

export async function fetchAlertData(): Promise<AlertData> {
  const today = getTodayJST();
  const endDate = today;
  const startDate = addDays(today, -6);
  const prevEndDate = addDays(today, -7);
  const prevStartDate = addDays(today, -13);

  const [body7, bodyPrev7, pfc7, workoutSummary, goals, alertSettings] = await Promise.all([
    fetchWeeklyBodyCompositions(startDate, endDate),
    fetchWeeklyBodyCompositions(prevStartDate, prevEndDate),
    fetchWeeklyCalorieIntakePFC(startDate, endDate),
    fetchWeeklyWorkoutSummary(startDate, endDate, prevStartDate, prevEndDate),
    fetchFullGoals(),
    fetchAlertSettings(),
  ]);

  return {
    bodyLast7: body7,
    bodyPrev7: bodyPrev7,
    pfcRows7: pfc7,
    splitSetCounts: workoutSummary.splitSetCounts,
    goals,
    alertSettings,
  };
}
