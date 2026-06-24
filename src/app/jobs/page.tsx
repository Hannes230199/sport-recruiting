import { JobCard } from "@/components/JobCard";
import { EMPLOYMENT_TYPE_LABELS, EmploymentType } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getJobCategories, getJobLocations, getJobs } from "@/lib/data/jobs";
import { getOrCreateProfile } from "@/lib/data/profile";
import { scoreJobForCandidate } from "@/lib/matching";

interface JobsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    employmentType?: string;
    minScore?: string;
  }>;
}

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200";

const MIN_SCORE_OPTIONS = [
  { value: "", label: "Alle" },
  { value: "25", label: "25%+" },
  { value: "50", label: "50%+" },
  { value: "75", label: "75%+" },
];

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const location = params.location ?? "";
  const employmentType = params.employmentType ?? "";
  const minScore = parseInt(params.minScore ?? "0", 10) || 0;

  const supabase = await createClient();

  // Try to get user profile for matching (optional — no redirect if not logged in)
  const { data: authData } = await supabase.auth.getUser();
  const candidate = authData.user
    ? await getOrCreateProfile(supabase, authData.user.id, authData.user.email ?? "").catch(() => null)
    : null;

  const [categories, locations, allJobs] = await Promise.all([
    getJobCategories(supabase),
    getJobLocations(supabase),
    getJobs(supabase, { q, category, location, employmentType }),
  ]);

  // Compute match scores if user is logged in
  type JobWithScore = { job: (typeof allJobs)[0]; score: number | undefined };
  let jobsWithScore: JobWithScore[] = allJobs.map((job) => ({
    job,
    score: candidate ? scoreJobForCandidate(job, candidate).score : undefined,
  }));

  // Apply minScore filter
  if (minScore > 0 && candidate) {
    jobsWithScore = jobsWithScore.filter((j) => (j.score ?? 0) >= minScore);
  }

  // Sort: if logged in, highest score first; otherwise by posted_at (already sorted by DB)
  if (candidate) {
    jobsWithScore.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const hasFilters = q || category || location || employmentType || minScore > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stellenangebote</h1>
          <p className="mt-0.5 text-sm text-slate-400">{jobsWithScore.length} Treffer</p>
        </div>
      </div>

      {/* Horizontal filter bar */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        {/* Suche */}
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

        {/* Standort */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Standort
          </label>
          <select name="location" defaultValue={location} className={selectClass}>
            <option value="">Alle Standorte</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Kategorie */}
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

        {/* Anstellung */}
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

        {/* Match Score — only show if logged in */}
        {candidate && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Match
            </label>
            <select name="minScore" defaultValue={params.minScore ?? ""} className={selectClass}>
              {MIN_SCORE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

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
      {jobsWithScore.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Keine Jobs gefunden. Versuche es mit weniger Filtern.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {jobsWithScore.map(({ job, score }) => (
            <JobCard key={job.id} job={job} matchScore={score && score > 0 ? score : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
