import { EmploymentType, JobSource } from "@/lib/types";

/**
 * Rohdaten, die ein einzelner Scraper für einen Job liefert - noch nicht
 * in der DB-Form (keine id/scrapedAt etc., die der Runner ergänzt).
 */
export interface ScrapedJob {
  externalId: string; // stabile ID/Slug auf der Quellseite, für Dedupe
  sourceUrl: string;
  title: string;
  company: string | null;
  companyUrl: string | null; // Website des Unternehmens (für Logo-Lookup)
  location: string | null;
  employmentType: EmploymentType;
  category: string | null;
  tags: string[];
  description: string;
  salaryRange: string | null;
  postedAt: string | null; // ISO date (YYYY-MM-DD)
}

export interface Scraper {
  source: JobSource;
  label: string;
  baseUrl: string;
  /**
   * @param limit Optionales Limit für die Anzahl zu scrapender Jobs
   *   (nützlich für Tests/Dry-Runs, damit nicht 50 Detailseiten geladen werden)
   */
  scrape: (limit?: number) => Promise<ScrapedJob[]>;
}
