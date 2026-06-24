"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmploymentType } from "@/lib/types";

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Server Action: speichert die Onboarding-Daten und erstellt das Profil. */
export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const sports = splitList(formData.get("sports"));
  const desiredRoles = splitList(formData.get("desiredRoles"));
  const employmentTypes = formData.getAll("employmentTypes") as EmploymentType[];

  // Upsert profile (handles both new and existing users)
  const { error } = await supabase.from("candidate_profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
      location,
      sports,
      desired_roles: desiredRoles,
      employment_types: employmentTypes,
    },
    { onConflict: "id" }
  );

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent("Profil konnte nicht gespeichert werden.")}`);
  }

  redirect("/profil?message=" + encodeURIComponent("Willkommen! Dein Profil wurde erstellt."));
}
