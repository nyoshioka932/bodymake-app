import { createClient } from "@/lib/supabase/client";
import type { ImportErrorRow, ImportRow, ParseResult } from "@/lib/importers/types";

const COLUMNS = [
  "測定日",
  "タイムゾーン",
  "体重(kg)",
  "体脂肪(%)",
  "体脂肪量(kg)",
  "内臓脂肪レベル",
  "基礎代謝(kcal)",
  "骨格筋(%)",
  "骨格筋量(kg)",
  "BMI",
  "体年齢(才)",
  "機種",
] as const;

const NUMERIC_FIELDS: { key: string; column: string }[] = [
  { key: "weight_kg", column: "体重(kg)" },
  { key: "body_fat_pct", column: "体脂肪(%)" },
  { key: "body_fat_kg", column: "体脂肪量(kg)" },
  { key: "visceral_fat", column: "内臓脂肪レベル" },
  { key: "bmr_kcal", column: "基礎代謝(kcal)" },
  { key: "muscle_pct", column: "骨格筋(%)" },
  { key: "muscle_kg", column: "骨格筋量(kg)" },
  { key: "bmi", column: "BMI" },
  { key: "body_age", column: "体年齢(才)" },
];

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function parseMeasuredAt(value: string): { date: string; measuredAt: string } | null {
  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = `${year}-${month}-${day}`;
  const measuredAt = `${date}T${hour}:${minute}:00+09:00`;
  return { date, measuredAt };
}

function parseNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function parseOmronCsv(file: File): Promise<ParseResult> {
  const text = (await file.text()).replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const dataLines = lines.slice(1);

  const errors: ImportErrorRow[] = [];
  const parsed: {
    rowNumber: number;
    date: string;
    measuredAt: string;
    values: Record<string, string | number | null>;
    payload: Record<string, unknown>;
  }[] = [];

  dataLines.forEach((line, index) => {
    const rowNumber = index + 1;
    const fields = parseCsvLine(line);
    const raw: Record<string, string> = {};
    COLUMNS.forEach((column, i) => {
      raw[column] = fields[i] ?? "";
    });

    const dateInfo = parseMeasuredAt(raw["測定日"]);
    if (!dateInfo) {
      errors.push({
        rowNumber,
        rawData: raw,
        message: `測定日の形式が不正です: ${raw["測定日"]}`,
      });
      return;
    }

    const numericValues: Record<string, number | null> = {};
    for (const { key, column } of NUMERIC_FIELDS) {
      numericValues[key] = parseNumber(raw[column]);
    }

    const invalidField = NUMERIC_FIELDS.find(({ key }) => numericValues[key] === null);
    if (invalidField) {
      errors.push({
        rowNumber,
        rawData: raw,
        message: `${invalidField.column}の値が不正です: ${raw[invalidField.column]}`,
      });
      return;
    }

    parsed.push({
      rowNumber,
      date: dateInfo.date,
      measuredAt: dateInfo.measuredAt,
      values: {
        測定日: raw["測定日"],
        ...numericValues,
      },
      payload: {
        measured_at: dateInfo.measuredAt,
        date: dateInfo.date,
        source: "omron",
        ...numericValues,
      },
    });
  });

  const earliestByDate = new Map<string, string>();
  for (const row of parsed) {
    const current = earliestByDate.get(row.date);
    if (!current || row.measuredAt < current) {
      earliestByDate.set(row.date, row.measuredAt);
    }
  }

  const dates = parsed.map((row) => row.date);
  const targetStartDate = dates.length
    ? dates.reduce((a, b) => (a < b ? a : b))
    : null;
  const targetEndDate = dates.length
    ? dates.reduce((a, b) => (a > b ? a : b))
    : null;

  let existingMeasuredAts = new Set<string>();
  if (targetStartDate && targetEndDate) {
    const supabase = createClient();
    const { data } = await supabase
      .from("body_compositions")
      .select("measured_at")
      .eq("source", "omron")
      .gte("date", targetStartDate)
      .lte("date", targetEndDate);
    existingMeasuredAts = new Set(
      (data ?? []).map((row) => new Date(row.measured_at as string).toISOString())
    );
  }

  const rows: ImportRow[] = parsed.map((row) => ({
    rowNumber: row.rowNumber,
    date: row.date,
    values: row.values,
    isDuplicate: existingMeasuredAts.has(new Date(row.measuredAt).toISOString()),
    payload: {
      ...row.payload,
      is_representative: earliestByDate.get(row.date) === row.measuredAt,
    },
  }));

  return {
    preview: {
      dataType: "body_composition",
      targetStartDate,
      targetEndDate,
      rows,
      errors,
      sampleRows: rows.slice(0, 5),
    },
  };
}
