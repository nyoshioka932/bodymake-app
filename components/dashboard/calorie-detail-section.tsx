import { MultiSeriesChartClient } from "@/components/dashboard/multi-series-chart-client";
import { buildMovingAverageByDate, getDateRange, mergeSeries, pickValuesByDate } from "@/lib/dashboard/calculations";
import { fetchCalorieDaily } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

const DISPLAY_DAYS = 30;
const LOOKBACK_DAYS = 6;

export async function CalorieDetailSection({ userId, today }: { userId: string; today: string }) {
  const supabase = await createClient();

  const allDates = getDateRange(today, DISPLAY_DAYS + LOOKBACK_DAYS);
  const displayDates = allDates.slice(LOOKBACK_DAYS);
  const startDate = allDates[0];

  const calorieDaily = await fetchCalorieDaily(supabase, userId, startDate, today);

  const intakeMA = buildMovingAverageByDate(allDates, displayDates, pickValuesByDate(calorieDaily, "calories_kcal"));
  const burnMA = buildMovingAverageByDate(
    allDates,
    displayDates,
    pickValuesByDate(calorieDaily, "adjusted_calories_kcal")
  );

  const data = mergeSeries(displayDates, { intake: intakeMA, burn: burnMA });

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">カロリー（7日移動平均）</h2>
      <MultiSeriesChartClient
        data={data}
        lines={[
          { dataKey: "intake", name: "摂取kcal", color: "var(--chart-2)" },
          { dataKey: "burn", name: "消費kcal（補正後）", color: "var(--chart-4)" },
        ]}
      />
    </section>
  );
}
