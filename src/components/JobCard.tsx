import Link from "next/link";
import { EMPLOYMENT_TYPE_LABELS, Job, JOB_SOURCES } from "@/lib/types";

function sourceLabel(source: Job["source"]): string {
  return JOB_SOURCES.find((s) => s.id === source)?.label ?? source;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function JobCard({ job, matchScore }: { job: Job; matchScore?: number }) {
  const posted = formatDate(job.postedAt);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">
            {job.title}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {job.company ?? "Unbekanntes Unternehmen"}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        {typeof matchScore === "number" && (
          <span className="shrink-0 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            {matchScore}% Match
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
          {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
        </span>
        {job.category && (
          <span className="rounded-full bg-accent-100 px-2.5 py-1 font-medium text-accent-700">
            {job.category}
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500">
          {sourceLabel(job.source)}
        </span>
        {posted && <span className="ml-auto text-slate-400">{posted}</span>}
      </div>

      {job.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
