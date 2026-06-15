"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action: schickt einen Magic Link (passwortlose Anmeldung per
 * E-Mail) an die angegebene Adresse. Supabase erstellt beim ersten Login
 * automatisch einen `auth.users`-Eintrag.
 *
 * Der Link führt zu `/auth/callback`, wo die Session anhand des
 * `code`-Parameters erstellt wird (PKCE-Flow).
 */
export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? "").trim();

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Bitte gib eine E-Mail-Adresse ein.")}`);
  }

  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";

  const callbackUrl = next
    ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
    : `${siteUrl}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Wir haben dir einen Anmeldelink per E-Mail geschickt. Bitte prüfe dein Postfach."
    )}`
  );
}
