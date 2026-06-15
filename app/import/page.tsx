import { redirect } from "next/navigation";
import { ImportWizard } from "@/components/import/import-wizard";
import { createClient } from "@/lib/supabase/server";

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ImportWizard />;
}
