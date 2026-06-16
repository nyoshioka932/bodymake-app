import type { WeeklyWorkoutSummary } from "@/lib/weekly/workout-queries";

export function WeeklyWorkoutSection({ summary }: { summary: WeeklyWorkoutSummary | null }) {
  if (!summary) return null;

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">筋トレ</h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">筋トレ回数</dt>
          <dd className="text-foreground font-medium">
            {summary.sessionCount}{" "}
            <span className="text-muted-foreground text-xs">回</span>
          </dd>
        </div>

        {summary.splitSetCounts.length > 0 && (
          <div>
            <dt className="text-muted-foreground mb-1 text-xs">部位別セット数（メイン）</dt>
            <dd>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {summary.splitSetCounts.map((s) => (
                  <div key={s.split} className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{s.label}</span>
                    <span className="text-foreground text-xs font-medium">{s.count} セット</span>
                  </div>
                ))}
              </div>
            </dd>
          </div>
        )}

        {summary.exerciseGrowths.length > 0 && (
          <div>
            <dt className="text-muted-foreground mb-1 text-xs">成長した種目（推定1RM）</dt>
            <dd>
              <div className="flex flex-col gap-1">
                {summary.exerciseGrowths.map((g) => (
                  <div key={g.exercise_id} className="flex items-center justify-between">
                    <span className="text-foreground text-xs">{g.exercise_name}</span>
                    <span className="text-foreground text-xs font-medium">
                      {g.currentMaxE1RM.toFixed(1)} kg
                      {g.diffE1RM !== null && (
                        <span className="text-muted-foreground ml-1">
                          (+{g.diffE1RM.toFixed(1)})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </dd>
          </div>
        )}

        {summary.sessionCount === 0 && (
          <p className="text-muted-foreground text-xs">この週の筋トレ記録はありません</p>
        )}
      </dl>
    </section>
  );
}
