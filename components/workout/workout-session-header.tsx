"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { completeWorkout, discardWorkout, updateWorkoutMemo } from "@/lib/workout/workout-actions";
import type { WorkoutSession } from "@/lib/workout/types";
import { SPLIT_TYPE_LABELS } from "@/lib/workout/types";

export function WorkoutSessionHeader({
  session,
  onComplete,
  onDiscard,
}: {
  session: WorkoutSession;
  onComplete: () => void;
  onDiscard: () => void;
}) {
  const [memo, setMemo] = useState(session.memo ?? "");
  const [savingMemo, setSavingMemo] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMemoBlur = async () => {
    setSavingMemo(true);
    try {
      await updateWorkoutMemo(session.id, memo);
    } catch {
      setError("メモの保存に失敗しました");
    } finally {
      setSavingMemo(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("セッションを完了しますか？")) return;
    setCompleting(true);
    setError(null);
    try {
      await completeWorkout(session.id);
      onComplete();
    } catch {
      setError("完了処理に失敗しました");
      setCompleting(false);
    }
  };

  const handleDiscard = async () => {
    if (!confirm("セッションを破棄しますか？記録したセットも削除されます。")) return;
    setDiscarding(true);
    setError(null);
    try {
      await discardWorkout(session.id);
      onDiscard();
    } catch {
      setError("破棄処理に失敗しました");
      setDiscarding(false);
    }
  };

  const splitLabel = session.split_type ? SPLIT_TYPE_LABELS[session.split_type] : "未分類";

  return (
    <div className="border-border bg-card rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">
            {session.date} <span className="text-muted-foreground font-normal">({splitLabel})</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleDiscard} disabled={discarding || completing}>
            破棄
          </Button>
          <Button size="sm" onClick={handleComplete} disabled={completing || discarding}>
            {completing ? "完了中..." : "完了"}
          </Button>
        </div>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">メモ{savingMemo ? " (保存中...)" : ""}</span>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={handleMemoBlur}
          placeholder="任意でメモを入力"
          className="border-border bg-background text-foreground w-full rounded-md border px-2 py-1 text-sm placeholder:text-muted-foreground"
        />
      </label>
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  );
}
