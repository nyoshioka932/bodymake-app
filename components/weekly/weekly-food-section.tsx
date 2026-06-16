import { average } from "@/lib/dashboard/calculations";
import type { CalorieIntakePFC } from "@/lib/dashboard/types";
import type { GoalsData } from "@/lib/weekly/queries";

function fmt(v: number | null, decimals: number): string {
  return v !== null ? v.toFixed(decimals) : "ー";
}

export function WeeklyFoodSection({
  rows,
  goals,
}: {
  rows: CalorieIntakePFC[];
  goals: GoalsData | null;
}) {
  const avgCalories = average(rows.map((r) => r.calories_kcal));
  const avgProtein = average(rows.map((r) => r.protein_g));
  const avgFat = average(rows.map((r) => r.fat_g));
  const avgCarbs = average(rows.map((r) => r.carbs_g));

  const proteinAchievementPct =
    avgProtein !== null && goals?.protein_g ? (avgProtein / goals.protein_g) * 100 : null;

  const fatStatus =
    avgFat !== null && goals?.fat_g
      ? avgFat > goals.fat_g
        ? `${fmt(avgFat, 0)}g（目標${goals.fat_g}g 超過）`
        : `${fmt(avgFat, 0)}g（目標内）`
      : null;

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">食事</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">摂取カロリー平均</dt>
          <dd className="text-foreground font-medium">
            {fmt(avgCalories, 0)} <span className="text-muted-foreground text-xs">kcal/日</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">タンパク質達成率</dt>
          <dd className="text-foreground font-medium">
            {proteinAchievementPct !== null
              ? `${fmt(proteinAchievementPct, 0)}%`
              : goals === null
              ? "ー（目標未設定）"
              : "ー"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground text-xs">PFC平均（g/日）</dt>
          <dd className="text-foreground font-medium">
            P {fmt(avgProtein, 0)} ・ F {fmt(avgFat, 0)} ・ C {fmt(avgCarbs, 0)}
          </dd>
        </div>
        {fatStatus && (
          <div className="col-span-2">
            <dt className="text-muted-foreground text-xs">脂質状況</dt>
            <dd className="text-foreground font-medium">{fatStatus}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
