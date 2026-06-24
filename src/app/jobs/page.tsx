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

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200";

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

  const hasFilters = q || source || category || employmentType;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stellenangebote</h1>
          <p className="mt-0.5 text-sm text-slate-400">{filtered.length} Treffer</p>
        </div>
      </div>

      {/* Horizontal filter bar — DACHpulse style */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Suche
          </label>
          <input
            name="q"
            type="text"
            defaultValue={params.q ?? ""}
            placeholder="Titel, Ort, Unternehmen…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Quelle
          </label>
          <select name="source" defaultValue={source} className={selectClass}>
            <option value="">Alle Quellen</option>
            {JOB_SOURCES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Kategorie
          </label>
          <select name="category" defaultValue={category} className={selectClass}>
            <option value="">Alle</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Anstellung
          </label>
          <select name="employmentType" defaultValue={employmentType} className={selectClass}>
            <option value="">Alle</option>
            {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>{label}</option>
              )
            )}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Filtern
          </button>
          {hasFilters && (
            <a
              href="/jobs"
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
            >
              Reset
            </a>
          )}
        </div>
      </form>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Keine Jobs gefunden. Versuche es mit weniger Filtern.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
