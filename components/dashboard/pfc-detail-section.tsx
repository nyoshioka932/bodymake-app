import { MultiSeriesChartClient } from "@/components/dashboard/multi-series-chart-client";
import { buildMovingAverageByDate, getDateRange, mergeSeries, pickValuesByDate } from "@/lib/dashboard/calculations";
import { fetchCalorieIntakePFC } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

const DISPLAY_DAYS = 30;
const LOOKBACK_DAYS = 6;

export async function PfcDetailSection({ userId, today }: { userId: string; today: string }) {
  const supabase = await createClient();

  const allDates = getDateRange(today, DISPLAY_DAYS + LOOKBACK_DAYS);
  const displayDates = allDates.slice(LOOKBACK_DAYS);
  const startDate = allDates[0];

  const pfcRows = await fetchCalorieIntakePFC(supabase, userId, startDate, today);

  const proteinMA = buildMovingAverageByDate(allDates, displayDates, pickValuesByDate(pfcRows, "protein_g"));
  const fatMA = buildMovingAverageByDate(allDates, displayDates, pickValuesByDate(pfcRows, "fat_g"));
  const carbsMA = buildMovingAverageByDate(allDates, displayDates, pickValuesByDate(pfcRows, "carbs_g"));

  const data = mergeSeries(displayDates, { protein: proteinMA, fat: fatMA, carbs: carbsMA });

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">PFC（7日移動平均、g/日）</h2>
      <MultiSeriesChartClient
        data={data}
        lines={[
          { dataKey: "protein", name: "タンパク質", color: "var(--chart-1)" },
          { dataKey: "fat", name: "脂質", color: "var(--chart-3)" },
          { dataKey: "carbs", name: "炭水化物", color: "var(--chart-5)" },
        ]}
      />
    </section>
  );
}
