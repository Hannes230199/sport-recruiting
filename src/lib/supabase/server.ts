import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-Client für den Einsatz in Server Components, Route Handlers
 * und Server Actions. Liest/schreibt die Auth-Session über Cookies.
 *
 * Verwendung (in einer async Server Component oder Route Handler):
 *   const supabase = await createClient();
 *   const { data } = await supabase.from("jobs").select("*");
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll wurde aus einer Server Component aufgerufen.
            // Das kann ignoriert werden, wenn Middleware die Session
            // refresht (siehe README für Middleware-Setup).
          }
        },
      },
    }
  );
}
