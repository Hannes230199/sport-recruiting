"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withdrawApplication, updateCandidateApplication } from "@/lib/data/applications";
import { ApplicationStatus } from "@/lib/types";

export async function withdrawApplicationAction(applicationId: string) {
  const supabase = await createClient();
  await withdrawApplication(supabase, applicationId);
  revalidatePath("/bewerbungen");
}

export async function updateApplicationAction(
  applicationId: string,
  updates: { status?: ApplicationStatus; notes?: string | null }
) {
  const supabase = await createClient();
  await updateCandidateApplication(supabase, applicationId, updates);
  revalidatePath("/bewerbungen");
}
