import { redirect } from "next/navigation";
import { WorkoutPageClient } from "@/components/workout/workout-page-client";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <WorkoutPageClient />;
}
