import { Button } from "@/components/ui/button";
import type { ImportMode } from "@/lib/importers/types";

const MODE_OPTIONS: { value: ImportMode; label: string; description: string }[] = [
  {
    value: "skip",
    label: "スキップ",
    description: "既存データと重複する行は取り込まない",
  },
  {
    value: "overwrite",
    label: "上書き",
    description: "既存データと重複する行は新しい値で上書きする",
  },
];

export function ModeStep({
  mode,
  onModeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onBack,
  onSubmit,
  submitting,
}: {
  mode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-medium">取込モード・対象期間</h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-muted-foreground mb-1 text-sm">
          取込モード
        </legend>
        {MODE_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="import-mode"
              value={option.value}
              checked={mode === option.value}
              onChange={() => onModeChange(option.value)}
              className="mt-1"
            />
            <span>
              <span className="font-medium">{option.label}</span>
              <span className="text-muted-foreground block">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label className="text-sm">
          <span className="text-muted-foreground mb-1 block">対象開始日</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground mb-1 block">対象終了日</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          戻る
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? "実行中..." : "取込実行"}
        </Button>
      </div>
    </div>
  );
}
