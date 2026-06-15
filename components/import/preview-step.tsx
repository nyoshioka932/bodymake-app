import { Button } from "@/components/ui/button";
import type { ImportPreview } from "@/lib/importers/types";

export function PreviewStep({
  preview,
  notSupported,
  onNext,
  onBack,
}: {
  preview: ImportPreview;
  notSupported: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  const duplicateCount = preview.rows.filter((row) => row.isDuplicate).length;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-medium">解析・プレビュー</h2>

      {notSupported && (
        <p className="border-border bg-muted rounded-lg border p-3 text-sm">
          この形式の解析は準備中です。Phase
          4の後続ステップで対応予定のため、プレビューは空の状態になります。
        </p>
      )}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">対象期間</dt>
          <dd>
            {preview.targetStartDate ?? "—"} 〜 {preview.targetEndDate ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">取込予定件数</dt>
          <dd>{preview.rows.length}件</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">重複件数</dt>
          <dd>{duplicateCount}件</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">エラー件数</dt>
          <dd>{preview.errors.length}件</dd>
        </div>
      </dl>

      {preview.sampleRows.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-1 text-sm">サンプル行</p>
          <ul className="border-border divide-border divide-y rounded-lg border text-sm">
            {preview.sampleRows.map((row) => (
              <li key={row.rowNumber} className="p-2">
                {row.date}: {JSON.stringify(row.values)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={onNext}>次へ</Button>
      </div>
    </div>
  );
}
