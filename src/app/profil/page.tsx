import { redirect } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { EMPLOYMENT_TYPE_LABELS, EmploymentType, DocumentType } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getJobs } from "@/lib/data/jobs";
import { rankJobsForCandidate } from "@/lib/matching";
import { saveProfile, removeDocument, uploadDocument } from "./actions";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  cv: "Lebenslauf",
  cover_letter: "Anschreiben",
  certificate: "Zertifikat / Lizenz",
  reference: "Referenz / Arbeitszeugnis",
  other: "Sonstiges",
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface ProfilPageProps {
  searchParams: Promise<{ message?: string; error?: string }>;
}

export default async function ProfilPage({ searchParams }: ProfilPageProps) {
  const { message, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/profil");
  }

  const candidate = await getOrCreateProfile(supabase, user.id, user.email ?? "");
  const allJobs = await getJobs(supabase, {});
  const matches = rankJobsForCandidate(allJobs, candidate).filter((m) => m.score > 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mein Profil</h1>
        <p className="mt-1 text-sm text-slate-600">
          Diese Angaben werden genutzt, um dich automatisch mit passenden
          Stellenangeboten zu matchen.
        </p>
      </div>

      <form action={saveProfile} className="space-y-10">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Persönliche Angaben</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-slate-600">
                Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                defaultValue={candidate.fullName}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-600">
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={candidate.email}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-medium text-slate-600">
                Telefon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={candidate.phone ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="location" className="mb-1 block text-xs font-medium text-slate-600">
                Wohnort
              </label>
              <input
                id="location"
                name="location"
                type="text"
                defaultValue={candidate.location ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bio" className="mb-1 block text-xs font-medium text-slate-600">
                Über mich
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                defaultValue={candidate.bio ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Matching-Kriterien</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sports" className="mb-1 block text-xs font-medium text-slate-600">
                Sportarten (kommagetrennt)
              </label>
              <input
                id="sports"
                name="sports"
                type="text"
                defaultValue={candidate.sports.join(", ")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="desiredRoles" className="mb-1 block text-xs font-medium text-slate-600">
                Wunschrollen (kommagetrennt)
              </label>
              <input
                id="desiredRoles"
                name="desiredRoles"
                type="text"
                defaultValue={candidate.desiredRoles.join(", ")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="skills" className="mb-1 block text-xs font-medium text-slate-600">
                Skills (kommagetrennt)
              </label>
              <input
                id="skills"
                name="skills"
                type="text"
                defaultValue={candidate.skills.join(", ")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="desiredLocations" className="mb-1 block text-xs font-medium text-slate-600">
                Wunschstandorte (kommagetrennt)
              </label>
              <input
                id="desiredLocations"
                name="desiredLocations"
                type="text"
                defaultValue={candidate.desiredLocations.join(", ")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">Anstellungsarten</span>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
                  ([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="employmentTypes"
                        value={value}
                        defaultChecked={candidate.employmentTypes.includes(value)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      {label}
                    </label>
                  )
                )}
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Profil speichern
          </button>
        </section>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Dokumente</h2>
        <p className="mt-1 text-sm text-slate-600">
          Lade deinen Lebenslauf, Zertifikate und weitere Unterlagen einmal
          hoch – wir nutzen sie für alle deine Bewerbungen.
        </p>

        {candidate.documents.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100">
            {candidate.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                  >
                    {doc.fileName}
                  </a>
                  <p className="text-slate-500">
                    {DOCUMENT_TYPE_LABELS[doc.type]} · hochgeladen am {formatDateTime(doc.uploadedAt)}
                  </p>
                </div>
                <form action={removeDocument.bind(null, doc.id)}>
                  <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                    Entfernen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {message && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <form
          action={uploadDocument}
          className="mt-4 rounded-lg border-2 border-dashed border-slate-300 p-6 text-center"
        >
          <p className="text-sm font-medium text-slate-700">Neues Dokument hochladen</p>
          <div className="mx-auto mt-4 flex max-w-sm flex-col items-stretch gap-3">
            <select
              name="documentType"
              defaultValue="cv"
              aria-label="Dokumenttyp"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Hochladen
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">PDF, DOC, DOCX – max. 10 MB</p>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-slate-900">Deine besten Job-Matches</h2>
          <p className="text-sm text-slate-500">{matches.length} passende Jobs</p>
        </div>
        {matches.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Noch keine Matches – ergänze dein Profil, um passende
            Stellenangebote zu sehen.
          </p>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <JobCard key={match.job.id} job={match.job} matchScore={match.score} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
