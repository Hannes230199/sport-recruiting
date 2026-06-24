import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { JOB_SOURCES } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getLatestJobs } from "@/lib/data/jobs";

export default async function HomePage() {
  const supabase = await createClient();
  const latestJobs = await getLatestJobs(supabase, 6);

  return (
    <div className="space-y-14">
      {/* Hero — minimal, text-first */}
      <section className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Täglich aktualisiert
          </span>
          <span className="text-xs text-slate-400">{JOB_SOURCES.length} Quellen</span>
        </div>

        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Der Sport-Jobmarkt,{" "}
          <span className="text-brand-600">gebündelt</span>{" "}
          an einem Ort.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500">
          Jobs aus den wichtigsten deutschen Sport-Jobbörsen — automatisch mit
          deinem Profil gematcht und alle Bewerbungen an einem Ort im Blick.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Jobs durchsuchen →
          </Link>
          <Link
            href="/profil"
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Profil anlegen & Matches erhalten
          </Link>
        </div>
      </section>

      {/* Latest Jobs */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Neueste Stellenangebote</h2>
            <p className="text-sm text-slate-400">Frisch aus unseren Quellen</p>
          </div>
          <Link
            href="/jobs"
            className="text-sm font-semibold text-brand-600 hover:text-brand-800 hover:underline"
          >
            Alle Jobs →
          </Link>
        </div>

        {latestJobs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            <p className="text-2xl">🏃</p>
            <p className="mt-2 font-medium text-slate-700">Noch keine Stellenangebote vorhanden.</p>
            <p className="mt-1 text-slate-400">Die Jobs werden täglich automatisch importiert.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {latestJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-1 text-lg font-bold text-slate-900">So funktioniert&apos;s</h2>
        <p className="mb-8 text-sm text-slate-400">In drei Schritten zum passenden Job</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Profil anlegen",
              desc: "Lade deinen Lebenslauf hoch und gib Wunschrollen, Sportarten und Standorte an.",
            },
            {
              step: "02",
              title: "Automatisch gematcht werden",
              desc: "Wir vergleichen dein Profil mit allen aktuellen Stellen und zeigen dir den Match-Score.",
            },
            {
              step: "03",
              title: "Bewerben & tracken",
              desc: "Bewirb dich extern und verfolge alle deine Bewerbungen im Kanban-Board.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{step}</p>
              <h3 className="mt-2 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Unsere Quellen</h2>
        <p className="mb-5 text-sm text-slate-400">Täglich aktualisiert</p>
        <div className="flex flex-wrap gap-2">
          {JOB_SOURCES.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              {source.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
