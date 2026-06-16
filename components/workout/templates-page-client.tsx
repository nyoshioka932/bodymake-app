"use client";

import { useEffect, useState } from "react";
import { TemplateCard } from "@/components/workout/template-card";
import { fetchTemplates } from "@/lib/workout/template-queries";
import type { WorkoutTemplate } from "@/lib/workout/types";

export function TemplatesPageClient() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setError("テンプレートの読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted-foreground p-4 text-sm">読み込み中...</p>;
  }

  if (error) {
    return <p className="text-destructive p-4 text-sm">{error}</p>;
  }

  if (templates.length === 0) {
    return <p className="text-muted-foreground p-4 text-sm">テンプレートがありません</p>;
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-base font-semibold">テンプレート管理</h1>
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
