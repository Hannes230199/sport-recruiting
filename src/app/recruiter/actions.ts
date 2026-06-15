"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { updateApplicationStatus } from "@/lib/data/applications";
import { ApplicationStatus } from "@/lib/types";

const VALID_STATUSES: ApplicationStatus[] = [
  "draft",
  "submitted",
  "in_review",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

/**
 * Server Action: aktualisiert Status und Notizen einer Bewerbung im
 * Recruiter-Bereich. Greift nur, wenn der eingeloggte Nutzer
 * `is_recruiter = true` ist (sowohl per Profil-Check hier als auch über die
 * RLS-Policy "Recruiter aktualisieren alle Bewerbungen" abgesichert).
 */
export async function updateStatus(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/recruiter");
  }

  const profile = await getOrCreateProfile(supabase, user.id, user.email ?? "");
  if (!profile.isRecruiter) {
    redirect("/recruiter");
  }

  const applicationId = String(formData.get("applicationId") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!applicationId || !VALID_STATUSES.includes(statusRaw as ApplicationStatus)) {
    return;
  }

  await updateApplicationStatus(supabase, applicationId, statusRaw as ApplicationStatus, notes);

  revalidatePath("/recruiter");
}
