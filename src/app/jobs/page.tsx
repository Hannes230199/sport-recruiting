import { JobCard } from "@/components/JobCard";
import { EMPLOYMENT_TYPE_LABELS, EmploymentType } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getJobCategories, getJobs } from "@/lib/data/jobs";
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

  const [categories, allJobs] = await Promise.all([
    getJobCategories(supabase),
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

  // Sort: by score only when user explicitly filters by minScore, otherwise keep DB date order
  if (candidate && minScore > 0) {
    jobsWithScore.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const hasFilters = q || category || location || employmentType || minScore > 0;

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: "linear-gradient(135deg, #1a4a2e 0%, #166534 20%, #0f766e 50%, #0369a1 80%, #1e3a5f 100%)" }}>
      {/* Background blobs */}
      <div className="pointer-events-none absolute rounded-full" style={{ width: 600, height: 600, background: "rgba(34,197,94,0.18)", filter: "blur(90px)", top: -150, left: -100 }} />
      <div className="pointer-events-none absolute rounded-full" style={{ width: 500, height: 500, background: "rgba(56,189,248,0.15)", filter: "blur(80px)", top: 200, right: -120 }} />
      <div className="pointer-events-none absolute rounded-full" style={{ width: 400, height: 400, background: "rgba(16,185,129,0.12)", filter: "blur(70px)", bottom: 100, left: 200 }} />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Page header */}
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Stellenangebote</h1>
            <p className="mt-0.5 text-sm text-white/50">{jobsWithScore.length} Treffer</p>
          </div>
        </div>

        {/* Filter bar — glass */}
        <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/20 px-5 py-4" style={{ backdropFilter: "blur(20px)", background: "rgba(255,255,255,0.10)" }}>
          {/* Suche */}
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Suche</label>
            <input
              name="q"
              type="text"
              defaultValue={params.q ?? ""}
              placeholder="Titel, Ort, Unternehmen…"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none focus:bg-white/15"
            />
          </div>

          {/* Standort */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Standort</label>
            <input
              name="location"
              type="text"
              defaultValue={params.location ?? ""}
              placeholder="Stadt oder Region…"
              className="w-40 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none focus:bg-white/15"
            />
          </div>

          {/* Kategorie */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Kategorie</label>
            <select name="category" defaultValue={category} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white focus:border-white/40 focus:outline-none">
              <option value="" className="text-slate-900">Alle</option>
              {categories.map((c) => (
                <option key={c} value={c} className="text-slate-900">{c}</option>
              ))}
            </select>
          </div>

          {/* Anstellung */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Anstellung</label>
            <select name="employmentType" defaultValue={employmentType} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white focus:border-white/40 focus:outline-none">
              <option value="" className="text-slate-900">Alle</option>
              {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(([value, label]) => (
                <option key={value} value={value} className="text-slate-900">{label}</option>
              ))}
            </select>
          </div>

          {/* Match Score */}
          {candidate && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Match</label>
              <select name="minScore" defaultValue={params.minScore ?? ""} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white focus:border-white/40 focus:outline-none">
                {MIN_SCORE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-slate-900">{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-green-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-green-400">
              Filtern
            </button>
            <a
              href="/jobs"
              className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors ${hasFilters ? "border-red-300/40 bg-red-400/20 text-red-200 hover:bg-red-400/30" : "border-white/10 text-white/20 pointer-events-none"}`}
              aria-disabled={!hasFilters}
            >
              ✕ Filter löschen
            </a>
          </div>
        </form>

        {/* Results */}
        {jobsWithScore.length === 0 ? (
          <div className="rounded-2xl border border-white/20 p-8 text-center text-sm text-white/50" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.08)" }}>
            Keine Jobs gefunden. Versuche es mit weniger Filtern.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/20" style={{ backdropFilter: "blur(20px)", background: "rgba(255,255,255,0.10)" }}>
            {jobsWithScore.map(({ job, score }) => (
              <JobCard key={job.id} job={job} matchScore={score && score > 0 ? score : undefined} dark={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
