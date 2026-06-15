import { parseAppleHealthZip } from "@/lib/importers/parsers/apple-health";
import { parseFitbitCsv } from "@/lib/importers/parsers/fitbit";
import { parseOmronCsv } from "@/lib/importers/parsers/omron";
import type { DataType, Parser } from "@/lib/importers/types";

export const DATA_TYPE_ORDER: DataType[] = [
  "body_composition",
  "calorie_intake",
  "calorie_burn",
];

export const DATA_TYPE_INFO: Record<
  DataType,
  { label: string; description: string; accept: string; parser: Parser }
> = {
  body_composition: {
    label: "オムロン体組成計CSV",
    description: "体重・体脂肪率・骨格筋量などの体組成データを取り込みます",
    accept: ".csv",
    parser: parseOmronCsv,
  },
  calorie_intake: {
    label: "Apple Health ZIP（あすけん）",
    description: "摂取カロリー・PFCのデータを取り込みます",
    accept: ".zip",
    parser: parseAppleHealthZip,
  },
  calorie_burn: {
    label: "Fitbit消費カロリーCSV",
    description: "消費カロリー・歩数・アクティブ時間のデータを取り込みます",
    accept: ".csv",
    parser: parseFitbitCsv,
  },
};
