import Link from "next/link";
import { redirect } from "next/navigation";
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getApplications } from "@/lib/data/applications";

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

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function BewerbungenPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login?next=/bewerbungen");

  const applications = await getApplications(supabase, user.id);

  const counts = applications.reduce<Record<ApplicationStatus, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meine Bewerbungen</h1>
        <p className="mt-1 text-sm text-slate-500">
          Übersicht über alle Bewerbungen und ihren aktuellen Status.
        </p>
      </div>

      {/* Status overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {(Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][]).map(
          ([status, label]) => (
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
          )
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Job</th>
              <th className="px-5 py-3">Unternehmen</th>
              <th className="px-5 py-3">Match</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Datum</th>
              <th className="px-5 py-3">Notizen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-brand-50/30 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  {app.job ? (
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="hover:text-brand-700 hover:underline"
                    >
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
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[app.status]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[app.status]}`} />
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400">{formatDate(app.appliedAt)}</td>
                <td className="px-5 py-3.5 text-slate-400">{app.notes ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {applications.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm shadow-sm">
          <p className="text-2xl">📋</p>
          <p className="mt-2 font-medium text-slate-700">Noch keine Bewerbungen.</p>
          <Link
            href="/jobs"
            className="mt-3 inline-block font-semibold text-brand-600 hover:underline"
          >
            Jetzt passende Jobs finden →
          </Link>
        </div>
      )}
    </div>
  );
}
