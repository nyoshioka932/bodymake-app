"use client";

import { useEffect, useState } from "react";
import { fetchBodyCompositions, fetchCalorieIntakes } from "@/lib/data/data-queries";
import { deleteBodyComposition, deleteCalorieIntake } from "@/lib/data/data-actions";
import type { BodyCompositionRecord, CalorieIntakeRecord } from "@/lib/data/data-queries";

type Tab = "body" | "food";

function fmt(v: number | null, d: number): string {
  return v !== null ? v.toFixed(d) : "ー";
}

function BodyTable({
  rows,
  onDelete,
}: {
  rows: BodyCompositionRecord[];
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) return <p className="text-muted-foreground text-xs">データがありません</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-border border-b">
            {["日時", "体重", "体脂肪%", "体脂肪kg", "骨格筋kg", ""].map((h) => (
              <th key={h} className="text-muted-foreground py-1 pr-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-border border-b last:border-0">
              <td className="text-foreground py-1 pr-2 whitespace-nowrap">
                {row.measured_at.slice(0, 16).replace("T", " ")}
                {row.is_representative && <span className="text-muted-foreground ml-1">★</span>}
              </td>
              <td className="text-foreground py-1 pr-2">{fmt(row.weight_kg, 2)}</td>
              <td className="text-foreground py-1 pr-2">{fmt(row.body_fat_pct, 1)}</td>
              <td className="text-foreground py-1 pr-2">{fmt(row.body_fat_kg, 1)}</td>
              <td className="text-foreground py-1 pr-2">{fmt(row.muscle_kg, 1)}</td>
              <td className="py-1">
                <button
                  type="button"
                  className="text-muted-foreground text-xs hover:text-destructive"
                  onClick={() => onDelete(row.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FoodTable({
  rows,
  onDelete,
}: {
  rows: CalorieIntakeRecord[];
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) return <p className="text-muted-foreground text-xs">データがありません</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-border border-b">
            {["日付", "kcal", "P(g)", "F(g)", "C(g)", ""].map((h) => (
              <th key={h} className="text-muted-foreground py-1 pr-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-border border-b last:border-0">
              <td className="text-foreground py-1 pr-2">{row.date}</td>
              <td className="text-foreground py-1 pr-2">{fmt(row.calories_kcal, 0)}</td>
              <td className="text-foreground py-1 pr-2">{fmt(row.protein_g, 1)}</td>
              <td className="text-foreground py-1 pr-2">{fmt(row.fat_g, 1)}</td>
              <td className="text-foreground py-1 pr-2">{fmt(row.carbs_g, 1)}</td>
              <td className="py-1">
                <button
                  type="button"
                  className="text-muted-foreground text-xs hover:text-destructive"
                  onClick={() => onDelete(row.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DataPageClient() {
  const [tab, setTab] = useState<Tab>("body");
  const [bodyRows, setBodyRows] = useState<BodyCompositionRecord[] | null>(null);
  const [foodRows, setFoodRows] = useState<CalorieIntakeRecord[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchBodyCompositions(), fetchCalorieIntakes()])
      .then(([body, food]) => {
        if (cancelled) return;
        setBodyRows(body);
        setFoodRows(food);
      })
      .catch(() => {
        if (cancelled) return;
        setBodyRows([]);
        setFoodRows([]);
      });
    return () => { cancelled = true; };
  }, []);

  const handleDeleteBody = async (id: string) => {
    if (!confirm("この記録を削除しますか？")) return;
    await deleteBodyComposition(id);
    setBodyRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  };

  const handleDeleteFood = async (id: string) => {
    if (!confirm("この記録を削除しますか？")) return;
    await deleteCalorieIntake(id);
    setFoodRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  };

  const isLoading = bodyRows === null || foodRows === null;

  return (
    <div className="flex flex-col">
      <h1 className="text-foreground border-border border-b px-4 py-3 text-base font-semibold">
        データ一覧（直近50件）
      </h1>

      <div className="border-border flex border-b">
        {(["body", "food"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`px-4 py-2 text-sm ${
              tab === t
                ? "text-foreground border-foreground border-b-2"
                : "text-muted-foreground"
            }`}
            onClick={() => setTab(t)}
          >
            {t === "body" ? "体組成" : "食事記録"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        ) : tab === "body" ? (
          <BodyTable rows={bodyRows!} onDelete={handleDeleteBody} />
        ) : (
          <FoodTable rows={foodRows!} onDelete={handleDeleteFood} />
        )}
      </div>
    </div>
  );
}
