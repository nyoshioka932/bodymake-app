import { average, sumNonNull, toValuesByDate } from "./calculations";
import type { BodyCompositionDaily, KpiCardData, MuscleGroupSets } from "./types";

function formatNumber(value: number | null, decimals: number): string {
  if (value === null) return "ー";
  return value.toFixed(decimals);
}

function formatSigned(value: number | null, decimals: number): string {
  if (value === null) return "ー";
  const formatted = value.toFixed(decimals);
  return value > 0 ? `+${formatted}` : formatted;
}

export function buildKpiCards({
  bodyCompositions,
  netCaloriesByDate,
  last7Dates,
  prev7Dates,
  workoutCount,
  muscleGroupSets,
}: {
  bodyCompositions: BodyCompositionDaily[];
  netCaloriesByDate: Map<string, number | null>;
  last7Dates: string[];
  prev7Dates: string[];
  workoutCount: number;
  muscleGroupSets: MuscleGroupSets[];
}): KpiCardData[] {
  const weightByDate = toValuesByDate(bodyCompositions, "weight_kg");
  const bodyFatPctByDate = toValuesByDate(bodyCompositions, "body_fat_pct");
  const bodyFatKgByDate = toValuesByDate(bodyCompositions, "body_fat_kg");
  const muscleKgByDate = toValuesByDate(bodyCompositions, "muscle_kg");

  const weightAvg = average(last7Dates.map((d) => weightByDate.get(d) ?? null));
  const bodyFatPctAvg = average(last7Dates.map((d) => bodyFatPctByDate.get(d) ?? null));
  const muscleKgAvg = average(last7Dates.map((d) => muscleKgByDate.get(d) ?? null));

  const bodyFatKgAvgCurrent = average(last7Dates.map((d) => bodyFatKgByDate.get(d) ?? null));
  const bodyFatKgAvgPrevious = average(prev7Dates.map((d) => bodyFatKgByDate.get(d) ?? null));
  const bodyFatKgChange =
    bodyFatKgAvgCurrent !== null && bodyFatKgAvgPrevious !== null
      ? bodyFatKgAvgCurrent - bodyFatKgAvgPrevious
      : null;

  const netCaloriesTotal = sumNonNull(last7Dates.map((d) => netCaloriesByDate.get(d) ?? null));

  const totalActualSets = muscleGroupSets.reduce((acc, m) => acc + m.actualSets, 0);
  const totalTargetSets = muscleGroupSets.reduce((acc, m) => acc + (m.targetSets ?? 0), 0);
  const hasTarget = muscleGroupSets.some((m) => m.targetSets !== null && m.targetSets > 0);
  const setsFulfillmentRate = hasTarget && totalTargetSets > 0 ? (totalActualSets / totalTargetSets) * 100 : null;
  const setsBreakdown = muscleGroupSets
    .map((m) => `${m.label} ${m.actualSets}/${m.targetSets ?? "ー"}`)
    .join(" ・ ");

  return [
    {
      key: "weight_avg",
      label: "体重 7日平均",
      value: formatNumber(weightAvg, 1),
      unit: "kg",
    },
    {
      key: "body_fat_pct_avg",
      label: "体脂肪率 7日平均",
      value: formatNumber(bodyFatPctAvg, 1),
      unit: "%",
    },
    {
      key: "body_fat_kg_change",
      label: "体脂肪量変化",
      value: formatSigned(bodyFatKgChange, 1),
      unit: "kg",
      helperText: "前7日平均との差",
    },
    {
      key: "muscle_kg_avg",
      label: "骨格筋量 7日平均",
      value: formatNumber(muscleKgAvg, 1),
      unit: "kg",
    },
    {
      key: "net_calories",
      label: "7日カロリー収支",
      value: formatSigned(netCaloriesTotal, 0),
      unit: "kcal",
      helperText: netCaloriesTotal === null ? undefined : netCaloriesTotal < 0 ? "減量方向" : "余剰方向",
    },
    {
      key: "workout_count",
      label: "筋トレ回数",
      value: String(workoutCount),
      unit: "回",
      helperText: "直近7日",
    },
    {
      key: "sets_fulfillment",
      label: "セット充足率",
      value: formatNumber(setsFulfillmentRate, 0),
      unit: "%",
      helperText: setsBreakdown,
    },
  ];
}
