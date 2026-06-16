import { average } from "@/lib/dashboard/calculations";
import type { CalorieIntakePFC } from "@/lib/dashboard/types";
import type { SplitSetCount } from "@/lib/weekly/workout-queries";
import type { AlertSettings, FullGoals } from "@/lib/weekly/action-queries";

function fmt(v: number, decimals: number): string {
  return v.toFixed(decimals);
}

export function buildActionItems(params: {
  pfcRows: CalorieIntakePFC[];
  splitSetCounts: SplitSetCount[];
  goals: FullGoals | null;
  alertSettings: AlertSettings | null;
}): string[] {
  const { pfcRows, splitSetCounts, goals, alertSettings } = params;
  const items: string[] = [];

  const avgProtein = average(pfcRows.map((r) => r.protein_g));
  const avgFat = average(pfcRows.map((r) => r.fat_g));

  // タンパク質チェック
  if (goals?.protein_g && avgProtein !== null && avgProtein < goals.protein_g) {
    items.push(
      `タンパク質が目標を下回っています（平均 ${fmt(avgProtein, 0)} g、目標 ${fmt(goals.protein_g, 0)} g）`
    );
  }

  // 脂質チェック
  if (goals?.fat_g && avgFat !== null && avgFat > goals.fat_g) {
    items.push(
      `脂質が目標を超えています（平均 ${fmt(avgFat, 0)} g、目標 ${fmt(goals.fat_g, 0)} g）`
    );
  }

  // 部位別セット数チェック
  if (alertSettings) {
    const targets: Array<{ key: "chest" | "back" | "shoulder"; label: string; target: number | null }> = [
      { key: "chest", label: "胸", target: alertSettings.chest_weekly_sets_target },
      { key: "back", label: "背中", target: alertSettings.back_weekly_sets_target },
      { key: "shoulder", label: "肩", target: alertSettings.shoulder_weekly_sets_target },
    ];

    for (const { key, label, target } of targets) {
      if (target === null) continue;
      const actual = splitSetCounts.find((s) => s.split === key)?.count ?? 0;
      if (actual < target) {
        items.push(
          `${label}のセット数が不足しています（${actual} セット / 目標 ${target} セット）`
        );
      }
    }
  }

  return items;
}
