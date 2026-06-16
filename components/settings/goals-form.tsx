"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchGoalsFormData, upsertGoals } from "@/lib/settings/goals-queries";
import type { GoalsFormData } from "@/lib/settings/goals-queries";

const inputClass =
  "border-border bg-background text-foreground rounded-md border px-3 py-2 text-sm w-full placeholder:text-muted-foreground";

function toNum(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export function GoalsForm() {
  const [data, setData] = useState<GoalsFormData>({
    protein_g: null,
    fat_g: null,
    calorie_target_kcal: null,
    target_body_fat_pct: null,
    weekly_weight_loss_target_kg: null,
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchGoalsFormData()
      .then((d) => {
        if (d) setData(d);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleChange = (field: keyof GoalsFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: toNum(value) }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await upsertGoals(data);
      setMessage("保存しました");
    } catch {
      setMessage("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <p className="text-muted-foreground p-4 text-sm">読み込み中...</p>;
  }

  const fields: Array<{ key: keyof GoalsFormData; label: string; unit: string; step: string }> = [
    { key: "protein_g", label: "タンパク質目標", unit: "g/日", step: "1" },
    { key: "fat_g", label: "脂質目標", unit: "g/日", step: "1" },
    { key: "calorie_target_kcal", label: "カロリー目標", unit: "kcal/日", step: "1" },
    { key: "target_body_fat_pct", label: "目標体脂肪率", unit: "%", step: "0.1" },
    { key: "weekly_weight_loss_target_kg", label: "週次体重減少目標", unit: "kg/週", step: "0.1" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {fields.map(({ key, label, unit, step }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-foreground text-xs font-medium">
            {label}
            <span className="text-muted-foreground ml-1">({unit})</span>
          </label>
          <input
            type="number"
            step={step}
            min="0"
            className={inputClass}
            value={data[key] ?? ""}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder="未設定"
          />
        </div>
      ))}

      {message && (
        <p className={`text-sm ${message === "保存しました" ? "text-foreground" : "text-destructive"}`}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "保存中..." : "保存"}
      </Button>
    </form>
  );
}
