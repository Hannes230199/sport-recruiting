import Link from "next/link";
import { EMPLOYMENT_TYPE_LABELS, Job } from "@/lib/types";
import { CompanyAvatar } from "./CompanyAvatar";

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


const EMPLOYMENT_TAG_COLOR: Record<string, string> = {
  vollzeit:    "bg-blue-400/20 text-blue-200 border border-blue-400/25",
  teilzeit:    "bg-blue-400/20 text-blue-200 border border-blue-400/25",
  praktikum:   "bg-violet-400/20 text-violet-200 border border-violet-400/25",
  werkstudent: "bg-violet-400/20 text-violet-200 border border-violet-400/25",
  ausbildung:  "bg-amber-400/20 text-amber-200 border border-amber-400/25",
  freelance:   "bg-emerald-400/20 text-emerald-200 border border-emerald-400/25",
  unbekannt:   "bg-white/10 text-white/40",
};

export function JobCard({ job, matchScore }: { job: Job; matchScore?: number }) {
  const posted = formatDate(job.postedAt);
  const companyName = job.company ?? "Unbekannt";
  const icon = categoryIcon(job.category);
  const isRecent = job.postedAt
    ? Date.now() - new Date(job.postedAt).getTime() < 7 * 86400000
    : false;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-4 border-b border-white/10 px-5 py-4 last:border-0 transition-all hover:bg-white/10"
    >
      {/* Company logo (best-effort) or sport emoji or initial */}
      <CompanyAvatar company={companyName} companyUrl={job.companyUrl} icon={icon} />

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-white group-hover:text-green-300">
            {job.title}
          </h3>
          {isRecent && (
            <span className="shrink-0 rounded-full bg-green-400/20 px-2 py-0.5 text-xs font-medium text-green-300 border border-green-400/30">
              Neu
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-white/50">
          {companyName}
          {job.location ? ` · ${job.location}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {job.employmentType !== "unbekannt" && (
            <span className={`rounded-full px-2 py-0.5 font-medium ${EMPLOYMENT_TAG_COLOR[job.employmentType]}`}>
              {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
            </span>
          )}
          {job.category && (
            <span className="rounded-full bg-orange-400/15 px-2 py-0.5 font-medium text-orange-200 border border-orange-400/20">
              {job.category}
            </span>
          )}
          {job.location && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/45">
              📍 {job.location}
            </span>
          )}
          {job.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-white/8 px-2 py-0.5 text-white/35">
              {tag}
            </span>
          ))}
          {posted && (
            <span className="ml-auto text-white/35">{posted}</span>
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
