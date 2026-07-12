import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isRecruiter } from "@/lib/data/profile";

const NAV_ITEMS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/profil", label: "Profil" },
  { href: "/bewerbungen", label: "Bewerbungen" },
];

export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const showRecruiterLink = user ? await isRecruiter(supabase, user.id) : false;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <svg width="24" height="24" viewBox="0 0 100 100" className="shrink-0">
            <rect width="100" height="100" rx="22" fill="#1d4ed8"/>
            <circle cx="50" cy="50" r="32" fill="none" stroke="white" strokeWidth="2.5" opacity="0.45"/>
            <polygon points="50,37 62,46 57,60 43,60 38,46" fill="white"/>
            <line x1="50" y1="37" x2="50" y2="18" stroke="white" strokeWidth="2" opacity="0.5"/>
            <line x1="62" y1="46" x2="78" y2="39" stroke="white" strokeWidth="2" opacity="0.5"/>
            <line x1="57" y1="60" x2="67" y2="76" stroke="white" strokeWidth="2" opacity="0.5"/>
            <line x1="43" y1="60" x2="33" y2="76" stroke="white" strokeWidth="2" opacity="0.5"/>
            <line x1="38" y1="46" x2="22" y2="39" stroke="white" strokeWidth="2" opacity="0.5"/>
          </svg>
          <span className="text-base font-bold tracking-tight text-slate-900">
            SportRecruiting<span className="text-slate-400 font-normal">.de</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 text-sm font-medium text-slate-600">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
          {showRecruiterLink && (
            <Link
              href="/recruiter"
              className="rounded-md px-3 py-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Recruiter
            </Link>
          )}
          {user ? (
            <form action="/auth/signout" method="post" className="ml-2">
              <button
                type="submit"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Abmelden
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Anmelden
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
