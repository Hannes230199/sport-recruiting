import Link from "next/link";
import { redirect } from "next/navigation";
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getApplications } from "@/lib/data/applications";
import { withdrawApplicationAction } from "./actions";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  draft:     "bg-slate-100 text-slate-600",
  submitted: "bg-brand-50 text-brand-700",
  in_review: "bg-amber-50 text-amber-700",
  interview: "bg-accent-100 text-accent-700",
  offer:     "bg-green-50 text-green-700",
  rejected:  "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-400",
};

const STATUS_DOT: Record<ApplicationStatus, string> = {
  draft:     "bg-slate-300",
  submitted: "bg-brand-400",
  in_review: "bg-amber-400",
  interview: "bg-accent-500",
  offer:     "bg-green-500",
  rejected:  "bg-red-400",
  withdrawn: "bg-slate-300",
};

const STATUS_OPTIONS = Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][];
const VALID_STATUSES = new Set<ApplicationStatus>(STATUS_OPTIONS.map(([s]) => s));

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface BewerbungenPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BewerbungenPage({ searchParams }: BewerbungenPageProps) {
  const { status: statusRaw } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login?next=/bewerbungen");

  const allApplications = await getApplications(supabase, user.id);

  const statusFilter =
    statusRaw && VALID_STATUSES.has(statusRaw as ApplicationStatus)
      ? (statusRaw as ApplicationStatus)
      : undefined;

  const applications = statusFilter
    ? allApplications.filter((a) => a.status === statusFilter)
    : allApplications;

  const counts = allApplications.reduce<Record<ApplicationStatus, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meine Bewerbungen</h1>
        <p className="mt-1 text-sm text-slate-500">
          Übersicht über alle Bewerbungen, die du hier trackst.
        </p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {STATUS_OPTIONS.map(([status, label]) => (
          <div
            key={status}
            className="rounded-2xl border border-brand-100 bg-white p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-extrabold text-slate-900">{counts[status] ?? 0}</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-500">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/bewerbungen"
          className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
            !statusFilter
              ? "bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
          }`}
        >
          Alle ({allApplications.length})
        </Link>
        {STATUS_OPTIONS.map(([status, label]) => (
          <Link
            key={status}
            href={`/bewerbungen?status=${status}`}
            className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
              statusFilter === status
                ? "bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {label} ({counts[status] ?? 0})
          </Link>
        ))}
      </div>

      {/* Application cards */}
      {applications.length === 0 ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-sm">
          <p className="text-3xl">📋</p>
          <p className="mt-3 font-semibold text-slate-700">
            {statusFilter
              ? `Keine Bewerbungen mit Status „${APPLICATION_STATUS_LABELS[statusFilter]}"`
              : "Noch keine Bewerbungen getrackt."}
          </p>
          {!statusFilter && (
            <p className="mt-1 text-sm text-slate-500">
              {'Öffne eine Stellenanzeige und klicke auf „Bewerbung tracken", um sie hier zu speichern.'}
            </p>
          )}
          <Link
            href="/jobs"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Jobs durchsuchen →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
            >
              {/* Left: job info */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {app.job ? (
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                    >
                      {app.job.title}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-900">Unbekannter Job</span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[app.status]}`} />
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {app.job?.company ?? "–"}
                  {app.job?.location ? ` · ${app.job.location}` : ""}
                </p>
                {app.notes && (
                  <p className="text-xs text-slate-400 italic">{app.notes}</p>
                )}
              </div>

              {/* Right: meta + actions */}
              <div className="flex shrink-0 items-center gap-4">
                {typeof app.matchScore === "number" && (
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-400">Match</p>
                    <p className="text-lg font-extrabold text-brand-600">{app.matchScore}%</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-400">Datum</p>
                  <p className="text-sm font-semibold text-slate-700">{formatDate(app.appliedAt)}</p>
                </div>
                {app.job && (
                  <a
                    href={app.job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Anzeige ↗
                  </a>
                )}
                {app.status !== "withdrawn" && (
                  <form action={withdrawApplicationAction.bind(null, app.id)}>
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      Zurückziehen
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
