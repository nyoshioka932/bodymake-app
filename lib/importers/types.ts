export type DataType = "body_composition" | "calorie_intake" | "calorie_burn";

export type ImportMode = "skip" | "overwrite";

export interface ImportRow {
  rowNumber: number;
  date: string;
  values: Record<string, string | number | null>;
  isDuplicate: boolean;
  payload?: Record<string, unknown>;
}

export interface ImportErrorRow {
  rowNumber: number;
  rawData: Record<string, unknown>;
  message: string;
}

export interface ImportPreview {
  dataType: DataType;
  targetStartDate: string | null;
  targetEndDate: string | null;
  rows: ImportRow[];
  errors: ImportErrorRow[];
  sampleRows: ImportRow[];
}

export interface ParseResult {
  preview: ImportPreview;
  notSupported?: boolean;
}

export type Parser = (file: File) => Promise<ParseResult>;

export interface ImportResult {
  recordsImported: number;
  recordsSkipped: number;
  recordsOverwritten: number;
  recordsError: number;
}

export type Saver = (args: {
  rows: ImportRow[];
  mode: ImportMode;
  startDate: string | null;
  endDate: string | null;
}) => Promise<Omit<ImportResult, "recordsError">>;
