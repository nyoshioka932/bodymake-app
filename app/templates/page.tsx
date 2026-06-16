import { redirect } from "next/navigation";
import { TemplatesPageClient } from "@/components/workout/templates-page-client";
import { createClient } from "@/lib/supabase/server";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <TemplatesPageClient />;
}
