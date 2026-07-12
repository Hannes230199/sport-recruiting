import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function UnternehmenPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  let hasCompanyProfile = false;
  if (user) {
    const { data } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    hasCompanyProfile = !!data;
  }

  const ctaHref = !user
    ? "/login?next=/unternehmen/registrieren"
    : hasCompanyProfile
    ? "/unternehmen/job-posten"
    : "/unternehmen/registrieren";

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-6">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          🏢 Für Unternehmen
        </div>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Erreiche die besten{" "}
          <span className="text-brand-600">Sport-Talente</span>{" "}
          Deutschlands.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500">
          Schreib deine Stelle direkt auf SportRecruiting.de aus — der einzigen
          Jobbörse, die Kandidaten automatisch mit deiner Stelle matcht.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={ctaHref}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Stelle ausschreiben →
          </Link>
          {user && hasCompanyProfile && (
            <Link
              href="/unternehmen/meine-jobs"
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Meine Stellen
            </Link>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section>
        <h2 className="mb-8 text-lg font-bold text-slate-900">Warum SportRecruiting.de?</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: "🎯",
              title: "Automatisches Matching",
              desc: "Kandidaten sehen deinen Job mit einem persönlichen Match-Score — basierend auf Skills, Sportarten und Standort.",
            },
            {
              icon: "⚡",
              title: "Sofort live",
              desc: "Stellenanzeige in 5 Minuten erstellt. Nach kurzer Freigabe erscheint sie für tausende Sport-Professionals.",
            },
            {
              icon: "🏆",
              title: "Sport-Fokus",
              desc: "Keine Streuverluste — alle Kandidaten kommen aus der Sport-Branche und suchen aktiv nach Jobs.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-3xl">{icon}</p>
              <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-8 text-lg font-bold text-slate-900">So einfach geht&apos;s</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: "01", title: "Account anlegen", desc: "Registriere dein Unternehmen in wenigen Sekunden." },
            { step: "02", title: "Stelle beschreiben", desc: "Titel, Ort, Aufgaben, Profil — unser Formular führt dich." },
            { step: "03", title: "Kandidaten finden", desc: "Wir matchen automatisch und Kandidaten bewerben sich direkt." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{step}</p>
              <h3 className="mt-2 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section>
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 px-8 py-10 text-white">
          <h2 className="text-2xl font-extrabold">Bereit? Schreib jetzt deine Stelle aus.</h2>
          <p className="mt-2 text-sm opacity-80">Kostenlos · In 5 Minuten live · Gezielte Sport-Talente</p>
          <Link
            href={ctaHref}
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-opacity hover:opacity-90"
          >
            Jetzt starten →
          </Link>
        </div>
      </section>
    </div>
  );
}
