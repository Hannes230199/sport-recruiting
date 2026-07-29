import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { PageContainer } from "@/components/PageContainer";
import { createClient } from "@/lib/supabase/server";
import { getLatestJobs } from "@/lib/data/jobs";
import { CommunitySignupForm } from "@/components/CommunitySignupForm";

export default async function HomePage() {
  const supabase = await createClient();
  const latestJobs = await getLatestJobs(supabase, 6);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative w-screen overflow-hidden" style={{ height: "72vh", minHeight: 420, maxHeight: 620 }}>

        {/* 1. Pitch photo background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/pitch.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
            filter: "blur(5px) brightness(0.6) saturate(1.1)",
            transform: "scale(1.07)",
          }}
        />

        {/* 2. Dark vignette */}
        <div className="absolute inset-0 bg-black/15" />

        {/* 3. Animated color blobs */}
        <div
          className="animate-blob-1 pointer-events-none absolute rounded-full"
          style={{ width: 580, height: 580, background: "rgba(34,197,94,0.38)", filter: "blur(90px)", top: -180, left: -120 }}
        />
        <div
          className="animate-blob-2 pointer-events-none absolute rounded-full"
          style={{ width: 460, height: 460, background: "rgba(56,189,248,0.28)", filter: "blur(80px)", top: -60, right: -100 }}
        />
        <div
          className="animate-blob-3 pointer-events-none absolute rounded-full"
          style={{ width: 380, height: 380, background: "rgba(16,185,129,0.32)", filter: "blur(70px)", bottom: -80, left: 160 }}
        />
        <div
          className="animate-blob-4 pointer-events-none absolute rounded-full"
          style={{ width: 300, height: 300, background: "rgba(99,102,241,0.18)", filter: "blur(60px)", bottom: 40, right: 80 }}
        />

        {/* 4. Floating sport icons */}
        <svg className="animate-icon-1 pointer-events-none absolute" style={{ top: 100, left: 24, opacity: 0.18, width: 88, height: 88 }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20M12 2C9.5 5 8 8.5 8 12s1.5 7 4 10M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"/>
        </svg>
        <svg className="animate-icon-2 pointer-events-none absolute" style={{ top: 140, right: 44, opacity: 0.18, width: 64, height: 64 }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" aria-hidden="true">
          <circle cx="13" cy="4" r="2"/><path d="m14 10-1 2-2 1-1 4 2 1 1-3 2-1 2-4z"/><path d="m9 17-1 3h2l1-3zM6 9l2 1 2-2-2-2z"/>
        </svg>
        <svg className="animate-icon-3 pointer-events-none absolute" style={{ bottom: 220, left: 44, opacity: 0.17, width: 52, height: 52 }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" aria-hidden="true">
          <path d="M6 4v16M18 4v16M6 12h12M3 4h4M17 4h4M3 20h4M17 20h4"/>
        </svg>
        <svg className="animate-icon-4 pointer-events-none absolute" style={{ top: 72, right: 180, opacity: 0.16, width: 44, height: 44 }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" aria-hidden="true">
          <path d="M12 2 9 9H2l5.5 4-2 7L12 16l6.5 4-2-7L22 9h-7z"/>
        </svg>
        <svg className="animate-icon-5 pointer-events-none absolute" style={{ bottom: 240, right: 100, opacity: 0.15, width: 38, height: 38 }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" aria-hidden="true">
          <circle cx="12" cy="12" r="2"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83"/>
        </svg>

        {/* 5. Hero content */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:items-end mb-5">
              <div>
                <div className="mb-5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-green-300">Täglich aktualisiert</span>
                </div>
                <h1 className="text-5xl font-extrabold leading-[1.02] tracking-[-2px] text-white sm:text-6xl" style={{ textShadow: "0 2px 32px rgba(0,0,0,0.5)" }}>
                  Dein Job<br />im Sport.
                </h1>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-white/40">
                    <div className="flex h-7 w-[18px] items-start justify-center rounded-full border border-white/28 pt-[5px]">
                      <div className="animate-scroll-dot h-1.5 w-0.5 rounded-full bg-white/50" />
                    </div>
                    <span className="text-xs font-medium">Scroll down</span>
                  </div>
                  <Link
                    href="/jobs"
                    className="rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-green-400"
                  >
                    Jobs entdecken
                  </Link>
                  <Link
                    href="/unternehmen"
                    className="rounded-full border border-white/38 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    style={{ backdropFilter: "blur(8px)" }}
                  >
                    Für Arbeitgeber
                  </Link>
                </div>
              </div>

              <div className="hidden sm:block">
                <div className="border-l-2 border-white/32 pl-5">
                  <p className="text-sm leading-relaxed text-white/82">
                    Alle Sportjobs Deutschlands — aggregiert aus den besten Quellen, täglich aktualisiert.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full border border-green-400/40 bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">● Täglich neu</span>
                    <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-300">5 Quellen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div className="glass-card rounded-2xl p-4">
                <p className="text-2xl font-extrabold text-white leading-none">1.000+</p>
                <p className="mt-1.5 text-xs text-white/50">offene Stellen</p>
                <svg className="mt-3 opacity-20" width="22" height="22" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/>
                </svg>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-2xl font-extrabold leading-none text-green-400">Gratis</p>
                <p className="mt-1.5 text-xs text-white/50">für Jobsuchende</p>
                <svg className="mt-3 opacity-25 text-green-400" width="22" height="22" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT (contained) ──────────────────────────── */}
      <PageContainer>
        <div className="space-y-14">

          {/* Latest Jobs */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Neueste Stellenangebote</h2>
                <p className="text-sm text-slate-400">Frisch aus unseren Quellen</p>
              </div>
              <Link href="/jobs" className="text-sm font-semibold text-brand-600 hover:text-brand-800 hover:underline">
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
              <div className="overflow-hidden rounded-xl border border-white/70" style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: "rgba(255,255,255,0.45)" }}>
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
                { step: "01", title: "Profil anlegen", desc: "Lade deinen Lebenslauf hoch und gib Wunschrollen, Sportarten und Standorte an." },
                { step: "02", title: "Automatisch gematcht werden", desc: "Wir vergleichen dein Profil mit allen aktuellen Stellen und zeigen dir den Match-Score." },
                { step: "03", title: "Bewerben & tracken", desc: "Bewirb dich extern und verfolge alle deine Bewerbungen im Kanban-Board." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-600">{step}</p>
                  <h3 className="mt-2 font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Community sign-up */}
          <section id="community" className="scroll-mt-20">
            <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
              <div className="grid lg:grid-cols-2">
                <div className="bg-gradient-to-br from-green-600 to-emerald-500 px-8 py-10 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70">Community</p>
                  <h2 className="mt-3 text-2xl font-extrabold leading-snug">Werde Teil der Sport-Recruiting Community</h2>
                  <p className="mt-3 text-sm leading-relaxed opacity-80">
                    Erhalte exklusive Job-Tipps, Karriere-News und Networking-Möglichkeiten direkt in dein Postfach.
                  </p>
                  <ul className="mt-6 space-y-2 text-sm">
                    {["📧 Wöchentlicher Job-Newsletter", "💬 WhatsApp-Gruppe mit Sport-Professionals", "🎯 Exklusive Karriere-Tipps"].map((item) => (
                      <li key={item} className="flex items-center gap-2 opacity-90"><span>{item}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="px-8 py-10"><CommunitySignupForm /></div>
              </div>
            </div>
          </section>

          {/* Consultation booking */}
          <section id="beratung" className="scroll-mt-20">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid lg:grid-cols-2">
                <div className="px-8 py-10">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-600">Kostenlose Beratung</p>
                  <h2 className="mt-3 text-2xl font-extrabold text-slate-900 leading-snug">Persönliches Karriere-Gespräch buchen</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    Du willst in den Sport-Job-Markt einsteigen oder dich neu orientieren? Buch dir 30 Minuten — kostenlos und unverbindlich.
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-slate-600">
                    {["🗓️ Flexibler Termin per Google Calendar", "⏱️ 30 Minuten, kostenlos & unverbindlich", "🎯 Individuelle Karriere-Beratung im Sport"].map((item) => (
                      <li key={item} className="flex items-center gap-2">{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-50 px-8 py-10 text-center">
                  <div className="mb-6 text-5xl">🗓️</div>
                  <h3 className="text-base font-bold text-slate-900">Termin direkt buchen</h3>
                  <p className="mt-2 text-sm text-slate-500">Wähle einen freien Slot — du bekommst sofort eine Bestätigung.</p>
                  <a
                    href="https://calendar.app.google/NcoHYfp4YLLVFvfv6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    Kostenlosen Termin buchen →
                  </a>
                  <p className="mt-3 text-xs text-slate-400">Öffnet Google Calendar</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </PageContainer>
    </>
  );
}
