import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { JOB_SOURCES } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getLatestJobs } from "@/lib/data/jobs";

export default async function HomePage() {
  const supabase = await createClient();
  const latestJobs = await getLatestJobs(supabase, 4);

  return (
    <div className="space-y-16">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 px-8 py-16 text-white">
        <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
          Der Sport-Jobmarkt, gebündelt an einem Ort.
        </h1>
        <p className="mt-4 max-w-2xl text-brand-50">
          Wir sammeln täglich Stellenangebote aus den wichtigsten deutschen
          Sport-Jobbörsen, matchen sie automatisch mit deinem Profil und
          geben dir eine klare Übersicht über alle deine Bewerbungen.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Jobs durchsuchen
          </Link>
          <Link
            href="/profil"
            className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Profil anlegen & Matches erhalten
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Neueste Stellenangebote</h2>
          <Link href="/jobs" className="text-sm font-medium text-brand-700 hover:underline">
            Alle Jobs ansehen →
          </Link>
        </div>
        {latestJobs.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Noch keine Stellenangebote vorhanden. Die Jobs werden täglich
            automatisch von unseren Quellen importiert – schau gleich wieder
            vorbei.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {latestJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Unsere Quellen</h2>
        <p className="mb-4 text-sm text-slate-600">
          Jeden Tag aktualisiert – Jobs werden automatisch von folgenden
          Plattformen zusammengetragen:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {JOB_SOURCES.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700"
            >
              {source.label}
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-bold text-slate-900">So funktioniert&apos;s</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <div className="mb-2 text-2xl font-bold text-brand-600">1</div>
            <h3 className="font-semibold text-slate-900">Profil anlegen</h3>
            <p className="mt-1 text-sm text-slate-600">
              Lade einmal deinen Lebenslauf und deine Zertifikate hoch und
              gib deine Wunschrollen, Sportarten und Standorte an.
            </p>
          </div>
          <div>
            <div className="mb-2 text-2xl font-bold text-brand-600">2</div>
            <h3 className="font-semibold text-slate-900">Automatisch gematcht werden</h3>
            <p className="mt-1 text-sm text-slate-600">
              Wir vergleichen dein Profil mit allen aktuellen Stellen und
              zeigen dir, wie gut sie zu dir passen – inklusive Begründung.
            </p>
          </div>
          <div>
            <div className="mb-2 text-2xl font-bold text-brand-600">3</div>
            <h3 className="font-semibold text-slate-900">Bewerben & Überblick behalten</h3>
            <p className="mt-1 text-sm text-slate-600">
              Bewirb dich mit wenigen Klicks und verfolge den Status all
              deiner Bewerbungen an einem Ort.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
