import type { ParseResult } from "@/lib/importers/types";

export async function parseOmronCsv(): Promise<ParseResult> {
  return {
    notSupported: true,
    preview: {
      dataType: "body_composition",
      targetStartDate: null,
      targetEndDate: null,
      rows: [],
      errors: [],
      sampleRows: [],
    },
  };
}
