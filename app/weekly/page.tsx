import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WeeklyPageClient } from "@/components/weekly/weekly-page-client";

export default async function WeeklyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <WeeklyPageClient />;
}
