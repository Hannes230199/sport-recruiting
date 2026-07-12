"use server";

import { createClient } from "@/lib/supabase/server";

export interface CommunitySignupResult {
  success: boolean;
  error?: string;
}

export async function communitySignup(formData: FormData): Promise<CommunitySignupResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const wantsNewsletter = formData.get("wants_newsletter") === "on";
  const wantsWhatsapp = formData.get("wants_whatsapp") === "on";

  if (!name || !email) {
    return { success: false, error: "Bitte Name und E-Mail angeben." };
  }
  if (!wantsNewsletter && !wantsWhatsapp) {
    return { success: false, error: "Bitte mindestens eine Option wählen." };
  }
  if (wantsWhatsapp && !phone) {
    return { success: false, error: "Für WhatsApp bitte Telefonnummer angeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("community_signups").insert({
    name,
    email,
    phone,
    wants_newsletter: wantsNewsletter,
    wants_whatsapp: wantsWhatsapp,
  });

  if (error) {
    console.error("communitySignup:", error.message);
    return { success: false, error: "Etwas ist schiefgelaufen. Bitte versuche es erneut." };
  }

  return { success: true };
}
