import type { KpiCardData } from "@/lib/dashboard/types";

export function KpiCard({ data }: { data: KpiCardData }) {
  return (
    <div className="border-border bg-card flex min-w-[140px] flex-shrink-0 flex-col gap-1 rounded-lg border p-3 shadow-sm">
      <span className="text-muted-foreground text-xs">{data.label}</span>
      <span className="text-xl font-semibold">
        {data.value}
        <span className="text-muted-foreground ml-1 text-xs font-normal">{data.unit}</span>
      </span>
      {data.helperText && <span className="text-muted-foreground text-xs">{data.helperText}</span>}
    </div>
  );
}
