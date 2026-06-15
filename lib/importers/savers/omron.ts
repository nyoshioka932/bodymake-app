import { createClient } from "@/lib/supabase/client";
import type { ImportMode, ImportRow, ImportResult } from "@/lib/importers/types";

type SaveResult = Omit<ImportResult, "recordsError">;

export async function saveOmronImport({
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

  const { data: existingData, error: existingError } = await supabase
    .from("body_compositions")
    .select("measured_at")
    .eq("user_id", user.id)
    .eq("source", "omron")
    .gte("date", minDate)
    .lte("date", maxDate);
  if (existingError) throw existingError;

  const existingMeasuredAts = new Set(
    (existingData ?? []).map((row) => new Date(row.measured_at as string).toISOString())
  );

  let recordsImported = 0;
  let recordsSkipped = 0;
  let recordsOverwritten = 0;
  const payloadsToWrite: Record<string, unknown>[] = [];

  for (const row of targetRows) {
    const measuredAtIso = new Date(row.payload!.measured_at as string).toISOString();
    const isExisting = existingMeasuredAts.has(measuredAtIso);

    if (isExisting && mode === "skip") {
      recordsSkipped++;
      continue;
    }

    payloadsToWrite.push({ ...row.payload, user_id: user.id });
    if (isExisting) {
      recordsOverwritten++;
    } else {
      recordsImported++;
    }
  }

  if (payloadsToWrite.length > 0) {
    const { error: writeError } = await supabase
      .from("body_compositions")
      .upsert(payloadsToWrite, { onConflict: "user_id,measured_at,source" });
    if (writeError) throw writeError;
  }

  await recalculateRepresentative(supabase, user.id, minDate, maxDate);

  return { recordsImported, recordsSkipped, recordsOverwritten };
}

async function recalculateRepresentative(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from("body_compositions")
    .select("id, date, is_representative")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("measured_at", { ascending: true });
  if (error) throw error;

  const seenDates = new Set<string>();
  const idsToTrue: string[] = [];
  const idsToFalse: string[] = [];

  for (const row of data ?? []) {
    const isFirstOfDate = !seenDates.has(row.date);
    seenDates.add(row.date);

    if (isFirstOfDate && !row.is_representative) {
      idsToTrue.push(row.id);
    } else if (!isFirstOfDate && row.is_representative) {
      idsToFalse.push(row.id);
    }
  }

  if (idsToTrue.length > 0) {
    const { error: trueError } = await supabase
      .from("body_compositions")
      .update({ is_representative: true })
      .in("id", idsToTrue);
    if (trueError) throw trueError;
  }

  if (idsToFalse.length > 0) {
    const { error: falseError } = await supabase
      .from("body_compositions")
      .update({ is_representative: false })
      .in("id", idsToFalse);
    if (falseError) throw falseError;
  }
}
