/**
 * enricher.ts
 *
 * Post-scrape enrichment: visits each job's sourceUrl detail page and tries to
 * extract the employer's company website URL.
 *
 * Runs in batches so Vercel's cron timeout is not exceeded.
 * Only processes jobs where companyUrl is still null.
 */
import * as cheerio from "cheerio";
import type { ScrapedJob } from "./types";

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "SportRecruitingBot/0.1 (+mailto:hannes.schwedhelm@ringier.ch)";

/** Domains that are never a company homepage (social media, trackers, CDNs, etc.) */
const BLOCKLIST = [
  "google.", "facebook.", "instagram.", "linkedin.", "twitter.", "xing.",
  "youtube.", "whatsapp.", "tiktok.", "kununu.", "glassdoor.", "stepstone.",
  "indeed.", "monster.", "arbeitsagentur.", "joborama.", "sport-job.", "spobis",
  "jobsimsport.", "dshs-koeln.", "cloudflare.", "amazonaws.", "cdn.", "fonts.",
  "maps.", "analytics.", "recaptcha.", "schema.org", "w3.org", "apple.com",
  "microsoft.", "gravatar.", "wp.com", "wordpress.", "wix.", "webflow.",
];

/** Link text that strongly signals a company homepage */
const HOMEPAGE_SIGNALS = [
  "homepage", "website", "webseite", "zur website", "internet", "www.",
  "besuchen sie uns", "unsere website", "mehr erfahren",
];

/** Returns true if this URL looks like an external company website */
function isCompanyUrl(href: string, sourceDomain: string): boolean {
  try {
    const url = new URL(href);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (host === sourceDomain) return false;
    if (BLOCKLIST.some((b) => host.includes(b))) return false;
    // Prefer root or near-root paths (company homepages, not deep article links)
    const pathDepth = url.pathname.replace(/\/+$/, "").split("/").length - 1;
    if (pathDepth > 3) return false;
    return true;
  } catch {
    return false;
  }
}

/** Extract the source domain from a sourceUrl */
function sourceDomain(sourceUrl: string): string {
  try {
    return new URL(sourceUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Heuristically pick the best company URL from a page's external links.
 * Priority:
 *  1. Links whose visible text contains homepage-signal words
 *  2. Links that appear inside a section/div labeled "Arbeitgeber", "Unternehmen", etc.
 *  3. First non-blocklisted external link
 */
function extractCompanyUrl(html: string, jobSourceUrl: string): string | null {
  const $ = cheerio.load(html);
  const domain = sourceDomain(jobSourceUrl);
  const candidates: { url: string; score: number }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!isCompanyUrl(href, domain)) return;

    let score = 0;
    const linkText = $(el).text().toLowerCase().trim();

    // Boost if link text is a homepage signal
    if (HOMEPAGE_SIGNALS.some((s) => linkText.includes(s))) score += 10;

    // Boost if link is inside an employer/company section
    const parentText = $(el).parents().slice(0, 4).text().toLowerCase();
    if (/arbeitgeber|unternehmen|firma|employer|about|über uns/.test(parentText)) score += 5;

    // Boost clean root URLs
    try {
      const u = new URL(href);
      if (u.pathname === "/" || u.pathname === "") score += 3;
    } catch { /* ignore */ }

    candidates.push({ url: href, score });
  });

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].url;
}

async function fetchDetailPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Enrich jobs that are missing companyUrl by fetching their detail pages.
 * @param jobs       List of scraped jobs (mutated in-place)
 * @param batchSize  How many detail pages to fetch concurrently (keep low to avoid timeouts)
 */
export async function enrichCompanyUrls(
  jobs: ScrapedJob[],
  batchSize = 5
): Promise<ScrapedJob[]> {
  const toEnrich = jobs.filter((j) => j.companyUrl === null);
  if (toEnrich.length === 0) return jobs;

  // Process in batches
  for (let i = 0; i < toEnrich.length; i += batchSize) {
    const batch = toEnrich.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (job) => {
        const html = await fetchDetailPage(job.sourceUrl);
        if (!html) return;
        const url = extractCompanyUrl(html, job.sourceUrl);
        if (url) job.companyUrl = url;
      })
    );
  }

  return jobs;
}

/**
 * Same logic, but for jobs already in the DB that still have no companyUrl.
 * Returns a map of { sourceUrl → companyUrl } for the caller to upsert.
 */
export async function enrichExistingJobs(
  sourceUrls: string[],
  batchSize = 5
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const urls = [...sourceUrls];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (sourceUrl) => {
        const html = await fetchDetailPage(sourceUrl);
        if (!html) return;
        const companyUrl = extractCompanyUrl(html, sourceUrl);
        if (companyUrl) result.set(sourceUrl, companyUrl);
      })
    );
  }

  return result;
}
