import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";
import type { ImportRow, ParseResult } from "@/lib/importers/types";

interface FitbitEntry {
  dateTime: string;
  value: string;
}

function entryDate(dateTime: string): string | null {
  // "MM/DD/YY HH:mm:ss" -> "YYYY-MM-DD"
  const match = dateTime.match(/^(\d{2})\/(\d{2})\/(\d{2}) /);
  if (!match) return null;
  const [, month, day, year] = match;
  return `20${year}-${month}-${day}`;
}

async function readJsonEntries(zip: JSZip, namePattern: RegExp): Promise<FitbitEntry[]> {
  const entries: FitbitEntry[] = [];
  const files = zip.file(namePattern);
  for (const file of files) {
    const text = await file.async("string");
    const parsed: FitbitEntry[] = JSON.parse(text);
    entries.push(...parsed);
  }
  return entries;
}

function sumByDate(entries: FitbitEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const date = entryDate(entry.dateTime);
    if (!date) continue;
    const value = Number(entry.value);
    if (!Number.isFinite(value)) continue;
    totals.set(date, (totals.get(date) ?? 0) + value);
  }
  return totals;
}

export async function parseFitbitExport(file: File): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(file);

  const [caloriesEntries, stepsEntries, moderateEntries, veryActiveEntries] = await Promise.all([
    readJsonEntries(zip, /Global Export Data\/calories-.*\.json$/),
    readJsonEntries(zip, /Global Export Data\/steps-.*\.json$/),
    readJsonEntries(zip, /Global Export Data\/moderately_active_minutes-.*\.json$/),
    readJsonEntries(zip, /Global Export Data\/very_active_minutes-.*\.json$/),
  ]);

  const caloriesByDate = sumByDate(caloriesEntries);
  const stepsByDate = sumByDate(stepsEntries);
  const moderateByDate = sumByDate(moderateEntries);
  const veryActiveByDate = sumByDate(veryActiveEntries);

  const dates = new Set<string>([
    ...caloriesByDate.keys(),
    ...stepsByDate.keys(),
    ...moderateByDate.keys(),
    ...veryActiveByDate.keys(),
  ]);

  const sortedDates = Array.from(dates).sort();

  const targetStartDate = sortedDates.length ? sortedDates[0] : null;
  const targetEndDate = sortedDates.length ? sortedDates[sortedDates.length - 1] : null;

  let existingDates = new Set<string>();
  if (targetStartDate && targetEndDate) {
    const supabase = createClient();
    const { data } = await supabase
      .from("calorie_burns")
      .select("date")
      .eq("source", "fitbit")
      .gte("date", targetStartDate)
      .lte("date", targetEndDate);
    existingDates = new Set((data ?? []).map((row) => row.date as string));
  }

  const rows: ImportRow[] = sortedDates.map((date, index) => {
    const rawCalories = caloriesByDate.get(date) ?? null;
    const steps = stepsByDate.get(date) ?? null;
    const activeMinutes =
      moderateByDate.has(date) || veryActiveByDate.has(date)
        ? (moderateByDate.get(date) ?? 0) + (veryActiveByDate.get(date) ?? 0)
        : null;

    return {
      rowNumber: index + 1,
      date,
      values: {
        raw_calories_kcal: rawCalories !== null ? Math.round(rawCalories) : null,
        steps: steps !== null ? Math.round(steps) : null,
        active_minutes: activeMinutes,
      },
      isDuplicate: existingDates.has(date),
      payload: {
        date,
        raw_calories_kcal: rawCalories !== null ? Math.round(rawCalories) : null,
        steps: steps !== null ? Math.round(steps) : null,
        active_minutes: activeMinutes,
        source: "fitbit",
      },
    };
  });

  return {
    preview: {
      dataType: "calorie_burn",
      targetStartDate,
      targetEndDate,
      rows,
      errors: [],
      sampleRows: rows.slice(0, 5),
    },
  };
}
