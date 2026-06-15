import { createClient } from "@/lib/supabase/client";
import type {
  DataType,
  ImportMode,
  ImportPreview,
  ImportResult,
} from "@/lib/importers/types";

export async function saveImportLog({
  dataType,
  fileName,
  fileHash,
  importMode,
  targetStartDate,
  targetEndDate,
  preview,
  result,
}: {
  dataType: DataType;
  fileName: string;
  fileHash: string;
  importMode: ImportMode;
  targetStartDate: string | null;
  targetEndDate: string | null;
  preview: ImportPreview;
  result: ImportResult;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("ログインが必要です");
  }

  const { data: importLog, error } = await supabase
    .from("import_logs")
    .insert({
      user_id: user.id,
      data_type: dataType,
      file_name: fileName,
      file_hash: fileHash,
      import_mode: importMode,
      target_start_date: targetStartDate,
      target_end_date: targetEndDate,
      preview_json: preview,
      records_imported: result.recordsImported,
      records_skipped: result.recordsSkipped,
      records_overwritten: result.recordsOverwritten,
      records_error: result.recordsError,
    })
    .select()
    .single();

  if (error) throw error;

  if (preview.errors.length > 0) {
    const { error: errorsError } = await supabase.from("import_errors").insert(
      preview.errors.map((row) => ({
        user_id: user.id,
        import_log_id: importLog.id,
        row_number: row.rowNumber,
        raw_data: row.rawData,
        error_message: row.message,
      }))
    );
    if (errorsError) throw errorsError;
  }

  return importLog;
}
