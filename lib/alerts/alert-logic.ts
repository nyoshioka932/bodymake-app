import { average } from "@/lib/dashboard/calculations";
import type { BodyCompositionDaily, CalorieIntakePFC } from "@/lib/dashboard/types";
import type { AlertSettings } from "@/lib/weekly/action-queries";
import type { FullGoals } from "@/lib/weekly/action-queries";
import type { SplitSetCount } from "@/lib/weekly/workout-queries";

export type AlertSeverity = "high" | "medium" | "low";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  message: string;
}

export function buildAlerts(params: {
  bodyLast7: BodyCompositionDaily[];
  bodyPrev7: BodyCompositionDaily[];
  pfcRows7: CalorieIntakePFC[];
  splitSetCounts: SplitSetCount[];
  goals: FullGoals | null;
  alertSettings: AlertSettings | null;
}): AlertItem[] {
  const { bodyLast7, bodyPrev7, pfcRows7, splitSetCounts, goals, alertSettings } = params;
  const items: AlertItem[] = [];

  // 体重増加アラート
  const avgWeightCurrent = average(bodyLast7.map((r) => r.weight_kg));
  const avgWeightPrev = average(bodyPrev7.map((r) => r.weight_kg));
  const threshold = alertSettings?.weight_gain_threshold_kg ?? null;
  if (
    threshold !== null &&
    avgWeightCurrent !== null &&
    avgWeightPrev !== null &&
    avgWeightCurrent - avgWeightPrev >= threshold
  ) {
    items.push({
      id: "weight-gain",
      severity: "high",
      message: `体重が前週比 +${(avgWeightCurrent - avgWeightPrev).toFixed(1)} kg 増加しています（閾値 ${threshold} kg）`,
    });
  }

  // タンパク質不足日数アラート
  const shortDays = alertSettings?.protein_shortage_days ?? 3;
  if (goals?.protein_g) {
    const underDays = pfcRows7.filter(
      (r) => r.protein_g !== null && r.protein_g < goals.protein_g!
    ).length;
    if (underDays >= shortDays) {
      items.push({
        id: "protein-shortage",
        severity: "medium",
        message: `週${underDays}日のタンパク質が目標（${goals.protein_g} g）を下回っています`,
      });
    }
  }

  // 部位別セット不足アラート
  if (alertSettings) {
    const targets: Array<{ split: "chest" | "back" | "shoulder"; label: string; target: number | null }> = [
      { split: "chest", label: "胸", target: alertSettings.chest_weekly_sets_target },
      { split: "back", label: "背中", target: alertSettings.back_weekly_sets_target },
      { split: "shoulder", label: "肩", target: alertSettings.shoulder_weekly_sets_target },
    ];
    for (const { split, label, target } of targets) {
      if (target === null) continue;
      const actual = splitSetCounts.find((s) => s.split === split)?.count ?? 0;
      if (actual < target) {
        items.push({
          id: `sets-${split}`,
          severity: "low",
          message: `${label}のメインセット数が不足（${actual} / 目標 ${target} セット）`,
        });
      }
    }
  }

  return items;
}
