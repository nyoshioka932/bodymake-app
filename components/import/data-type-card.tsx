import { DATA_TYPE_INFO } from "@/lib/importers/config";
import type { DataType } from "@/lib/importers/types";

export function DataTypeCard({
  dataType,
  onSelect,
}: {
  dataType: DataType;
  onSelect: (dataType: DataType) => void;
}) {
  const info = DATA_TYPE_INFO[dataType];

  return (
    <button
      type="button"
      onClick={() => onSelect(dataType)}
      className="border-border bg-card hover:bg-muted flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors"
    >
      <span className="font-medium">{info.label}</span>
      <span className="text-muted-foreground text-sm">
        {info.description}
      </span>
    </button>
  );
}
