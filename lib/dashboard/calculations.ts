import type { BodyCompositionDaily, CalorieDaily, TrendMetricKey, TrendPoint } from "./types";

export function getTodayJST(): string {
  return formatDateJST(new Date());
}

export function formatDateJST(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// endDateを含むdays日分の日付を昇順で返す
export function getDateRange(endDate: string, days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(addDays(endDate, -i));
  }
  return dates;
}

// 欠損日(null/undefined)は平均の母数から除外する
export function average(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((acc, v) => acc + v, 0) / valid.length;
}

// 欠損日(null/undefined)は0扱いせず合計から除外する
export function sumNonNull(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((acc, v) => acc + v, 0);
}

export function buildTrendSeries(
  allDates: string[],
  displayDates: string[],
  valuesByDate: Map<string, number | null>
): TrendPoint[] {
  const indexByDate = new Map(allDates.map((date, index) => [date, index]));

  return displayDates.map((date) => {
    const index = indexByDate.get(date)!;
    const windowStart = Math.max(0, index - 6);
    const windowDates = allDates.slice(windowStart, index + 1);
    const windowValues = windowDates.map((d) => valuesByDate.get(d) ?? null);

    return {
      date,
      value: valuesByDate.get(date) ?? null,
      movingAverage: average(windowValues),
    };
  });
}

export function toValuesByDate(
  rows: BodyCompositionDaily[],
  metric: TrendMetricKey
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const row of rows) {
    map.set(row.date, row[metric]);
  }
  return map;
}

export function calculateNetCaloriesByDate(rows: CalorieDaily[]): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const row of rows) {
    const netCalories =
      row.calories_kcal !== null && row.adjusted_calories_kcal !== null
        ? row.calories_kcal - row.adjusted_calories_kcal
        : null;
    map.set(row.date, netCalories);
  }
  return map;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
