"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTypeCard } from "@/components/import/data-type-card";
import { ModeStep } from "@/components/import/mode-step";
import { PreviewStep } from "@/components/import/preview-step";
import { ResultStep } from "@/components/import/result-step";
import { DATA_TYPE_INFO, DATA_TYPE_ORDER } from "@/lib/importers/config";
import { computeFileHash } from "@/lib/importers/hash";
import { saveImportLog } from "@/lib/importers/import-log";
import type {
  DataType,
  ImportMode,
  ImportPreview,
  ImportResult,
} from "@/lib/importers/types";

type WizardStep = "select" | "file" | "preview" | "mode" | "result";

const INITIAL_RESULT: ImportResult = {
  recordsImported: 0,
  recordsSkipped: 0,
  recordsOverwritten: 0,
  recordsError: 0,
};

export function ImportWizard() {
  const [step, setStep] = useState<WizardStep>("select");
  const [dataType, setDataType] = useState<DataType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [notSupported, setNotSupported] = useState(false);
  const [mode, setMode] = useState<ImportMode>("skip");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("select");
    setDataType(null);
    setFile(null);
    setFileHash(null);
    setPreview(null);
    setNotSupported(false);
    setMode("skip");
    setStartDate("");
    setEndDate("");
    setResult(null);
    setError(null);
  };

  const handleSelectType = (type: DataType) => {
    setDataType(type);
    setStep("file");
  };

  const handleFileChange = async (selected: File | null) => {
    if (!selected || !dataType) return;
    setError(null);
    setFile(selected);

    const hash = await computeFileHash(selected);
    setFileHash(hash);

    const { preview: parsedPreview, notSupported: parserNotSupported } =
      await DATA_TYPE_INFO[dataType].parser(selected);
    setPreview(parsedPreview);
    setNotSupported(Boolean(parserNotSupported));
    setStartDate(parsedPreview.targetStartDate ?? "");
    setEndDate(parsedPreview.targetEndDate ?? "");
    setStep("preview");
  };

  const handleSubmit = async () => {
    if (!dataType || !file || !fileHash || !preview) return;
    setSubmitting(true);
    setError(null);

    try {
      await saveImportLog({
        dataType,
        fileName: file.name,
        fileHash,
        importMode: mode,
        targetStartDate: startDate || null,
        targetEndDate: endDate || null,
        preview,
        result: INITIAL_RESULT,
      });
      setResult(INITIAL_RESULT);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md p-4">
      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      {step === "select" && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">データ種別を選択</h2>
          {DATA_TYPE_ORDER.map((type) => (
            <DataTypeCard key={type} dataType={type} onSelect={handleSelectType} />
          ))}
        </div>
      )}

      {step === "file" && dataType && (
        <div className="flex flex-col gap-4">
          <h2 className="font-medium">{DATA_TYPE_INFO[dataType].label}</h2>
          <p className="text-muted-foreground text-sm">
            ファイルを選択してください。
          </p>
          <input
            type="file"
            accept={DATA_TYPE_INFO[dataType].accept}
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <Button variant="outline" onClick={reset}>
            戻る
          </Button>
        </div>
      )}

      {step === "preview" && preview && (
        <PreviewStep
          preview={preview}
          notSupported={notSupported}
          onNext={() => setStep("mode")}
          onBack={reset}
        />
      )}

      {step === "mode" && (
        <ModeStep
          mode={mode}
          onModeChange={setMode}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onBack={() => setStep("preview")}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {step === "result" && result && (
        <ResultStep result={result} onRestart={reset} />
      )}
    </div>
  );
}
