import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isRecruiter } from "@/lib/data/profile";

const NAV_ITEMS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/profil", label: "Mein Profil" },
  { href: "/bewerbungen", label: "Bewerbungen" },
];

export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const showRecruiterLink = user ? await isRecruiter(supabase, user.id) : false;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-1">
          <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
            SportRecruiting
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-800">.de</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
          {showRecruiterLink && (
            <Link
              href="/recruiter"
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-accent-100 hover:text-accent-700"
            >
              Recruiter
            </Link>
          )}
          {user ? (
            <form action="/auth/signout" method="post" className="ml-2">
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                Abmelden
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-lg bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Anmelden
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
