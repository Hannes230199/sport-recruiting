import Link from "next/link";
import { redirect } from "next/navigation";
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getApplications } from "@/lib/data/applications";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-slate-100 text-slate-500",
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

  if (!user) {
    redirect("/login?next=/bewerbungen");
  }

  const applications = await getApplications(supabase, user.id);

  const counts = applications.reduce<Record<ApplicationStatus, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meine Bewerbungen</h1>
        <p className="mt-1 text-sm text-slate-600">
          Übersicht über alle Bewerbungen und ihren aktuellen Status.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {(Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][]).map(
          ([status, label]) => (
            <div key={status} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{counts[status] ?? 0}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
            </div>
          )
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Unternehmen</th>
              <th className="px-4 py-3 font-medium">Match</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Beworben am</th>
              <th className="px-4 py-3 font-medium">Notizen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr key={app.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {app.job ? (
                    <Link href={`/jobs/${app.job.id}`} className="hover:text-brand-700 hover:underline">
                      {app.job.title}
                    </Link>
                  ) : (
                    "Unbekannter Job"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{app.job?.company ?? "–"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {typeof app.matchScore === "number" ? `${app.matchScore}%` : "–"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[app.status]}`}
                  >
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(app.appliedAt)}</td>
                <td className="px-4 py-3 text-slate-500">{app.notes ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {applications.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Du hast dich noch nicht beworben.{" "}
          <Link href="/jobs" className="font-medium text-brand-700 hover:underline">
            Jetzt passende Jobs finden →
          </Link>
        </p>
      )}
    </div>
  );
}
