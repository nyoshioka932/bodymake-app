import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DataPageClient } from "@/components/data/data-page-client";

export default async function DataPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DataPageClient />;
}
