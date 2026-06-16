"use client";

import { useEffect, useState } from "react";
import { getTodayJST } from "@/lib/dashboard/calculations";
import type { BodyCompositionDaily, CalorieIntakePFC } from "@/lib/dashboard/types";
import {
  fetchWeeklyBodyCompositions,
  fetchWeeklyCalorieIntakePFC,
  fetchGoals,
} from "@/lib/weekly/queries";
import type { GoalsData } from "@/lib/weekly/queries";
import { WeeklyBodySection } from "@/components/weekly/weekly-body-section";
import { WeeklyFoodSection } from "@/components/weekly/weekly-food-section";

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface WeekData {
  forDate: string;
  bodyLast7: BodyCompositionDaily[];
  bodyPrev7: BodyCompositionDaily[];
  pfcRows: CalorieIntakePFC[];
}

export function WeeklyPageClient() {
  const today = getTodayJST();

  const [baseDate, setBaseDate] = useState<string>(today);
  const [goals, setGoals] = useState<GoalsData | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);

  useEffect(() => {
    fetchGoals()
      .then(setGoals)
      .catch(() => {/* ゴールなしで続行 */});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const endDate = baseDate;
    const startDate = addDays(baseDate, -6);
    const prevEndDate = addDays(baseDate, -7);
    const prevStartDate = addDays(baseDate, -13);

    Promise.all([
      fetchWeeklyBodyCompositions(startDate, endDate),
      fetchWeeklyBodyCompositions(prevStartDate, prevEndDate),
      fetchWeeklyCalorieIntakePFC(startDate, endDate),
    ])
      .then(([last7, prev7, pfc]) => {
        if (cancelled) return;
        setWeekData({ forDate: baseDate, bodyLast7: last7, bodyPrev7: prev7, pfcRows: pfc });
      })
      .catch(() => {
        if (cancelled) return;
        setWeekData({ forDate: baseDate, bodyLast7: [], bodyPrev7: [], pfcRows: [] });
      });
    return () => { cancelled = true; };
  }, [baseDate]);

  const isLoading = weekData === null || weekData.forDate !== baseDate;
  const canGoNext = baseDate < today;

  const weekLabel = (() => {
    const start = addDays(baseDate, -6);
    return `${start.slice(5).replace("-", "/")} 〜 ${baseDate.slice(5).replace("-", "/")}`;
  })();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-foreground rounded-md border px-3 py-1 text-sm"
          onClick={() => setBaseDate((d) => addDays(d, -7))}
        >
          ＜ 前週
        </button>
        <span className="text-foreground text-sm font-medium">{weekLabel}</span>
        <button
          type="button"
          className="text-foreground rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          onClick={() => setBaseDate((d) => addDays(d, 7))}
          disabled={!canGoNext}
        >
          翌週 ＞
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">読み込み中...</p>
      ) : (
        <>
          <WeeklyBodySection last7={weekData!.bodyLast7} prev7Rows={weekData!.bodyPrev7} />
          <WeeklyFoodSection rows={weekData!.pfcRows} goals={goals} />
        </>
      )}
    </div>
  );
}
