import { parseAppleHealthZip } from "@/lib/importers/parsers/apple-health";
import { parseFitbitExport } from "@/lib/importers/parsers/fitbit";
import { parseOmronCsv } from "@/lib/importers/parsers/omron";
import { saveAppleHealthImport } from "@/lib/importers/savers/apple-health";
import { saveFitbitImport } from "@/lib/importers/savers/fitbit";
import { saveOmronImport } from "@/lib/importers/savers/omron";
import type { DataType, Parser, Saver } from "@/lib/importers/types";

export const DATA_TYPE_ORDER: DataType[] = [
  "body_composition",
  "calorie_intake",
  "calorie_burn",
];

export const DATA_TYPE_INFO: Record<
  DataType,
  { label: string; description: string; accept: string; parser: Parser; saver: Saver }
> = {
  body_composition: {
    label: "オムロン体組成計CSV",
    description: "体重・体脂肪率・骨格筋量などの体組成データを取り込みます",
    accept: ".csv",
    parser: parseOmronCsv,
    saver: saveOmronImport,
  },
  calorie_intake: {
    label: "Apple Health ZIP（あすけん）",
    description: "摂取カロリー・PFCのデータを取り込みます",
    accept: ".zip",
    parser: parseAppleHealthZip,
    saver: saveAppleHealthImport,
  },
  calorie_burn: {
    label: "Fitbitデータ（Google Takeout ZIP）",
    description: "消費カロリー・歩数・アクティブ時間のデータを取り込みます",
    accept: ".zip",
    parser: parseFitbitExport,
    saver: saveFitbitImport,
  },
};
