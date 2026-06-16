"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAlertData } from "@/lib/alerts/alert-data";
import { buildAlerts } from "@/lib/alerts/alert-logic";
import type { AlertItem } from "@/lib/alerts/alert-logic";

const severityLabel: Record<string, string> = { high: "高", medium: "中", low: "低" };

export function AlertSummarySection() {
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAlertData()
      .then((data) => {
        if (cancelled) return;
        setAlerts(buildAlerts(data));
      })
      .catch(() => {
        if (cancelled) return;
        setAlerts([]);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">アラート要約</h2>
        {alerts && alerts.length > 0 && (
          <Link href="/alerts" className="text-muted-foreground text-xs underline">
            すべて見る
          </Link>
        )}
      </div>

      {alerts === null ? (
        <p className="text-muted-foreground text-xs">読み込み中...</p>
      ) : alerts.length === 0 ? (
        <p className="text-muted-foreground text-xs">今週のアラートはありません</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {alerts.slice(0, 3).map((a) => (
            <li key={a.id} className="flex items-start gap-1.5 text-xs">
              <span className="text-muted-foreground mt-0.5 shrink-0 font-medium">
                [{severityLabel[a.severity]}]
              </span>
              <span className="text-foreground">{a.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
