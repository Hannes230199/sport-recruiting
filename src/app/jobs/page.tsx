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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200";

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
      {/* Filter Sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <form
          className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
          method="get"
        >
          <h2 className="text-sm font-bold text-slate-900">Filter</h2>

          <div>
            <label htmlFor="q" className="mb-1.5 block text-xs font-medium text-slate-500">
              Suche
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={params.q ?? ""}
              placeholder="Titel, Ort, Unternehmen…"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="source" className="mb-1.5 block text-xs font-medium text-slate-500">
              Quelle
            </label>
            <select id="source" name="source" defaultValue={source} className={inputClass}>
              <option value="">Alle Quellen</option>
              {JOB_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="mb-1.5 block text-xs font-medium text-slate-500">
              Kategorie
            </label>
            <select id="category" name="category" defaultValue={category} className={inputClass}>
              <option value="">Alle Kategorien</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="employmentType" className="mb-1.5 block text-xs font-medium text-slate-500">
              Anstellungsart
            </label>
            <select
              id="employmentType"
              name="employmentType"
              defaultValue={employmentType}
              className={inputClass}
            >
              <option value="">Alle Arten</option>
              {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Filtern
            </button>
            <a
              href="/jobs"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
            >
              Reset
            </a>
          </div>
        </form>
      </aside>

      {/* Results */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Stellenangebote</h1>
          <p className="text-sm text-slate-400">{filtered.length} Treffer</p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Keine Jobs gefunden. Versuche es mit weniger Filtern.
          </div>
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
