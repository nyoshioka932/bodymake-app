"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchAlertSettingsFormData, upsertAlertSettings } from "@/lib/settings/alert-settings-queries";
import type { AlertSettingsFormData } from "@/lib/settings/alert-settings-queries";

const inputClass =
  "border-border bg-background text-foreground rounded-md border px-3 py-2 text-sm w-full placeholder:text-muted-foreground";

function toNum(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function toInt(v: string, fallback: number): number {
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

export function AlertSettingsForm() {
  const [data, setData] = useState<AlertSettingsFormData>({
    weight_gain_threshold_kg: null,
    protein_shortage_days: 3,
    chest_weekly_sets_target: null,
    back_weekly_sets_target: null,
    shoulder_weekly_sets_target: null,
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAlertSettingsFormData()
      .then((d) => {
        if (d) setData(d);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await upsertAlertSettings(data);
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-foreground text-xs font-medium">
          体重増加アラート閾値
          <span className="text-muted-foreground ml-1">(kg)</span>
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          className={inputClass}
          value={data.weight_gain_threshold_kg ?? ""}
          onChange={(e) => {
            setData((prev) => ({ ...prev, weight_gain_threshold_kg: toNum(e.target.value) }));
            setMessage(null);
          }}
          placeholder="未設定"
        />
        <p className="text-muted-foreground text-xs">前週比でこの体重増加を超えたらアラート</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-xs font-medium">
          タンパク質不足アラート日数
          <span className="text-muted-foreground ml-1">(日)</span>
        </label>
        <input
          type="number"
          step="1"
          min="1"
          className={inputClass}
          value={data.protein_shortage_days}
          onChange={(e) => {
            setData((prev) => ({ ...prev, protein_shortage_days: toInt(e.target.value, 3) }));
            setMessage(null);
          }}
        />
        <p className="text-muted-foreground text-xs">週に何日以上タンパク質不足でアラート（デフォルト3日）</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">部位別週セット目標</p>
        {([
          { key: "chest_weekly_sets_target", label: "胸" },
          { key: "back_weekly_sets_target", label: "背中" },
          { key: "shoulder_weekly_sets_target", label: "肩" },
        ] as const).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <label className="text-muted-foreground w-12 shrink-0 text-xs">{label}</label>
            <input
              type="number"
              step="1"
              min="0"
              className={inputClass}
              value={data[key] ?? ""}
              onChange={(e) => {
                setData((prev) => ({ ...prev, [key]: toNum(e.target.value) }));
                setMessage(null);
              }}
              placeholder="未設定"
            />
            <span className="text-muted-foreground shrink-0 text-xs">セット</span>
          </div>
        ))}
      </div>

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
