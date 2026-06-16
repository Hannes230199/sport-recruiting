import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { JOB_SOURCES } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getLatestJobs } from "@/lib/data/jobs";

export default async function HomePage() {
  const supabase = await createClient();
  const latestJobs = await getLatestJobs(supabase, 4);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1a6b] via-[#3d35b5] to-[#7c3aed] px-8 py-10 text-white shadow-xl">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent-400/10 blur-3xl" />

        <div className="relative">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
            Täglich aktualisiert
          </span>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
            Der Sport-Jobmarkt,{" "}
            <span className="text-accent-300">gebündelt</span>{" "}
            an einem Ort.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
            Wir sammeln täglich Stellenangebote aus den wichtigsten deutschen
            Sport-Jobbörsen, matchen sie automatisch mit deinem Profil und
            geben dir eine klare Übersicht über alle deine Bewerbungen.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md"
            >
              Jobs durchsuchen →
            </Link>
            <Link
              href="/profil"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Profil anlegen & Matches erhalten
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Neueste Stellenangebote</h2>
            <p className="mt-1 text-sm text-slate-500">Frisch aus unseren Quellen</p>
          </div>
          <Link
            href="/jobs"
            className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            Alle Jobs →
          </Link>
        </div>
        {latestJobs.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            <p className="text-2xl">🏃</p>
            <p className="mt-2 font-medium text-slate-700">Noch keine Stellenangebote vorhanden.</p>
            <p className="mt-1">Die Jobs werden täglich automatisch importiert – schau gleich wieder vorbei.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {latestJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="rounded-3xl border border-brand-100 bg-white p-10 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">So funktioniert&apos;s</h2>
        <p className="mt-1 text-sm text-slate-500">In drei Schritten zum passenden Job</p>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Profil anlegen",
              desc: "Lade einmal deinen Lebenslauf und deine Zertifikate hoch und gib deine Wunschrollen, Sportarten und Standorte an.",
              color: "from-brand-500 to-brand-600",
            },
            {
              step: "2",
              title: "Automatisch gematcht werden",
              desc: "Wir vergleichen dein Profil mit allen aktuellen Stellen und zeigen dir, wie gut sie zu dir passen.",
              color: "from-brand-600 to-accent-600",
            },
            {
              step: "3",
              title: "Bewerben & Überblick behalten",
              desc: "Bewirb dich mit wenigen Klicks und verfolge den Status all deiner Bewerbungen an einem Ort.",
              color: "from-accent-500 to-accent-700",
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-sm font-bold text-white shadow-sm`}
              >
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Unsere Quellen</h2>
        <p className="mb-6 text-sm text-slate-500">
          Jeden Tag aktualisiert – Jobs aus folgenden Plattformen:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {JOB_SOURCES.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-brand-300 hover:shadow-md hover:text-brand-700"
            >
              {source.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
