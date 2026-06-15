import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isRecruiter } from "@/lib/data/profile";

const NAV_ITEMS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/profil", label: "Mein Profil" },
  { href: "/bewerbungen", label: "Meine Bewerbungen" },
];

export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const showRecruiterLink = user ? await isRecruiter(supabase, user.id) : false;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-brand-700">
          SportRecruiting<span className="text-slate-900">.de</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand-700">
              {item.label}
            </Link>
          ))}
          {showRecruiterLink && (
            <Link href="/recruiter" className="hover:text-brand-700">
              Recruiter
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-400 sm:inline">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button type="submit" className="hover:text-brand-700">
                  Abmelden
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
            >
              Anmelden
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
