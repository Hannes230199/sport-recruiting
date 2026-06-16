import Link from "next/link";
import { redirect } from "next/navigation";
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getAllApplications } from "@/lib/data/applications";
import { updateStatus } from "./actions";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  draft:     "bg-slate-100 text-slate-600",
  submitted: "bg-brand-50 text-brand-700",
  in_review: "bg-amber-50 text-amber-700",
  interview: "bg-accent-100 text-accent-700",
  offer:     "bg-green-50 text-green-700",
  rejected:  "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-400",
};

const STATUS_OPTIONS = Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][];
const VALID_STATUSES = new Set<ApplicationStatus>(STATUS_OPTIONS.map(([s]) => s));

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface RecruiterPageProps {
  searchParams: { status?: string };
}

export default async function RecruiterPage({ searchParams }: RecruiterPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login?next=/recruiter");

  const profile = await getOrCreateProfile(supabase, user.id, user.email ?? "");

  if (!profile.isRecruiter) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm">
        <p className="text-3xl">🔒</p>
        <h1 className="mt-3 text-lg font-bold text-slate-900">Kein Zugriff</h1>
        <p className="mt-2 text-sm text-slate-500">
          Dieser Bereich ist nur für Recruiter:innen freigeschaltet. Wende dich an die Administration.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
        >
          Zur Startseite
        </Link>
      </div>
    );
  }

  const statusFilterRaw = searchParams.status;
  const statusFilter =
    statusFilterRaw && VALID_STATUSES.has(statusFilterRaw as ApplicationStatus)
      ? (statusFilterRaw as ApplicationStatus)
      : undefined;

  const allApplications = await getAllApplications(supabase);
  const applications = statusFilter
    ? allApplications.filter((app) => app.status === statusFilter)
    : allApplications;

  const counts = allApplications.reduce<Record<ApplicationStatus, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bewerbungen verwalten</h1>
        <p className="mt-1 text-sm text-slate-500">
          Alle eingegangenen Bewerbungen – Status und Notizen direkt hier aktualisieren.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/recruiter"
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
            href={`/recruiter?status=${status}`}
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Kandidat:in</th>
              <th className="px-5 py-3">Job</th>
              <th className="px-5 py-3">Unternehmen</th>
              <th className="px-5 py-3">Match</th>
              <th className="px-5 py-3">Datum</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Bearbeiten</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {applications.map((app) => (
              <tr key={app.id} className="transition-colors hover:bg-brand-50/30">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-slate-900">{app.candidate?.fullName || "–"}</p>
                  <p className="text-xs text-slate-400">{app.candidate?.email}</p>
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800">
                  {app.job ? (
                    <Link href={`/jobs/${app.job.id}`} className="hover:text-brand-700 hover:underline">
                      {app.job.title}
                    </Link>
                  ) : (
                    "Unbekannter Job"
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-500">{app.job?.company ?? "–"}</td>
                <td className="px-5 py-3.5">
                  {typeof app.matchScore === "number" ? (
                    <span className="font-semibold text-brand-600">{app.matchScore}%</span>
                  ) : (
                    <span className="text-slate-400">–</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-400">{formatDate(app.appliedAt)}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[app.status]}`}>
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <form action={updateStatus} className="flex flex-col gap-2">
                    <input type="hidden" name="applicationId" value={app.id} />
                    <select
                      name="status"
                      defaultValue={app.status}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map(([status, label]) => (
                        <option key={status} value={status}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      name="notes"
                      defaultValue={app.notes ?? ""}
                      rows={2}
                      placeholder="Interne Notiz…"
                      className="w-44 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="self-start rounded-lg bg-gradient-to-r from-brand-600 to-accent-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                      Speichern
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {applications.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Keine Bewerbungen
          {statusFilter ? ` mit Status „${APPLICATION_STATUS_LABELS[statusFilter]}"` : ""} gefunden.
        </div>
      )}
    </div>
  );
}
