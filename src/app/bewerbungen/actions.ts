"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withdrawApplication } from "@/lib/data/applications";

export async function withdrawApplicationAction(applicationId: string) {
  const supabase = await createClient();
  await withdrawApplication(supabase, applicationId);
  revalidatePath("/bewerbungen");
}
