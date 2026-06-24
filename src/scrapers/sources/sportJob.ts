import * as cheerio from "cheerio";
import { Scraper, ScrapedJob } from "../types";
import { cleanText, extractTags, guessCategory, guessEmploymentType, parseGermanDate } from "../normalize";

const BASE_URL = "https://www.sport-job.com";
const LISTING_PATH = "/de/stellenmarkt";
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

/**
 * sport-job.com listet Jobs als Karten in `.job-item-container`. Jede Karte
 * enthält im `.text-container` einen Absatz mit Titel (`<strong>`) und
 * Firma (`<i>`), sowie eine `.row` mit "Standort:", "Stellenart:" und
 * "Online seit:" Labels und dem "Stelle anzeigen"-Link.
 */
function extractField(containerText: string, label: string, nextLabel?: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = nextLabel
    ? new RegExp(`${escaped}\\s*:?\\s*(.+?)\\s*${nextLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i")
    : new RegExp(`${escaped}\\s*:?\\s*(.+)$`, "i");
  const match = containerText.match(pattern);
  return match ? cleanText(match[1]) : null;
}

export const sportJobScraper: Scraper = {
  source: "sport_job",
  label: "Sport-Job.com",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const jobs: ScrapedJob[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page++) {
      if (typeof limit === "number" && jobs.length >= limit) break;

      const url =
        page === 1
          ? `${BASE_URL}${LISTING_PATH}`
          : `${BASE_URL}${LISTING_PATH}?page=${page}`;
      const html = await fetchHtml(url);
      if (!html) break;

      const $ = cheerio.load(html);
      let found = 0;

      $(".job-item-container").each((_, el) => {
        const container = $(el);
        const link = container
          .find("a")
          .filter((_, a) => /stelle anzeigen/i.test(cleanText($(a).text())))
          .first();
        const href = link.attr("href");
        if (!href) return;

        const sourceUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        if (seen.has(sourceUrl)) return;
        seen.add(sourceUrl);
        found++;

        const textContainer = container.find(".text-container").first();
        const title = cleanText(textContainer.find("p strong, strong").first().text());
        const company = cleanText(textContainer.find("p i, i").first().text()) || null;

        const rowText =
          cleanText(textContainer.find(".row").first().text()) || cleanText(textContainer.text());

        const location = extractField(rowText, "Standort", "Stellenart");
        const employmentTypeRaw = extractField(rowText, "Stellenart", "Online seit");
        const postedAt = parseGermanDate(extractField(rowText, "Online seit", "Stelle anzeigen"));

        const fullText = `${title} ${employmentTypeRaw ?? ""}`;
        const externalId = sourceUrl.replace(/\/+$/, "").split("/").pop() ?? sourceUrl;

        jobs.push({
          externalId,
          sourceUrl,
          title: title || cleanText(link.text()),
          company,
          location,
          employmentType: guessEmploymentType(employmentTypeRaw ?? title),
          category: guessCategory(title),
          tags: extractTags(fullText),
          description: rowText,
          salaryRange: null,
          postedAt,
        });
      });

      if (found === 0) break; // no results on this page → done
    }

    return typeof limit === "number" ? jobs.slice(0, limit) : jobs;
  },
};
