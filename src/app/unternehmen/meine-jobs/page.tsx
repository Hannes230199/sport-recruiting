import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EMPLOYMENT_TYPE_LABELS, EmploymentType } from "@/lib/types";

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function MeineJobsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/unternehmen/meine-jobs");

  const { data: company } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!company) redirect("/unternehmen/registrieren");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, location, employment_type, category, is_approved, posted_at, is_active")
    .eq("posted_by", authData.user.id)
    .order("posted_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meine Stellenanzeigen</h1>
          <p className="mt-1 text-sm text-slate-500">{company.company_name}</p>
        </div>
        <Link
          href="/unternehmen/job-posten"
          className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          + Neue Stelle
        </Link>
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-sm">
          <p className="text-3xl">📋</p>
          <h2 className="mt-3 font-bold text-slate-900">Noch keine Stellen</h2>
          <p className="mt-1 text-sm text-slate-500">Schreib jetzt deine erste Stelle aus.</p>
          <Link
            href="/unternehmen/job-posten"
            className="mt-4 inline-block rounded-xl bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            Stelle ausschreiben →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Stelle</th>
                <th className="px-5 py-3">Ort</th>
                <th className="px-5 py-3">Art</th>
                <th className="px-5 py-3">Eingereicht</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {job.title}
                    {job.category && (
                      <span className="ml-2 rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-700">
                        {job.category}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{job.location ?? "–"}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type as EmploymentType]}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{formatDate(job.posted_at)}</td>
                  <td className="px-5 py-3.5">
                    {job.is_approved ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        ✓ Live
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        ⏳ In Prüfung
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Fragen? Schreib uns: <a href="mailto:info@sportrecruiting.de" className="text-brand-600 hover:underline">info@sportrecruiting.de</a>
      </p>
    </div>
  );
}
