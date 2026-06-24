"use client";

import { useState } from "react";

/**
 * Guesses a company's primary domain from its name.
 * Best-effort: works well for large orgs, gracefully returns null for unknowns.
 */
function guessDomain(company: string): string | null {
  const cleaned = company
    .toLowerCase()
    // strip legal/sport org suffixes
    .replace(
      /\b(gmbh|ag|e\.v\.|ev|e\.v|kg|se|mbh|co\.|inc|ltd|llc|ug|ohg|& co)\b/gi,
      " "
    )
    // transliterate German umlauts
    .replace(/[äöüß]/g, (c) =>
      ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" } as Record<string, string>)[c] ?? c
    )
    // strip non-alphanumeric except hyphens
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "");

  if (!cleaned || cleaned.length < 2) return null;
  return `${cleaned}.de`;
}

// Deterministic background color from company initial
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
  return INITIAL_COLORS[name.charCodeAt(0) % INITIAL_COLORS.length];
}

interface CompanyAvatarProps {
  company: string;
  /** Sport category emoji (already computed by parent) */
  icon: string | null;
}

export function CompanyAvatar({ company, icon }: CompanyAvatarProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  const domain = guessDomain(company);

  // If we have a guessed domain and the logo hasn't failed yet, attempt it
  if (domain && !logoFailed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={company}
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
          onError={() => setLogoFailed(true)}
        />
      </div>
    );
  }

  // Fallback: sport emoji or colored initial
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
        icon ? "bg-slate-50" : `${initialColor(company)} text-sm font-bold`
      }`}
    >
      {icon ?? company.charAt(0).toUpperCase()}
    </div>
  );
}
