import * as cheerio from "cheerio";
import { Scraper, ScrapedJob } from "../types";
import {
  cleanText,
  extractTags,
  guessCategory,
  guessEmploymentType,
  parseGermanDate,
} from "../normalize";

const BASE_URL = "https://jobsimsport.de";
const MAX_PAGES = 20; // safety cap

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "SportRecruitingBot/0.1 (+mailto:hannes.schwedhelm@ringier.ch)";

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null; // 404 on last page is expected
    return res.text();
  } catch {
    return null;
  }
}

function splitTitleAndCompany(rawTitle: string): { title: string; company: string | null } {
  const title = cleanText(rawTitle);
  const dashSplit = title.split(/[–—]\s*/);
  if (dashSplit.length >= 2) {
    return {
      title: dashSplit.slice(0, -1).join("–").trim(),
      company: dashSplit[dashSplit.length - 1].trim(),
    };
  }
  return { title, company: null };
}

function guessLocationFromTitle(title: string): string | null {
  const inMatch = title.match(/\bin\s+([A-ZÄÖÜ][\wäöüßÄÖÜ.\-]+(?:\s+[A-ZÄÖÜ][\wäöüßÄÖÜ.\-]+)?)/);
  if (inMatch) return cleanText(inMatch[1]);
  if (/remote/i.test(title)) return "Remote";
  return null;
}

export const jobsImSportScraper: Scraper = {
  source: "jobsimsport",
  label: "JobsImSport.de",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const jobs: ScrapedJob[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page++) {
      if (typeof limit === "number" && jobs.length >= limit) break;

      // WordPress pagination: page 1 = root, page N = /page/N/
      const url = page === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${page}/`;
      const html = await fetchHtml(url);
      if (!html) break; // 404 or network error = no more pages

      const $ = cheerio.load(html);
      let found = 0;

      $(".posts .hentry").each((_, el) => {
        const titleLink = $(el).find("h2.post-title a").first();
        const href = titleLink.attr("href");
        const rawTitle = titleLink.text();
        if (!href || !rawTitle || seen.has(href)) return;
        seen.add(href);
        found++;

        const dateText = $(el).find(".post-meta").first().text();
        // Use listing excerpt — avoids slow per-job detail page fetches
        const excerpt = cleanText(
          $(el).find(".post-excerpt, .entry-summary, .entry-content, .post-content").first().text()
        ).slice(0, 2000);

        const { title, company } = splitTitleAndCompany(rawTitle);
        const location = guessLocationFromTitle(rawTitle);
        const fullText = `${title} ${excerpt}`;

        jobs.push({
          externalId: href.replace(/\/+$/, "").split("/").pop() ?? href,
          sourceUrl: href,
          title,
          company,
          companyUrl: null,
          location,
          employmentType: guessEmploymentType(fullText),
          category: guessCategory(title),
          tags: extractTags(fullText),
          description: excerpt,
          salaryRange: null,
          postedAt: parseGermanDate(dateText || null),
        });
      });

      if (found === 0) break; // empty page → done
    }

    return typeof limit === "number" ? jobs.slice(0, limit) : jobs;
  },
};
