import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Loggt den aktuellen Nutzer aus (Supabase-Session-Cookies werden entfernt)
 * und leitet zurück zur Startseite. Wird vom "Abmelden"-Button im Header
 * per POST aufgerufen.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
