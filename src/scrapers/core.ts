/**
 * Gemeinsame Scraper-Logik, die sowohl vom CLI-Runner
 * (`src/scrapers/runner.ts`, `npm run scrape`) als auch vom
 * Cron-Route-Handler (`src/app/api/scrape-trigger/route.ts`) genutzt wird.
 */

import { Scraper, ScrapedJob } from "./types";
import { jobsImSportScraper } from "./sources/jobsimsport";
import { sportJobScraper } from "./sources/sportJob";
import { spobisJobsScraper } from "./sources/spobisJobs";
import { joboramaScraper } from "./sources/joborama";
import { dshsKoelnScraper } from "./sources/dshsKoeln";

export const SCRAPERS: Scraper[] = [
  jobsImSportScraper,
  dshsKoelnScraper,
  spobisJobsScraper,
  sportJobScraper,
  joboramaScraper,
];

export interface SourceResult {
  source: string;
  label: string;
  jobs: ScrapedJob[];
  error: string | null;
}

export interface UpsertSummary {
  source: string;
  label: string;
  jobCount: number;
  upsertedCount: number | null;
  error: string | null;
}

/** Führt alle (oder die übergebenen) Scraper aus und sammelt die Ergebnisse. */
export async function runScrapers(
  scrapers: Scraper[] = SCRAPERS,
  limit?: number
): Promise<SourceResult[]> {
  // Run all scrapers in parallel to stay within Vercel's function timeout
  const settled = await Promise.allSettled(
    scrapers.map((scraper) => scraper.scrape(limit))
  );

  return settled.map((result, i) => {
    const scraper = scrapers[i];
    if (result.status === "fulfilled") {
      return { source: scraper.source, label: scraper.label, jobs: result.value, error: null };
    }
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    return { source: scraper.source, label: scraper.label, jobs: [], error: message };
  });
}

/** Wandelt ein ScrapedJob (camelCase) in eine DB-Zeile (snake_case) um. */
export function toDbRow(source: string, job: ScrapedJob) {
  return {
    source,
    external_id: job.externalId,
    source_url: job.sourceUrl,
    title: job.title,
    company: job.company,
    company_url: job.companyUrl,
    location: job.location,
    employment_type: job.employmentType,
    category: job.category,
    tags: job.tags,
    description: job.description,
    salary_range: job.salaryRange,
    posted_at: job.postedAt,
    scraped_at: new Date().toISOString(),
    is_active: true,
  };
}

/**
 * Schreibt die gescrapten Jobs per Upsert (`source` + `external_id`) in die
 * `jobs`-Tabelle. Nutzt den Admin-Client (Service-Role-Key), umgeht also RLS
 * - darf daher NUR serverseitig (Scraper-Skript, Cron-Route) aufgerufen
 * werden.
 */
export async function upsertJobs(results: SourceResult[]): Promise<UpsertSummary[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const summary: UpsertSummary[] = [];

  for (const result of results) {
    if (result.error) {
      summary.push({
        source: result.source,
        label: result.label,
        jobCount: 0,
        upsertedCount: null,
        error: result.error,
      });
      continue;
    }

    if (result.jobs.length === 0) {
      summary.push({
        source: result.source,
        label: result.label,
        jobCount: 0,
        upsertedCount: 0,
        error: null,
      });
      continue;
    }

    const allRows = result.jobs.map((job) => toDbRow(result.source, job));

    // Deduplicate by external_id within the batch — Postgres throws
    // "ON CONFLICT DO UPDATE command cannot affect row a second time"
    // when the same (source, external_id) appears more than once.
    const seenIds = new Set<string>();
    const rows = allRows.filter((row) => {
      const key = String(row.external_id ?? row.source_url);
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });

    const { error, count } = await supabase
      .from("jobs")
      .upsert(rows, { onConflict: "source,external_id", count: "exact" });

    summary.push({
      source: result.source,
      label: result.label,
      jobCount: result.jobs.length,
      upsertedCount: error ? null : count ?? rows.length,
      error: error?.message ?? null,
    });
  }

  return summary;
}
