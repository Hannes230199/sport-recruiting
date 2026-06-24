import { Scraper, ScrapedJob } from "../types";
import { cleanText, extractTags, guessCategory, guessEmploymentType } from "../normalize";

const BASE_URL = "https://jobs.dshs-koeln.de";
const API_URL = `${BASE_URL}/api/v1/jobs`;

const PAGE_SIZE = 50; // items per API request

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "SportRecruitingBot/0.1 (+mailto:hannes.schwedhelm@ringier.ch)";

interface ApiTag {
  uid: number;
  name: string;
}

interface ApiProvider {
  uid: number;
  company: string;
  website?: string | null;
}

interface ApiJob {
  id: number;
  title: string;
  description: string;
  publishedAt: string | null;
  created: string;
  zip: string | null;
  city: string | null;
  sectors: ApiTag[];
  employments: ApiTag[];
  provider: ApiProvider | null;
}

interface ApiResponse {
  data: ApiJob[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

async function fetchPage(page: number): Promise<ApiResponse> {
  const url = `${API_URL}?page=${page}&limit=${PAGE_SIZE}&premium=0`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`dshs_koeln: GET ${url} -> ${res.status}`);
  }
  return (await res.json()) as ApiResponse;
}

async function fetchAllJobs(): Promise<ApiJob[]> {
  const allJobs: ApiJob[] = [];
  const first = await fetchPage(1);
  allJobs.push(...(first.data ?? []));

  const totalPages = first.meta?.totalPages ?? 1;
  for (let page = 2; page <= totalPages; page++) {
    const response = await fetchPage(page);
    const items = response.data ?? [];
    if (items.length === 0) break;
    allJobs.push(...items);
  }

  return allJobs;
}

/**
 * Erzeugt aus dem Jobtitel den URL-Slug, den das Frontend für Detailseiten
 * verwendet (z.B. "Übungsleiterin (m/w/d) ..." -> "ubungsleiterin-mwd-...").
 * Umlaute werden transliteriert, Klammern/Sonderzeichen entfernt und
 * Leerzeichen zu Bindestrichen.
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s-]/g, "")
    .replace(/[äöüß]/g, (c) => ({ ä: "a", ö: "o", ü: "u", ß: "ss" }[c] ?? c))
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toDateOnly(iso: string | null): string | null {
  if (!iso) return null;
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * jobs.dshs-koeln.de ist eine Next.js-Anwendung, deren Stellenliste
 * clientseitig nachgeladen wird - im statischen HTML fehlt sie. Die Seite
 * lädt die Daten allerdings von einer öffentlichen JSON-API unter
 * `/api/v1/jobs?page=1&limit=N&premium=0`, die direkt abgefragt werden kann
 * (Antwort: `{ data: [...], meta: { totalItems, ... } }`).
 *
 * Detailseiten folgen dem Muster `/jobs/{id}/{slug}/`, wobei `{slug}` aus
 * dem Titel abgeleitet wird (siehe `slugify`).
 */
export const dshsKoelnScraper: Scraper = {
  source: "dshs_koeln",
  label: "DSHS Köln Jobs",
  baseUrl: BASE_URL,

  async scrape(limit) {
    const apiJobs = await fetchAllJobs();

    const jobs: ScrapedJob[] = [];
    for (const job of apiJobs) {
      const title = cleanText(job.title);
      if (!title) continue;

      const description = cleanText(job.description).slice(0, 5000);
      const company = job.provider?.company ? cleanText(job.provider.company) : null;
      const companyUrl = job.provider?.website
        ? (job.provider.website.startsWith("http") ? job.provider.website : `https://${job.provider.website}`)
        : null;
      const location = job.city ? cleanText(job.city) : null;
      const category = job.sectors?.[0]?.name ? cleanText(job.sectors[0].name) : guessCategory(title);
      const employmentRaw = job.employments?.map((e) => e.name).join(" ") ?? "";
      const fullText = `${title} ${employmentRaw} ${description}`;

      jobs.push({
        externalId: String(job.id),
        sourceUrl: `${BASE_URL}/jobs/${job.id}/${slugify(title)}/`,
        title,
        company,
        companyUrl,
        location,
        employmentType: guessEmploymentType(`${employmentRaw} ${title}`),
        category,
        tags: extractTags(fullText),
        description,
        salaryRange: null,
        postedAt: toDateOnly(job.publishedAt ?? job.created),
      });
    }

    return typeof limit === "number" ? jobs.slice(0, limit) : jobs;
  },
};
