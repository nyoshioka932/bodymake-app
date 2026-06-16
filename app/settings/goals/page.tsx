import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoalsForm } from "@/components/settings/goals-form";

export default async function SettingsGoalsPage() {
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
        目標設定
      </h1>
      <GoalsForm />
    </div>
  );
}
