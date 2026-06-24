import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback-Endpoint für E-Mail-Bestätigung und Magic-Link-Login (PKCE-Flow).
 * Nach Code-Austausch wird geprüft, ob das Profil vollständig ist:
 * - Neuer Nutzer → /onboarding
 * - Bestehender Nutzer → /profil (oder next-Parameter)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if profile is complete
        const { data: profile } = await supabase
          .from("candidate_profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || !profile.full_name) {
          // New user — create empty profile, send to onboarding
          await supabase
            .from("candidate_profiles")
            .upsert({ id: user.id, email: user.email ?? "", full_name: "" }, { onConflict: "id" });
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next || "/profil"}`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Ungültiger oder abgelaufener Anmeldelink.")}`
  );
}
