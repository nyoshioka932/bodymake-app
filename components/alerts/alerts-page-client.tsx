"use client";

import { useEffect, useState } from "react";
import { fetchAlertData } from "@/lib/alerts/alert-data";
import { buildAlerts } from "@/lib/alerts/alert-logic";
import type { AlertItem } from "@/lib/alerts/alert-logic";

const severityLabel: Record<string, string> = { high: "高", medium: "中", low: "低" };
const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function AlertsPageClient() {
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAlertData()
      .then((data) => {
        if (cancelled) return;
        const items = buildAlerts(data);
        items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        setAlerts(items);
      })
      .catch(() => {
        if (cancelled) return;
        setAlerts([]);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col">
      <h1 className="text-foreground border-border border-b px-4 py-3 text-base font-semibold">
        アラート（今週）
      </h1>
      <div className="p-4">
        {alerts === null ? (
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        ) : alerts.length === 0 ? (
          <p className="text-muted-foreground text-sm">今週のアラートはありません</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {alerts.map((a) => (
              <li key={a.id} className="border-border bg-card rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 shrink-0 text-xs font-medium">
                    [{severityLabel[a.severity]}]
                  </span>
                  <span className="text-foreground text-sm">{a.message}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
