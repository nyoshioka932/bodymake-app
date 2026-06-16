"use client";

import { useState } from "react";
import { Numpad } from "@/components/workout/numpad";
import { Button } from "@/components/ui/button";
import type { PreviousSetValue } from "@/lib/workout/set-queries";

export function SetInputForm({
  setNumber,
  previousValue,
  onSave,
}: {
  setNumber: number;
  previousValue: PreviousSetValue | null;
  onSave: (setType: "warmup" | "main", weightKg: number | null, reps: number | null) => Promise<void>;
}) {
  const [setType, setSetType] = useState<"warmup" | "main">("main");
  const [weight, setWeight] = useState("0");
  const [reps, setReps] = useState("0");
  const [activeField, setActiveField] = useState<"weight" | "reps" | null>("weight");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyPrevious = () => {
    if (!previousValue) return;
    setWeight(previousValue.weight_kg?.toString() ?? "0");
    setReps(previousValue.reps?.toString() ?? "0");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const weightKg = parseFloat(weight);
      const repsInt = parseInt(reps, 10);
      await onSave(
        setType,
        isNaN(weightKg) || weight === "0" ? null : weightKg,
        isNaN(repsInt) || reps === "0" ? null : repsInt
      );
      setWeight("0");
      setReps("0");
      setActiveField("weight");
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-border bg-card mt-2 flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">セット {setNumber}</span>
        {previousValue && (
          <button type="button" onClick={copyPrevious} className="text-foreground text-xs underline">
            前回コピー ({previousValue.weight_kg ?? "ー"}kg × {previousValue.reps ?? "ー"}rep)
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={setType === "main" ? "default" : "outline"}
          onClick={() => setSetType("main")}
          className="flex-1"
        >
          メイン
        </Button>
        <Button
          type="button"
          size="sm"
          variant={setType === "warmup" ? "default" : "outline"}
          onClick={() => setSetType("warmup")}
          className="flex-1"
        >
          ウォームアップ
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveField("weight")}
          className={`border-border rounded-lg border p-3 text-center ${activeField === "weight" ? "border-foreground" : ""}`}
        >
          <p className="text-muted-foreground text-xs">重量</p>
          <p className="text-foreground text-2xl font-semibold">{weight}</p>
          <p className="text-muted-foreground text-xs">kg</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveField("reps")}
          className={`border-border rounded-lg border p-3 text-center ${activeField === "reps" ? "border-foreground" : ""}`}
        >
          <p className="text-muted-foreground text-xs">回数</p>
          <p className="text-foreground text-2xl font-semibold">{reps}</p>
          <p className="text-muted-foreground text-xs">rep</p>
        </button>
      </div>

      {activeField === "weight" && (
        <Numpad value={weight} onChange={setWeight} allowDecimal />
      )}
      {activeField === "reps" && (
        <Numpad value={reps} onChange={setReps} allowDecimal={false} />
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "保存中..." : "セットを保存"}
      </Button>
    </div>
  );
}
