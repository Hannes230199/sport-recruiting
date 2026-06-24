import Link from "next/link";
import { EMPLOYMENT_TYPE_LABELS, Job, JOB_SOURCES } from "@/lib/types";

function sourceLabel(source: Job["source"]): string {
  return JOB_SOURCES.find((s) => s.id === source)?.label ?? source;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// sport category emoji mapping
const CATEGORY_ICONS: [string, string][] = [
  ["fußball", "⚽"], ["fussball", "⚽"],
  ["basketball", "🏀"],
  ["tennis", "🎾"],
  ["handball", "🤾"],
  ["volleyball", "🏐"],
  ["schwimm", "🏊"],
  ["leichtathletik", "🏃"], ["laufen", "🏃"], ["marathon", "🏃"],
  ["golf", "⛳"],
  ["radsport", "🚴"], ["cycling", "🚴"], ["fahrrad", "🚴"],
  ["ski", "⛷️"], ["winter", "⛷️"], ["snowboard", "⛷️"],
  ["rugby", "🏉"],
  ["hockey", "🏑"],
  ["kampfsport", "🥊"], ["judo", "🥋"], ["karate", "🥋"], ["boxen", "🥊"],
  ["turnen", "🤸"], ["fitness", "🏋️"], ["gym", "🏋️"],
  ["wassersport", "🌊"], ["segeln", "⛵"], ["rudern", "🚣"],
  ["reiten", "🐎"], ["pferd", "🐎"],
  ["marketing", "📣"], ["kommunikation", "📣"],
  ["management", "📊"], ["sport & management", "📊"],
  ["event", "🎪"], ["veranstaltung", "🎪"],
  ["physio", "🩺"], ["medizin", "🩺"], ["gesundheit", "🩺"], ["reha", "🩺"],
  ["ernährung", "🥗"], ["nutrition", "🥗"],
  ["it", "💻"], ["digital", "💻"], ["tech", "💻"],
];

function categoryIcon(category: string | null): string | null {
  if (!category) return null;
  const lower = category.toLowerCase();
  for (const [key, emoji] of CATEGORY_ICONS) {
    if (lower.includes(key)) return emoji;
  }
  return null;
}

// deterministic bg color from company initial
const INITIAL_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
];

function initialColor(name: string): string {
  const code = name.charCodeAt(0) % INITIAL_COLORS.length;
  return INITIAL_COLORS[code];
}

const EMPLOYMENT_TAG_COLOR: Record<string, string> = {
  vollzeit:    "bg-brand-50 text-brand-700",
  teilzeit:    "bg-brand-50 text-brand-700",
  praktikum:   "bg-violet-50 text-violet-700",
  werkstudent: "bg-violet-50 text-violet-700",
  ausbildung:  "bg-amber-50 text-amber-700",
  freelance:   "bg-emerald-50 text-emerald-700",
  unbekannt:   "bg-slate-100 text-slate-500",
};

export function JobCard({ job, matchScore }: { job: Job; matchScore?: number }) {
  const posted = formatDate(job.postedAt);
  const companyName = job.company ?? "Unbekannt";
  const icon = categoryIcon(job.category);
  const initial = companyName.charAt(0).toUpperCase();
  const colorClass = initialColor(companyName);
  const isRecent = job.postedAt
    ? Date.now() - new Date(job.postedAt).getTime() < 7 * 86400000
    : false;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-4 border-b border-slate-100 bg-white px-5 py-4 last:border-0 transition-colors hover:bg-slate-50"
    >
      {/* Category icon or company initial */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${icon ? "bg-slate-50" : colorClass + " text-sm font-bold"}`}
      >
        {icon ?? initial}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700">
            {job.title}
          </h3>
          {isRecent && (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              Neu
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {companyName}
          {job.location ? ` · ${job.location}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-medium ${EMPLOYMENT_TAG_COLOR[job.employmentType]}`}>
            {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </span>
          {job.category && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
              {job.category}
            </span>
          )}
          {job.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
              {tag}
            </span>
          ))}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-400">
            {sourceLabel(job.source)}
          </span>
          {posted && (
            <span className="ml-auto text-slate-400">{posted}</span>
          )}
        </div>
      </div>

      {/* Match score */}
      {typeof matchScore === "number" && (
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Match</p>
          <p className="text-lg font-bold text-brand-600">{matchScore}%</p>
        </div>
      )}
    </Link>
  );
}
