import * as cheerio from "cheerio";
import { Scraper, ScrapedJob } from "../types";
import { cleanText, extractTags, guessCategory, guessEmploymentType, parseGermanDate } from "../normalize";

const BASE_URL = "https://www.joborama.de";

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "SportRecruitingBot/0.1 (+mailto:hannes.schwedhelm@ringier.ch)";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`joborama: GET ${url} -> ${res.status}`);
  }
  return res.text();
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
 * folgt zusätzlich den "Alle Jobs"-Links, um mehr als 4 Jobs pro Kategorie
 * zu erhalten.
 */
export const joboramaScraper: Scraper = {
  source: "joborama",
  label: "Joborama.de",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const jobs: ScrapedJob[] = [];
    const seen = new Set<string>();
    const entries: RawEntry[] = [];

    const html = await fetchHtml(`${BASE_URL}/`);
    const $ = cheerio.load(html);

    const categoryLinks: { category: string; allJobsHref: string }[] = [];

    $("section.job-cards article.card").each((_, article) => {
      const $article = $(article);
      const category = cleanText($article.find(".card-header h2").first().text()) || null;

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

      $article.find("a").each((_, el) => {
        const $el = $(el);
        const text = cleanText($el.text());
        const href = $el.attr("href");
        if (href && /alle jobs/i.test(text)) {
          categoryLinks.push({
            category: category ?? "",
            allJobsHref: href.startsWith("http") ? href : `${BASE_URL}${href}`,
          });
        }
      });
    });

    // Zusätzliche Jobs von den "Alle Jobs"-Kategorieseiten laden.
    for (const { category, allJobsHref } of categoryLinks) {
      if (typeof limit === "number" && entries.length >= limit) break;
      try {
        const categoryHtml = await fetchHtml(allJobsHref);
        const $cat = cheerio.load(categoryHtml);
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

          entries.push({ href: sourceUrl, title, company, category: category || null });
        });
      } catch {
        // Kategorie-Seite konnte nicht geladen werden - Startseiten-Jobs reichen trotzdem.
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
