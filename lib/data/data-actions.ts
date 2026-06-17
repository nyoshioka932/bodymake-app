import { createClient } from "@/lib/supabase/client";

export async function deleteBodyComposition(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("body_compositions").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCalorieIntake(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("calorie_intakes").delete().eq("id", id);
  if (error) throw error;
}
