import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Aktualisiert die Supabase-Auth-Session anhand der Request-Cookies und
 * schreibt ggf. neue Cookies in die Response. Wird von `src/middleware.ts`
 * für (fast) jeden Request aufgerufen, damit abgelaufene Access-Tokens
 * automatisch erneuert werden, bevor Server Components sie lesen.
 *
 * Vorlage: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Wichtig: getUser() (statt getSession()) validiert den Token gegen
  // Supabase und erneuert ihn bei Bedarf - sorgt dafür, dass Server
  // Components immer eine gültige Session sehen.
  await supabase.auth.getUser();

  return response;
}
