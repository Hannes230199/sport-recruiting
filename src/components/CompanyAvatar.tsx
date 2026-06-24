"use client";

import { useState } from "react";

/** Extracts the hostname from a URL, or null if unparseable. */
function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Guesses a company's primary domain from its name.
 * Best-effort fallback when no scraped company_url is available.
 */
function guessDomain(company: string): string | null {
  const cleaned = company
    .toLowerCase()
    .replace(
      /\b(gmbh|ag|e\.v\.|ev|e\.v|kg|se|mbh|co\.|inc|ltd|llc|ug|ohg|& co)\b/gi,
      " "
    )
    .replace(/[äöüß]/g, (c) =>
      ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" } as Record<string, string>)[c] ?? c
    )
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
  /** Scraped company website URL (preferred over domain guesser) */
  companyUrl: string | null;
  /** Sport category emoji (already computed by parent) */
  icon: string | null;
}

export function CompanyAvatar({ company, companyUrl, icon }: CompanyAvatarProps) {
  // Start hidden — only reveal once onLoad fires. Avoids broken-image flash
  // when Clearbit fails before React hydration (onError never fires in that case).
  const [logoLoaded, setLogoLoaded] = useState(false);

  const domain = companyUrl ? extractDomain(companyUrl) : guessDomain(company);

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      {/* Fallback — always rendered, hidden once logo loads */}
      {!logoLoaded && (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
            icon ? "bg-slate-50" : `${initialColor(company)} text-sm font-bold`
          }`}
        >
          {icon ?? company.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Logo — preloaded invisibly; shown on success */}
      {domain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={company}
          width={36}
          height={36}
          className={`absolute inset-0 h-10 w-10 rounded-lg border border-slate-100 bg-white object-contain p-0.5 transition-opacity ${
            logoLoaded ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onLoad={() => setLogoLoaded(true)}
          onError={() => setLogoLoaded(false)}
        />
      )}
    </div>
  );
}
