import type { ParseResult } from "@/lib/importers/types";

export async function parseAppleHealthZip(): Promise<ParseResult> {
  return {
    notSupported: true,
    preview: {
      dataType: "calorie_intake",
      targetStartDate: null,
      targetEndDate: null,
      rows: [],
      errors: [],
      sampleRows: [],
    },
  };
}
