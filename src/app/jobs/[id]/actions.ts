"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createOrUpdateApplication } from "@/lib/data/applications";
import { getJobById } from "@/lib/data/jobs";
import { getOrCreateProfile } from "@/lib/data/profile";
import { scoreJobForCandidate } from "@/lib/matching";

/**
 * Server Action für den "Jetzt bewerben"-Button auf der Job-Detailseite.
 * Legt (oder aktualisiert) eine Bewerbung für den eingeloggten Kandidaten
 * an, inkl. des aktuell berechneten Match-Scores.
 */
export async function applyToJob(jobId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect(`/login?next=/jobs/${jobId}`);
  }

  const job = await getJobById(supabase, jobId);
  if (!job) {
    return;
  }

  const profile = await getOrCreateProfile(supabase, user.id, user.email ?? "");
  const match = scoreJobForCandidate(job, profile);

  await createOrUpdateApplication(supabase, user.id, jobId, match.score);

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/bewerbungen");
}
