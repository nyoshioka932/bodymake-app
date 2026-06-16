import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlertsPageClient } from "@/components/alerts/alerts-page-client";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AlertsPageClient />;
}
