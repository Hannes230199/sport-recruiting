import * as cheerio from "cheerio";
import { EmploymentType } from "@/lib/types";
import { Scraper, ScrapedJob } from "../types";
import { cleanText, extractTags, guessCategory } from "../normalize";

const BASE_URL = "https://www.spobis-jobs.com";
const MAX_PAGES = 20;

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "SportRecruitingBot/0.1 (+mailto:hannes.schwedhelm@ringier.ch)";

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

const EMPLOYMENT_TYPE_LABELS: { label: string; type: EmploymentType }[] = [
  { label: "Werkstudent", type: "werkstudent" },
  { label: "Vollzeit", type: "vollzeit" },
  { label: "Teilzeit", type: "teilzeit" },
  { label: "Praktikum", type: "praktikum" },
  { label: "Ausbildung", type: "ausbildung" },
  { label: "Freelancer", type: "freelance" },
  { label: "Minijob", type: "teilzeit" },
];

function mapEmploymentType(raw: string | null): EmploymentType {
  if (!raw) return "unbekannt";
  for (const { label, type } of EMPLOYMENT_TYPE_LABELS) {
    if (raw.toLowerCase().includes(label.toLowerCase())) return type;
  }
  return "unbekannt";
}

/**
 * SPOBIS Jobs ist eine Webflow-CMS-Seite.
 *
 * Früher: /jobs?page=N (URL existierte nicht) + .home_job_card-Selektor.
 *
 * Aktuell (2026-07): Homepage mit Webflow-Pagination ?1c8361bc_page=N.
 * Jobkarte ist a.job_card (oder a[href^="/jobs/"]), Titel in h2.home_job_title,
 * Anstellungsart in .home_job_employment_type.
 * Firma/Ort/Tags werden nicht mehr in der Listing-Ansicht angezeigt.
 */
export const spobisJobsScraper: Scraper = {
  source: "spobis_jobs",
  label: "SPOBIS Jobs",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const jobs: ScrapedJob[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page++) {
      if (typeof limit === "number" && jobs.length >= limit) break;

      const url =
        page === 1 ? `${BASE_URL}/` : `${BASE_URL}/?1c8361bc_page=${page}`;

      const html = await fetchHtml(url);
      if (!html) break;

      const $ = cheerio.load(html);
      const before = jobs.length;

      $('a[href^="/jobs/"], a[href^="https://www.spobis-jobs.com/jobs/"]').each((_, el) => {
        if (typeof limit === "number" && jobs.length >= limit) return;

        const href = $(el).attr("href");
        if (!href) return;
        const sourceUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        if (seen.has(sourceUrl)) return;

        const card = $(el);
        const title = cleanText(card.find(".home_job_title").first().text());
        if (!title) return;

        seen.add(sourceUrl);

        const employmentTypeRaw =
          cleanText(card.find(".home_job_employment_type").first().text()) || null;

        const fullText = `${title} ${employmentTypeRaw ?? ""}`;

        jobs.push({
          externalId: sourceUrl.replace(/\/+$/, "").split("/").pop() ?? sourceUrl,
          sourceUrl,
          title,
          company: null,
          companyUrl: null,
          location: null,
          employmentType: mapEmploymentType(employmentTypeRaw),
          category: guessCategory(title),
          tags: extractTags(fullText),
          description: "",
          salaryRange: null,
          postedAt: null,
        });
      });

      // No new jobs on this page → pagination exhausted
      if (jobs.length === before) break;
    }

    return jobs;
  },
};
