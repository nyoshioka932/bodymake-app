export type TrendMetricKey = "weight_kg" | "body_fat_pct" | "body_fat_kg" | "muscle_kg";

export interface BodyCompositionDaily {
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  body_fat_kg: number | null;
  muscle_kg: number | null;
}

export interface CalorieDaily {
  date: string;
  calories_kcal: number | null;
  adjusted_calories_kcal: number | null;
}

export interface TrendPoint {
  date: string;
  value: number | null;
  movingAverage: number | null;
}

export interface KpiCardData {
  key: string;
  label: string;
  value: string;
  unit: string;
  helperText?: string;
}

export interface MuscleGroupSets {
  muscleGroup: "chest" | "back" | "shoulder";
  label: string;
  actualSets: number;
  targetSets: number | null;
}

export interface MuscleGroupSetCount {
  muscleGroup: "chest" | "back" | "shoulder" | "legs";
  label: string;
  actualSets: number;
}

export interface CalorieIntakePFC {
  date: string;
  calories_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
}
