import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";
import type { ImportRow, ParseResult } from "@/lib/importers/types";

const SOURCE_NAME = "カロミル";

const NUTRIENT_FIELDS: Record<string, "calories_kcal" | "protein_g" | "fat_g" | "carbs_g"> = {
  HKQuantityTypeIdentifierDietaryEnergyConsumed: "calories_kcal",
  HKQuantityTypeIdentifierDietaryProtein: "protein_g",
  HKQuantityTypeIdentifierDietaryFatTotal: "fat_g",
  HKQuantityTypeIdentifierDietaryCarbohydrates: "carbs_g",
};

const TYPE_RE = /type="([^"]*)"/;
const SOURCE_NAME_RE = /sourceName="([^"]*)"/;
const START_DATE_RE = /startDate="(\d{4}-\d{2}-\d{2})/;
const VALUE_RE = /value="([^"]*)"/;

interface ZipStreamHelper {
  on(event: "data", callback: (chunk: Uint8Array) => void): ZipStreamHelper;
  on(event: "end", callback: () => void): ZipStreamHelper;
  on(event: "error", callback: (error: Error) => void): ZipStreamHelper;
  resume(): ZipStreamHelper;
}

interface StreamableZipObject extends JSZip.JSZipObject {
  internalStream(type: "uint8array"): ZipStreamHelper;
}

interface NutrientTotals {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

function processLine(line: string, totalsByDate: Map<string, NutrientTotals>): void {
  if (!line.includes("<Record ") || !line.includes("HKQuantityTypeIdentifierDietary")) return;

  const typeMatch = line.match(TYPE_RE);
  if (!typeMatch) return;
  const field = NUTRIENT_FIELDS[typeMatch[1]];
  if (!field) return;

  const sourceMatch = line.match(SOURCE_NAME_RE);
  if (!sourceMatch || sourceMatch[1] !== SOURCE_NAME) return;

  const dateMatch = line.match(START_DATE_RE);
  const valueMatch = line.match(VALUE_RE);
  if (!dateMatch || !valueMatch) return;

  const value = Number(valueMatch[1]);
  if (!Number.isFinite(value)) return;

  const date = dateMatch[1];
  const totals = totalsByDate.get(date) ?? { calories_kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 };
  totals[field] += value;
  totalsByDate.set(date, totals);
}

async function readTotalsByDate(zip: JSZip): Promise<Map<string, NutrientTotals>> {
  const [file] = zip.file(/apple_health_export\/export\.xml$/);
  if (!file) throw new Error("export.xmlが見つかりません");

  const totalsByDate = new Map<string, NutrientTotals>();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  await new Promise<void>((resolve, reject) => {
    (file as StreamableZipObject)
      .internalStream("uint8array")
      .on("data", (chunk) => {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          processLine(line, totalsByDate);
        }
      })
      .on("end", () => {
        buffer += decoder.decode();
        if (buffer) processLine(buffer, totalsByDate);
        resolve();
      })
      .on("error", reject)
      .resume();
  });

  return totalsByDate;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function parseAppleHealthZip(file: File): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(file);
  const totalsByDate = await readTotalsByDate(zip);

  const sortedDates = Array.from(totalsByDate.keys()).sort();
  const targetStartDate = sortedDates.length ? sortedDates[0] : null;
  const targetEndDate = sortedDates.length ? sortedDates[sortedDates.length - 1] : null;

  let existingDates = new Set<string>();
  if (targetStartDate && targetEndDate) {
    const supabase = createClient();
    const { data } = await supabase
      .from("calorie_intakes")
      .select("date")
      .eq("source", SOURCE_NAME)
      .gte("date", targetStartDate)
      .lte("date", targetEndDate);
    existingDates = new Set((data ?? []).map((row) => row.date as string));
  }

  const rows: ImportRow[] = sortedDates.map((date, index) => {
    const totals = totalsByDate.get(date)!;
    const calories = Math.round(totals.calories_kcal);
    const protein = round1(totals.protein_g);
    const fat = round1(totals.fat_g);
    const carbs = round1(totals.carbs_g);

    return {
      rowNumber: index + 1,
      date,
      values: {
        calories_kcal: calories,
        protein_g: protein,
        fat_g: fat,
        carbs_g: carbs,
      },
      isDuplicate: existingDates.has(date),
      payload: {
        date,
        calories_kcal: calories,
        protein_g: protein,
        fat_g: fat,
        carbs_g: carbs,
        source: SOURCE_NAME,
      },
    };
  });

  return {
    preview: {
      dataType: "calorie_intake",
      targetStartDate,
      targetEndDate,
      rows,
      errors: [],
      sampleRows: rows.slice(0, 5),
    },
  };
}
