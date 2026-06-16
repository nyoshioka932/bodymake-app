import { average } from "@/lib/dashboard/calculations";
import type { BodyCompositionDaily } from "@/lib/dashboard/types";

function fmt(v: number | null, decimals: number): string {
  return v !== null ? v.toFixed(decimals) : "ー";
}

function fmtSigned(v: number | null, decimals: number): string {
  if (v === null) return "ー";
  return (v >= 0 ? "+" : "") + v.toFixed(decimals);
}

export function WeeklyBodySection({
  last7: rows,
  prev7Rows,
}: {
  last7: BodyCompositionDaily[];
  prev7Rows: BodyCompositionDaily[];
}) {
  const avgWeight = average(rows.map((r) => r.weight_kg));
  const avgBodyFatPct = average(rows.map((r) => r.body_fat_pct));
  const avgBodyFatKgCurrent = average(rows.map((r) => r.body_fat_kg));
  const avgBodyFatKgPrev = average(prev7Rows.map((r) => r.body_fat_kg));
  const bodyFatKgChange =
    avgBodyFatKgCurrent !== null && avgBodyFatKgPrev !== null
      ? avgBodyFatKgCurrent - avgBodyFatKgPrev
      : null;

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">体組成</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">平均体重</dt>
          <dd className="text-foreground font-medium">
            {fmt(avgWeight, 1)} <span className="text-muted-foreground text-xs">kg</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">平均体脂肪率</dt>
          <dd className="text-foreground font-medium">
            {fmt(avgBodyFatPct, 1)} <span className="text-muted-foreground text-xs">%</span>
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground text-xs">体脂肪量変化（前週比）</dt>
          <dd className="text-foreground font-medium">
            {fmtSigned(bodyFatKgChange, 1)} <span className="text-muted-foreground text-xs">kg</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
