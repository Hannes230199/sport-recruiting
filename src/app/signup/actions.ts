"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Server Action: Registriert einen neuen Nutzer mit E-Mail und Passwort. */
export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!name || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Bitte alle Felder ausfüllen.")}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Das Passwort muss mindestens 8 Zeichen lang sein.")}`);
  }

  if (password !== passwordConfirm) {
    redirect(`/signup?error=${encodeURIComponent("Die Passwörter stimmen nicht überein.")}`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is disabled, session is available immediately
  if (data.session) {
    // Create the profile record right away with the user's name
    await supabase
      .from("candidate_profiles")
      .upsert({ id: data.user!.id, email, full_name: "" }, { onConflict: "id" });

    redirect("/onboarding");
  }

  // Email confirmation is enabled — tell the user to check their inbox
  redirect(
    `/login?message=${encodeURIComponent(
      "Konto erstellt! Bitte bestätige deine E-Mail-Adresse und melde dich dann an."
    )}`
  );
}
