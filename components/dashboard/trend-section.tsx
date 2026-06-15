import { TrendChartClient } from "@/components/dashboard/trend-chart-client";
import { buildTrendSeries, getDateRange, toValuesByDate } from "@/lib/dashboard/calculations";
import { fetchBodyCompositions } from "@/lib/dashboard/queries";
import type { TrendMetricKey, TrendPoint } from "@/lib/dashboard/types";
import { createClient } from "@/lib/supabase/server";

const DISPLAY_DAYS = 30;
const LOOKBACK_DAYS = 6;

const METRICS: TrendMetricKey[] = ["weight_kg", "body_fat_pct", "body_fat_kg", "muscle_kg"];

export async function TrendSection({ userId, today }: { userId: string; today: string }) {
  const supabase = await createClient();

  const allDates = getDateRange(today, DISPLAY_DAYS + LOOKBACK_DAYS);
  const displayDates = allDates.slice(LOOKBACK_DAYS);
  const startDate = allDates[0];

  const bodyCompositions = await fetchBodyCompositions(supabase, userId, startDate, today);

  const series = Object.fromEntries(
    METRICS.map((metric) => [
      metric,
      buildTrendSeries(allDates, displayDates, toValuesByDate(bodyCompositions, metric)),
    ])
  ) as Record<TrendMetricKey, TrendPoint[]>;

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">体組成トレンド</h2>
      <TrendChartClient series={series} />
    </section>
  );
}
