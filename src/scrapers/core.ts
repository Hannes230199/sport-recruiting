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
  const results: SourceResult[] = [];

  for (const scraper of scrapers) {
    try {
      const jobs = await scraper.scrape(limit);
      results.push({ source: scraper.source, label: scraper.label, jobs, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ source: scraper.source, label: scraper.label, jobs: [], error: message });
    }
  }

  return results;
}

/** Wandelt ein ScrapedJob (camelCase) in eine DB-Zeile (snake_case) um. */
export function toDbRow(source: string, job: ScrapedJob) {
  return {
    source,
    external_id: job.externalId,
    source_url: job.sourceUrl,
    title: job.title,
    company: job.company,
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

    const rows = result.jobs.map((job) => toDbRow(result.source, job));

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
