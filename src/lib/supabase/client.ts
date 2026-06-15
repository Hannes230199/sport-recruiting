"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase-Client für den Einsatz in Client Components ("use client").
 *
 * Verwendung:
 *   const supabase = createClient();
 *   const { data } = await supabase.from("jobs").select("*");
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
