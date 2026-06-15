import type { ParseResult } from "@/lib/importers/types";

export async function parseFitbitCsv(): Promise<ParseResult> {
  return {
    notSupported: true,
    preview: {
      dataType: "calorie_burn",
      targetStartDate: null,
      targetEndDate: null,
      rows: [],
      errors: [],
      sampleRows: [],
    },
  };
}
