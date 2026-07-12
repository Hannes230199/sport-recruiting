import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { JOB_SOURCES } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getLatestJobs } from "@/lib/data/jobs";
import { CommunitySignupForm } from "@/components/CommunitySignupForm";

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

      {/* Community sign-up */}
      <section id="community" className="scroll-mt-20">
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            {/* Left: copy */}
            <div className="bg-gradient-to-br from-brand-600 to-accent-600 px-8 py-10 text-white">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Community</p>
              <h2 className="mt-3 text-2xl font-extrabold leading-snug">
                Werde Teil der Sport-Recruiting Community
              </h2>
              <p className="mt-3 text-sm leading-relaxed opacity-80">
                Erhalte exklusive Job-Tipps, Karriere-News und Networking-Möglichkeiten direkt in
                dein Postfach — oder tausch dich live in unserer WhatsApp-Gruppe aus.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {["📧 Wöchentlicher Job-Newsletter", "💬 WhatsApp-Gruppe mit Sport-Professionals", "🎯 Exklusive Karriere-Tipps"].map((item) => (
                  <li key={item} className="flex items-center gap-2 opacity-90">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Right: form */}
            <div className="px-8 py-10">
              <CommunitySignupForm />
            </div>
          </div>
        </div>
      </section>

      {/* Consultation booking */}
      <section id="beratung" className="scroll-mt-20">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            {/* Left: copy */}
            <div className="px-8 py-10">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Kostenlose Beratung</p>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 leading-snug">
                Persönliches Karriere-Gespräch buchen
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Du willst in den Sport-Job-Markt einsteigen oder dich neu orientieren?
                Buch dir 30 Minuten mit uns — kostenlos, unverbindlich, praxisnah.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                {[
                  "🗓️ Flexibler Termin per Google Calendar",
                  "⏱️ 30 Minuten, kostenlos & unverbindlich",
                  "🎯 Individuelle Karriere-Beratung im Sport",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">{item}</li>
                ))}
              </ul>
            </div>
            {/* Right: CTA / Google Calendar embed */}
            <div className="flex flex-col items-center justify-center bg-slate-50 px-8 py-10 text-center">
              <div className="mb-6 text-5xl">🗓️</div>
              <h3 className="text-base font-bold text-slate-900">Termin direkt buchen</h3>
              <p className="mt-2 text-sm text-slate-500">
                Wähle einen freien Slot in unserem Kalender — du bekommst sofort eine Bestätigung.
              </p>
              {/*
                SETUP: Replace the href below with your Google Calendar appointment scheduling link.
                Go to Google Calendar → Create → Appointment schedule → Share.
                It looks like: https://calendar.google.com/calendar/appointments/schedules/...
              */}
              <a
                href="https://calendar.app.google/NcoHYfp4YLLVFvfv6"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Kostenlosen Termin buchen →
              </a>
              <p className="mt-3 text-xs text-slate-400">Öffnet Google Calendar</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
