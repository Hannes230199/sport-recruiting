import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { EmploymentType } from "@/lib/types";
import { Scraper, ScrapedJob } from "../types";
import { cleanText, extractTags, guessCategory } from "../normalize";

const BASE_URL = "https://www.spobis-jobs.com";

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "SportRecruitingBot/0.1 (+mailto:hannes.schwedhelm@ringier.ch)";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`spobis-jobs: GET ${url} -> ${res.status}`);
  }
  return res.text();
}

// Reihenfolge wichtig: "Werkstudent" vor "Studen..." prüfen etc.
const EMPLOYMENT_TYPE_LABELS: { label: string; type: EmploymentType }[] = [
  { label: "Werkstudent", type: "werkstudent" },
  { label: "Vollzeit", type: "vollzeit" },
  { label: "Teilzeit", type: "teilzeit" },
  { label: "Praktikum", type: "praktikum" },
  { label: "Ausbildung", type: "ausbildung" },
  { label: "Freelancer", type: "freelance" },
  { label: "Minijob", type: "teilzeit" },
];

/**
 * Versucht aus dem Freitext einer `.home_job_employment_type`-Badge die
 * passende `EmploymentType` zu ermitteln (z.B. "Vollzeit", "Werkstudent").
 */
function mapEmploymentType(raw: string | null): EmploymentType {
  if (!raw) return "unbekannt";
  for (const { label, type } of EMPLOYMENT_TYPE_LABELS) {
    if (raw.toLowerCase().includes(label.toLowerCase())) return type;
  }
  return "unbekannt";
}

/**
 * Liest aus den `.tags_wrapper .tags_list-item`-Elementen einer Jobkarte den
 * Wert für ein bestimmtes Label (z.B. "Ort" oder "Tätigkeitsbereich"). Jedes
 * Tag-Item enthält ein Label (`.job-card-label p`) und einen Wert
 * (`.text-primary-label`).
 */
function readTag($: cheerio.CheerioAPI, card: cheerio.Cheerio<Element>, label: string): string | null {
  let value: string | null = null;
  card.find(".tags_wrapper .tags_list-item").each((_, item) => {
    if (value) return;
    const $item = $(item);
    if ($item.hasClass("hidden")) return;
    const itemLabel = cleanText($item.find(".job-card-label p").first().text());
    if (itemLabel.toLowerCase() === label.toLowerCase()) {
      value = cleanText($item.find(".text-primary-label").first().text()) || null;
    }
  });
  return value;
}

/**
 * SPOBIS Jobs ist eine Webflow-Seite mit CMS-Collection-Listen. Jede
 * Jobkarte ist ein `a.job_card` (bzw. `a[href^="/jobs/"]`) mit klar
 * benannten Kind-Elementen: Titel in `.home_job_title`, Anstellungsart in
 * `.home_job_employment_type`, Firma in `.home-company-link .is_company`
 * und Ort/Tätigkeitsbereich als Tag-Items in `.tags_wrapper`.
 */
export const spobisJobsScraper: Scraper = {
  source: "spobis_jobs",
  label: "SPOBIS Jobs",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const html = await fetchHtml(`${BASE_URL}/`);
    const $ = cheerio.load(html);

    const jobs: ScrapedJob[] = [];
    const seen = new Set<string>();

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

      const employmentTypeRaw = cleanText(card.find(".home_job_employment_type").first().text()) || null;
      const employmentType = mapEmploymentType(employmentTypeRaw);
      const company = cleanText(card.find(".home-company-link .is_company").first().text()) || null;
      const location = readTag($, card, "Ort");
      const category = readTag($, card, "Tätigkeitsbereich");

      const fullText = `${title} ${employmentTypeRaw ?? ""} ${category ?? ""}`;

      jobs.push({
        externalId: sourceUrl.replace(/\/+$/, "").split("/").pop() ?? sourceUrl,
        sourceUrl,
        title,
        company,
        location,
        employmentType,
        category: category ?? guessCategory(title),
        tags: extractTags(fullText),
        description: cleanText(card.text()),
        salaryRange: null,
        postedAt: null,
      });
    });

    return jobs;
  },
};
