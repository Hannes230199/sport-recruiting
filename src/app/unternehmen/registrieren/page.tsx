import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerCompany } from "../actions";

export default async function RegisterCompanyPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/unternehmen/registrieren");

  // Already registered → skip to job posting
  const { data: existing } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (existing) redirect("/unternehmen/job-posten");

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Schritt 1 von 2</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Unternehmen registrieren</h1>
        <p className="mt-1 text-sm text-slate-500">
          Einmalig — danach kannst du sofort Stellen ausschreiben.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <form action={registerCompany} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Unternehmensname *
            </label>
            <input
              name="company_name"
              type="text"
              required
              placeholder="FC Bayern München GmbH"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Website
            </label>
            <input
              name="website"
              type="url"
              placeholder="https://www.beispiel.de"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Ansprechpartner *
              </label>
              <input
                name="contact_name"
                type="text"
                required
                placeholder="Max Mustermann"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Kontakt-E-Mail *
              </label>
              <input
                name="contact_email"
                type="email"
                required
                defaultValue={authData.user.email ?? ""}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Weiter zur Stellenanzeige →
          </button>
        </form>
      </div>
    </div>
  );
}
