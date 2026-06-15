import { KpiCard } from "@/components/dashboard/kpi-card";
import type { KpiCardData } from "@/lib/dashboard/types";

export function KpiCards({ kpis }: { kpis: KpiCardData[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible lg:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.key} data={kpi} />
      ))}
    </div>
  );
}
