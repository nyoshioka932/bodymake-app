import { Button } from "@/components/ui/button";
import type { ImportResult } from "@/lib/importers/types";

export function ResultStep({
  result,
  onRestart,
}: {
  result: ImportResult;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-medium">取込結果</h2>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">取込件数</dt>
          <dd>{result.recordsImported}件</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">スキップ件数</dt>
          <dd>{result.recordsSkipped}件</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">上書き件数</dt>
          <dd>{result.recordsOverwritten}件</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">エラー件数</dt>
          <dd>{result.recordsError}件</dd>
        </div>
      </dl>

      <p className="text-muted-foreground text-sm">
        取込ログを保存しました。データ一覧から確認できます。
      </p>

      <Button onClick={onRestart}>もう一度取り込む</Button>
    </div>
  );
}
