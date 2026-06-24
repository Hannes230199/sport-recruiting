import * as cheerio from "cheerio";
import { Scraper, ScrapedJob } from "../types";
import { cleanText, extractTags, guessCategory, guessEmploymentType, parseGermanDate } from "../normalize";

const BASE_URL = "https://www.joborama.de";
const MAX_CATEGORY_PAGES = 10;

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

interface RawEntry {
  href: string;
  title: string;
  company: string | null;
  category: string | null;
}

/**
 * joborama.de gruppiert Jobs auf der Startseite in `section.job-cards` nach
 * Kategorien (z.B. "Sport & Management", "Tourismus & Gastgewerbe",
 * "Fitness, Health & Wellness", "Event, Medien & Wirtschaft"). Jede Kategorie
 * ist ein `article.card` mit Überschrift in `.card-header h2`, zeigt aber
 * nur 4 Jobs pro Kategorie mit einem "Alle Jobs"-Link zur vollständigen
 * Kategorie-Seite.
 *
 * Jeder Job-Eintrag ist ein `a.job-item-link` mit `span.job-title` und
 * `span.job-company`. Diese Struktur ist sowohl auf der Startseite als auch
 * auf den Kategorie-Seiten ("Alle Jobs"-Links) identisch.
 *
 * Dieser Scraper liest die Startseite (für die Kategorie-Zuordnung) und
 * paginiert durch alle Kategorie-Seiten via `?page=N`.
 */
export const joboramaScraper: Scraper = {
  source: "joborama",
  label: "Joborama.de",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const jobs: ScrapedJob[] = [];
    const seen = new Set<string>();
    const entries: RawEntry[] = [];

    const homeHtml = await fetchHtml(`${BASE_URL}/`);
    if (!homeHtml) return [];
    const $ = cheerio.load(homeHtml);

    const categoryLinks: { category: string | null; allJobsHref: string }[] = [];

    $("section.job-cards article.card").each((_, article) => {
      const $article = $(article);
      const category = cleanText($article.find(".card-header h2").first().text()) || null;

      // Collect preview jobs shown on the homepage (associate category)
      $article.find("a.job-item-link").each((_, el) => {
        const $el = $(el);
        const href = $el.attr("href");
        if (!href) return;
        const sourceUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        if (seen.has(sourceUrl)) return;
        seen.add(sourceUrl);
        const title = cleanText($el.find(".job-title").first().text());
        const company = cleanText($el.find(".job-company").first().text()) || null;
        if (!title) return;
        entries.push({ href: sourceUrl, title, company, category });
      });

      // Find the "Alle Jobs" link for this category
      $article.find("a").each((_, el) => {
        const $el = $(el);
        const text = cleanText($el.text());
        const href = $el.attr("href");
        if (href && /alle jobs/i.test(text)) {
          categoryLinks.push({
            category,
            allJobsHref: href.startsWith("http") ? href : `${BASE_URL}${href}`,
          });
        }
      });
    });

    // Paginate through each category's full job list
    for (const { category, allJobsHref } of categoryLinks) {
      if (typeof limit === "number" && entries.length >= limit) break;

      for (let page = 1; page <= MAX_CATEGORY_PAGES; page++) {
        const pageUrl = page === 1 ? allJobsHref : `${allJobsHref}?page=${page}`;
        const catHtml = await fetchHtml(pageUrl);
        if (!catHtml) break;

        const $cat = cheerio.load(catHtml);
        const before = entries.length;

        $cat("a.job-item-link").each((_, el) => {
          const $el = $cat(el);
          const href = $el.attr("href");
          if (!href) return;
          const sourceUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
          if (seen.has(sourceUrl)) return;
          seen.add(sourceUrl);
          const title = cleanText($el.find(".job-title").first().text());
          const company = cleanText($el.find(".job-company").first().text()) || null;
          if (!title) return;
          entries.push({ href: sourceUrl, title, company, category });
        });

        if (entries.length === before) break; // no new entries → last page
      }
    }

    const limited = typeof limit === "number" ? entries.slice(0, limit) : entries;

    for (const entry of limited) {
      const fullText = `${entry.title} ${entry.company ?? ""}`;
      jobs.push({
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
      });
    }

    return jobs;
  },
};
