"use client";

import { Button } from "@/components/ui/button";

const DIGITS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export function Numpad({
  value,
  onChange,
  allowDecimal = false,
}: {
  value: string;
  onChange: (v: string) => void;
  allowDecimal?: boolean;
}) {
  const append = (digit: string) => {
    if (digit === "." && !allowDecimal) return;
    if (digit === "." && value.includes(".")) return;
    if (value === "0" && digit !== ".") {
      onChange(digit);
      return;
    }
    // 小数点以下は1桁まで（重量用）
    if (value.includes(".")) {
      const decimalPart = value.split(".")[1];
      if (decimalPart !== undefined && decimalPart.length >= 1) return;
    }
    onChange(value + digit);
  };

  const backspace = () => {
    if (value.length <= 1) {
      onChange("0");
    } else {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {DIGITS.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((digit) => (
            <Button
              key={digit}
              type="button"
              variant="outline"
              size="default"
              className="h-12 flex-1 text-lg"
              onClick={() => append(digit)}
            >
              {digit}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="default"
          className="h-12 flex-1 text-lg"
          onClick={() => append(".")}
          disabled={!allowDecimal}
        >
          .
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="h-12 flex-1 text-lg"
          onClick={() => append("0")}
        >
          0
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="h-12 flex-1 text-lg"
          onClick={backspace}
        >
          ⌫
        </Button>
      </div>
    </div>
  );
}
