import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlertSettingsForm } from "@/components/settings/alert-settings-form";

export default async function SettingsAlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-foreground border-border border-b px-4 py-3 text-base font-semibold">
        アラート設定
      </h1>
      <AlertSettingsForm />
    </div>
  );
}
