import Link from "next/link";
import { notFound } from "next/navigation";
import { APPLICATION_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS, JOB_SOURCES } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getJobById } from "@/lib/data/jobs";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getApplicationForJob } from "@/lib/data/applications";
import { scoreJobForCandidate } from "@/lib/matching";
import { applyToJob } from "./actions";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

function sourceLabel(source: string): string {
  return JOB_SOURCES.find((s) => s.id === source)?.label ?? source;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const job = await getJobById(supabase, id);
  if (!job) notFound();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  let match = null;
  let existingApplication = null;

  if (user) {
    const profile = await getOrCreateProfile(supabase, user.id, user.email ?? "");
    match = scoreJobForCandidate(job, profile);
    existingApplication = await getApplicationForJob(supabase, user.id, job.id);
  }

  const posted = formatDate(job.postedAt);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <article className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          ← Zurück zur Übersicht
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">{job.title}</h1>
        <p className="mt-1 text-base text-slate-500">
          {job.company ?? "Unbekanntes Unternehmen"}
          {job.location ? ` · ${job.location}` : ""}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
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
          {posted && <span className="text-slate-400">veröffentlicht am {posted}</span>}
        </div>

        {job.salaryRange && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
            💶 {job.salaryRange}
          </div>
        )}

        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {job.description}
        </div>

        {job.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {!user ? (
            <Link
              href={`/login?next=/jobs/${job.id}`}
              className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Anmelden, um dich zu bewerben
            </Link>
          ) : existingApplication ? (
            <span className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700">
              Bewerbung gesendet · Status: {APPLICATION_STATUS_LABELS[existingApplication.status]}
            </span>
          ) : (
            <form action={applyToJob.bind(null, job.id)}>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Jetzt bewerben
              </button>
            </form>
          )}
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Original-Anzeige ↗
          </a>
        </div>
        {user && !existingApplication && (
          <p className="mt-2 text-xs text-slate-400">
            Beim Bewerben wird dein aktuelles Profil als Bewerbung gespeichert.
          </p>
        )}
      </article>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Dein Match</h2>
            {match && (
              <span className="rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
                {match.score}%
              </span>
            )}
          </div>
          {!user ? (
            <p className="mt-3 text-sm text-slate-500">
              <Link
                href={`/login?next=/jobs/${job.id}`}
                className="font-semibold text-brand-600 hover:underline"
              >
                Melde dich an
              </Link>
              , um deinen Match-Score zu sehen.
            </p>
          ) : match && match.reasons.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {match.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="text-brand-500">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Noch keine Übereinstimmungen mit deinem Profil gefunden.
            </p>
          )}
          {user && (
            <Link
              href="/profil"
              className="mt-4 block rounded-lg bg-brand-50 py-2 text-center text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
            >
              Profil verbessern →
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
