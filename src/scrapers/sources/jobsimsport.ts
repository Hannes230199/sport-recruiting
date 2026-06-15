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

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "SportRecruitingBot/0.1 (+mailto:hannes.schwedhelm@ringier.ch)";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`jobsimsport: GET ${url} -> ${res.status}`);
  }
  return res.text();
}

/**
 * Versucht aus einem Titel wie
 * "Athletiktrainer (m/w/d) Nachwuchsleistungszentrum – 1. FC Beispielstadt"
 * den Firmennamen nach dem letzten "–"/"-" zu extrahieren.
 */
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

/**
 * Versucht aus dem Titel einen Standort zu extrahieren, z.B.
 * "... in Köln ..." oder "... (Remote) ...".
 */
function guessLocationFromTitle(title: string): string | null {
  const remoteMatch = title.match(/remote/i);
  const inMatch = title.match(/\bin\s+([A-ZÄÖÜ][\wäöüßÄÖÜ.\-]+(?:\s+[A-ZÄÖÜ][\wäöüßÄÖÜ.\-]+)?)/);
  if (inMatch) {
    return cleanText(inMatch[1]);
  }
  if (remoteMatch) return "Remote";
  return null;
}

/**
 * Holt die Beschreibung von der Detailseite eines Jobs
 * (Elementor/WordPress -> Hauptinhalt steht meist in `.entry-content`).
 */
async function fetchDescription(url: string): Promise<string> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const content = $(".post-content").first();
    if (content.length === 0) return "";
    // Entferne Skripte/Styles, falls vorhanden
    content.find("script, style").remove();
    return cleanText(content.text()).slice(0, 5000);
  } catch {
    return "";
  }
}

export const jobsImSportScraper: Scraper = {
  source: "jobsimsport",
  label: "JobsImSport.de",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const html = await fetchHtml(`${BASE_URL}/`);
    const $ = cheerio.load(html);

    const entries: { title: string; url: string; postedAt: string | null }[] = [];

    // Aktuelle Theme-Struktur: jeder Beitrag liegt in einem ".hentry"
    // innerhalb von ".posts", der Titel-Link in "h2.post-title a". Das
    // Veröffentlichungsdatum steht als Freitext (z.B. "Juni 15, 2026") in
    // ".post-meta" - kein <time>-Element mehr vorhanden.
    $(".posts .hentry").each((_, el) => {
      const titleLink = $(el).find("h2.post-title a").first();
      const href = titleLink.attr("href");
      const title = titleLink.text();
      if (!href || !title) return;

      const dateText = $(el).find(".post-meta").first().text();
      entries.push({
        title,
        url: href,
        postedAt: parseGermanDate(dateText || null),
      });
    });

    const limited = typeof limit === "number" ? entries.slice(0, limit) : entries;

    const jobs: ScrapedJob[] = [];
    for (const entry of limited) {
      const { title, company } = splitTitleAndCompany(entry.title);
      const description = await fetchDescription(entry.url);
      const location = guessLocationFromTitle(entry.title);
      const fullText = `${title} ${description}`;

      jobs.push({
        externalId: entry.url.replace(/\/+$/, "").split("/").pop() ?? entry.url,
        sourceUrl: entry.url,
        title,
        company,
        location,
        employmentType: guessEmploymentType(fullText),
        category: guessCategory(title),
        tags: extractTags(fullText),
        description,
        salaryRange: null,
        postedAt: entry.postedAt,
      });
    }

    return jobs;
  },
};
