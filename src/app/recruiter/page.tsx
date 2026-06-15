import Link from "next/link";
import { redirect } from "next/navigation";
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getAllApplications } from "@/lib/data/applications";
import { updateStatus } from "./actions";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-slate-100 text-slate-500",
};

const STATUS_OPTIONS = Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][];

const VALID_STATUSES = new Set<ApplicationStatus>(STATUS_OPTIONS.map(([status]) => status));

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

  if (!user) {
    redirect("/login?next=/recruiter");
  }

  const profile = await getOrCreateProfile(supabase, user.id, user.email ?? "");

  if (!profile.isRecruiter) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <h1 className="text-lg font-semibold text-slate-900">Kein Zugriff</h1>
        <p className="mt-2">
          Dieser Bereich ist nur für Recruiter:innen freigeschaltet. Falls du Zugriff brauchst,
          wende dich an die Administration.
        </p>
        <Link href="/" className="mt-4 inline-block font-medium text-brand-700 hover:underline">
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
        <p className="mt-1 text-sm text-slate-600">
          Übersicht über alle eingegangenen Bewerbungen. Status und Notizen können hier direkt
          aktualisiert werden.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/recruiter"
          className={`rounded-full px-3 py-1.5 font-medium ${
            !statusFilter ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Alle ({allApplications.length})
        </Link>
        {STATUS_OPTIONS.map(([status, label]) => (
          <Link
            key={status}
            href={`/recruiter?status=${status}`}
            className={`rounded-full px-3 py-1.5 font-medium ${
              statusFilter === status
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label} ({counts[status] ?? 0})
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Kandidat:in</th>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Unternehmen</th>
              <th className="px-4 py-3 font-medium">Match</th>
              <th className="px-4 py-3 font-medium">Beworben am</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Bearbeiten</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr key={app.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{app.candidate?.fullName || "–"}</p>
                  <p className="text-xs text-slate-500">{app.candidate?.email}</p>
                </td>
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
                <td className="px-4 py-3 text-slate-600">{formatDate(app.appliedAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[app.status]}`}
                  >
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={updateStatus} className="flex flex-col gap-2">
                    <input type="hidden" name="applicationId" value={app.id} />
                    <select
                      name="status"
                      defaultValue={app.status}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
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
                      placeholder="Interne Notiz..."
                      className="w-48 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                    />
                    <button
                      type="submit"
                      className="self-start rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
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
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Keine Bewerbungen{statusFilter ? ` mit Status „${APPLICATION_STATUS_LABELS[statusFilter]}"` : ""}{" "}
          gefunden.
        </p>
      )}
    </div>
  );
}
