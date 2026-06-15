import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin-Client mit Service-Role-Key - umgeht Row Level Security (RLS).
 *
 * NUR verwenden in:
 *  - Scraper-Skripten (src/scrapers/runner.ts), die Jobs in die DB schreiben
 *  - Cron-/Server-only Route Handlers (z.B. /api/scrape-trigger)
 *
 * NIEMALS in Client Components oder Code importieren, der ans Frontend
 * ausgeliefert wird - der Service-Role-Key hat vollen DB-Zugriff!
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein (siehe .env.example)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
