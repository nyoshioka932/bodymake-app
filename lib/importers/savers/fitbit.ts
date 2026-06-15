import { createClient } from "@/lib/supabase/client";
import type { ImportMode, ImportRow, ImportResult } from "@/lib/importers/types";

type SaveResult = Omit<ImportResult, "recordsError">;

export async function saveFitbitImport({
  rows,
  mode,
  startDate,
  endDate,
}: {
  rows: ImportRow[];
  mode: ImportMode;
  startDate: string | null;
  endDate: string | null;
}): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const targetRows = rows.filter((row) => {
    if (!row.payload) return false;
    if (startDate && row.date < startDate) return false;
    if (endDate && row.date > endDate) return false;
    return true;
  });

  if (targetRows.length === 0) {
    return { recordsImported: 0, recordsSkipped: 0, recordsOverwritten: 0 };
  }

  const minDate = targetRows.reduce((min, row) => (row.date < min ? row.date : min), targetRows[0].date);
  const maxDate = targetRows.reduce((max, row) => (row.date > max ? row.date : max), targetRows[0].date);

  const { data: settings } = await supabase
    .from("app_settings")
    .select("fitbit_calorie_factor")
    .eq("user_id", user.id)
    .maybeSingle();
  const calorieFactor = settings?.fitbit_calorie_factor ?? 1.0;

  const { data: existingData, error: existingError } = await supabase
    .from("calorie_burns")
    .select("date")
    .eq("user_id", user.id)
    .eq("source", "fitbit")
    .gte("date", minDate)
    .lte("date", maxDate);
  if (existingError) throw existingError;

  const existingDates = new Set((existingData ?? []).map((row) => row.date as string));

  let recordsImported = 0;
  let recordsSkipped = 0;
  let recordsOverwritten = 0;
  const payloadsToWrite: Record<string, unknown>[] = [];

  for (const row of targetRows) {
    const isExisting = existingDates.has(row.date);

    if (isExisting && mode === "skip") {
      recordsSkipped++;
      continue;
    }

    const rawCalories = row.payload!.raw_calories_kcal as number | null;
    payloadsToWrite.push({
      ...row.payload,
      user_id: user.id,
      calorie_factor: calorieFactor,
      adjusted_calories_kcal: rawCalories !== null ? rawCalories * calorieFactor : null,
    });

    if (isExisting) {
      recordsOverwritten++;
    } else {
      recordsImported++;
    }
  }

  if (payloadsToWrite.length > 0) {
    const { error: writeError } = await supabase
      .from("calorie_burns")
      .upsert(payloadsToWrite, { onConflict: "user_id,date,source" });
    if (writeError) throw writeError;
  }

  return { recordsImported, recordsSkipped, recordsOverwritten };
}
