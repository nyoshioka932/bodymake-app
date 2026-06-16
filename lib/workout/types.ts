export type SplitType = "chest" | "back" | "shoulder" | "legs";

export const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  chest: "胸",
  back: "背中",
  shoulder: "肩",
  legs: "脚",
};

export interface Exercise {
  id: string;
  name: string;
  primary_muscle_group: SplitType;
  is_preset: boolean;
  user_id: string | null;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  split_type: SplitType;
  sort_order: number;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  exercise_name: string;
  primary_muscle_group: SplitType;
  default_sets: number | null;
  target_reps: number | null;
  default_weight_kg: number | null;
  sort_order: number;
}
