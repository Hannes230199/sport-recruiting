import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/types";
import { postJob } from "../actions";

const SPORT_CATEGORIES = [
  "Fußball", "Basketball", "Tennis", "Golf", "Handball", "Volleyball",
  "Leichtathletik", "Schwimmen", "Radsport", "Wintersport", "Motorsport",
  "Fitness- und Freizeitanlagen", "Marketing & Sponsoring", "Management & Verwaltung",
  "Eventmanagement", "Medien & Kommunikation", "Coaching & Training",
  "Reha & Physio", "eSports", "Sonstiges",
];

export default async function PostJobPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/unternehmen/job-posten");

  const { data: company } = await supabase
    .from("company_profiles")
    .select("company_name, website")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!company) redirect("/unternehmen/registrieren");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Schritt 2 von 2</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Stelle ausschreiben</h1>
        <p className="mt-1 text-sm text-slate-500">
          Als <span className="font-semibold text-slate-700">{company.company_name}</span> · Nach Freigabe erscheint die Stelle im Job-Board.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <form action={postJob} className="space-y-6">

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Stellentitel *
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="z.B. Marketing Manager Sport (m/w/d)"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Location + Employment Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Standort
              </label>
              <input
                name="location"
                type="text"
                placeholder="z.B. München, Bayern"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Anstellungsart
              </label>
              <select
                name="employment_type"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {Object.entries(EMPLOYMENT_TYPE_LABELS)
                  .filter(([k]) => k !== "unbekannt")
                  .map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Category + Salary */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Kategorie / Sportart
              </label>
              <select
                name="category"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Keine Auswahl</option>
                {SPORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Gehalt / Vergütung
              </label>
              <input
                name="salary_range"
                type="text"
                placeholder="z.B. 45.000–55.000 € / Jahr"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Stellenbeschreibung *
            </label>
            <p className="mb-2 text-xs text-slate-400">
              Beschreibe Aufgaben, Anforderungen und was du als Arbeitgeber bietest.
            </p>
            <textarea
              name="description"
              required
              rows={12}
              placeholder="Über uns:&#10;...&#10;&#10;Deine Aufgaben:&#10;- ...&#10;&#10;Dein Profil:&#10;- ...&#10;&#10;Wir bieten:&#10;- ..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* External URL */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Link zur Bewerbung
            </label>
            <p className="mb-2 text-xs text-slate-400">
              Optional: Externe URL, wo sich Kandidaten bewerben sollen (z.B. deine Karriereseite).
            </p>
            <input
              name="source_url"
              type="url"
              placeholder="https://dein-unternehmen.de/jobs/stelle"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
            ⏳ Deine Stelle wird nach kurzer Prüfung freigeschaltet (in der Regel innerhalb von 24h).
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Stelle einreichen →
          </button>
        </form>
      </div>
    </div>
  );
}
