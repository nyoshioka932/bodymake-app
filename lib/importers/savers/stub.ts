import type { ImportResult } from "@/lib/importers/types";

export async function saveStub(): Promise<Omit<ImportResult, "recordsError">> {
  return { recordsImported: 0, recordsSkipped: 0, recordsOverwritten: 0 };
}
