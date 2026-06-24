"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Server Action: meldet den Nutzer mit E-Mail und Passwort an. */
export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Bitte E-Mail und Passwort eingeben.")}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("E-Mail oder Passwort falsch.")}`);
  }

  // Check if onboarding is complete (full_name set)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("candidate_profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.full_name) {
      redirect("/onboarding");
    }
  }

  redirect(next || "/profil");
}

/** Server Action: meldet den aktuell eingeloggten Nutzer ab. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
