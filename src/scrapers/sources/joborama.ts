import * as cheerio from "cheerio";
import { Scraper, ScrapedJob } from "../types";
import { cleanText, extractTags, guessCategory, guessEmploymentType, parseGermanDate } from "../normalize";

const BASE_URL = "https://www.joborama.de";

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "SportRecruitingBot/0.1 (+mailto:hannes.schwedhelm@ringier.ch)";

/**
 * joborama.de — 4 Sport-Kategorien mit path-basierter Pagination.
 *
 * Früher: Homepage parsete section.job-cards article.card für Kategorien,
 * Pagination via ?page=N — beides veraltet seit 2026.
 *
 * Aktuell: Kategorie-Seiten direkt ansteuern, Pagination via
 * a.next-page href (z.B. /stellenangebote/sport-management/2).
 * Job-Selektoren a.job-item-link, .job-title, .job-company sind unverändert.
 */
const CATEGORIES: { label: string; path: string }[] = [
  { label: "Sport & Management", path: "/stellenangebote/sport-management" },
  { label: "Fitness, Health & Wellness", path: "/stellenangebote/fitness-health-wellness" },
  { label: "Event, Medien & Wirtschaft", path: "/stellenangebote/event-medien-wirtschaft" },
  { label: "Tourismus & Gastgewerbe", path: "/stellenangebote/tourismus-gastgewerbe" },
];

const MAX_PAGES_PER_CATEGORY = 20;

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

interface RawEntry {
  href: string;
  title: string;
  company: string | null;
  category: string | null;
}

async function scrapeCategory(
  categoryPath: string,
  categoryLabel: string,
  limit?: number
): Promise<RawEntry[]> {
  const entries: RawEntry[] = [];
  const seen = new Set<string>();
  let nextUrl: string | null = `${BASE_URL}${categoryPath}/`;
  let page = 0;

  while (nextUrl && page < MAX_PAGES_PER_CATEGORY) {
    if (typeof limit === "number" && entries.length >= limit) break;
    page++;

    const html = await fetchHtml(nextUrl);
    if (!html) break;

    const $ = cheerio.load(html);
    let foundNew = false;

    $("a.job-item-link").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      if (!href) return;
      const sourceUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
      if (seen.has(sourceUrl)) return;
      seen.add(sourceUrl);

      const title = cleanText($el.find(".job-title").first().text());
      if (!title) return;
      const company = cleanText($el.find(".job-company").first().text()) || null;

      entries.push({ href: sourceUrl, title, company, category: categoryLabel });
      foundNew = true;
    });

    if (!foundNew) break;

    // Follow a.next-page for path-based pagination (/category/2, /category/3, …)
    const nextHref = $("a.next-page").first().attr("href");
    nextUrl = nextHref
      ? nextHref.startsWith("http")
        ? nextHref
        : `${BASE_URL}${nextHref}`
      : null;
  }

  return entries;
}

export const joboramaScraper: Scraper = {
  source: "joborama",
  label: "Joborama.de",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const allEntries: RawEntry[] = [];

    for (const cat of CATEGORIES) {
      if (typeof limit === "number" && allEntries.length >= limit) break;
      const catEntries = await scrapeCategory(cat.path, cat.label, limit);
      allEntries.push(...catEntries);
    }

    const limited = typeof limit === "number" ? allEntries.slice(0, limit) : allEntries;

    return limited.map((entry) => {
      const fullText = `${entry.title} ${entry.company ?? ""}`;
      return {
        externalId: entry.href.replace(/\/+$/, "").split("/").pop() ?? entry.href,
        sourceUrl: entry.href,
        title: entry.title,
        company: entry.company,
        companyUrl: null,
        location: null,
        employmentType: guessEmploymentType(fullText),
        category: entry.category || guessCategory(entry.title),
        tags: extractTags(fullText),
        description: "",
        salaryRange: null,
        postedAt: parseGermanDate(null),
      } satisfies ScrapedJob;
    });
  },
};
