import { JobCard } from "@/components/JobCard";
import { EMPLOYMENT_TYPE_LABELS, EmploymentType, JOB_SOURCES } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getJobCategories, getJobs } from "@/lib/data/jobs";

interface JobsPageProps {
  searchParams: Promise<{
    q?: string;
    source?: string;
    category?: string;
    employmentType?: string;
  }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const source = params.source ?? "";
  const category = params.category ?? "";
  const employmentType = params.employmentType ?? "";

  const supabase = await createClient();
  const [categories, filtered] = await Promise.all([
    getJobCategories(supabase),
    getJobs(supabase, { q, source, category, employmentType }),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-5" method="get">
          <h2 className="text-sm font-semibold text-slate-900">Jobs filtern</h2>

          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Suche
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={params.q ?? ""}
              placeholder="z.B. Trainer, Marketing, Köln..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="source" className="mb-1 block text-xs font-medium text-slate-600">
              Quelle
            </label>
            <select
              id="source"
              name="source"
              defaultValue={source}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Alle Quellen</option>
              {JOB_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="mb-1 block text-xs font-medium text-slate-600">
              Kategorie
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Alle Kategorien</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="employmentType" className="mb-1 block text-xs font-medium text-slate-600">
              Anstellungsart
            </label>
            <select
              id="employmentType"
              name="employmentType"
              defaultValue={employmentType}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Alle Anstellungsarten</option>
              {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Filtern
            </button>
            <a
              href="/jobs"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Zurücksetzen
            </a>
          </div>
        </form>
      </aside>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-slate-900">Stellenangebote</h1>
          <p className="text-sm text-slate-500">{filtered.length} Treffer</p>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Keine Jobs gefunden, die zu deinen Filtern passen. Versuche es mit
            weniger Filtern.
          </p>
        ) : (
          <div className="grid gap-4">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
