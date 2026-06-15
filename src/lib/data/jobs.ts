import type { SupabaseClient } from "@supabase/supabase-js";
import { EmploymentType, Job, JobSource } from "@/lib/types";

/** Rohe Zeile aus der `jobs`-Tabelle (snake_case, wie in Postgres). */
export interface JobRow {
  id: string;
  source: JobSource;
  external_id: string | null;
  source_url: string;
  title: string;
  company: string | null;
  location: string | null;
  employment_type: EmploymentType;
  category: string | null;
  tags: string[] | null;
  description: string | null;
  salary_range: string | null;
  posted_at: string | null;
  scraped_at: string;
  is_active: boolean;
}

export function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    source: row.source,
    externalId: row.external_id,
    sourceUrl: row.source_url,
    title: row.title,
    company: row.company,
    location: row.location,
    employmentType: row.employment_type,
    category: row.category,
    tags: row.tags ?? [],
    description: row.description ?? "",
    salaryRange: row.salary_range,
    postedAt: row.posted_at,
    scrapedAt: row.scraped_at,
    isActive: row.is_active,
  };
}

export interface JobFilters {
  q?: string;
  source?: string;
  category?: string;
  employmentType?: string;
}

const JOB_COLUMNS =
  "id, source, external_id, source_url, title, company, location, employment_type, category, tags, description, salary_range, posted_at, scraped_at, is_active";

/** Die N zuletzt veröffentlichten aktiven Jobs (für die Startseite). */
export async function getLatestJobs(supabase: SupabaseClient, limit: number): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("is_active", true)
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("getLatestJobs:", error.message);
    return [];
  }

  return (data as JobRow[]).map(rowToJob);
}

/**
 * Aktive Jobs mit optionalen Filtern (Volltextsuche, Quelle, Kategorie,
 * Anstellungsart), sortiert nach Veröffentlichungsdatum (neueste zuerst).
 */
export async function getJobs(supabase: SupabaseClient, filters: JobFilters): Promise<Job[]> {
  let query = supabase.from("jobs").select(JOB_COLUMNS).eq("is_active", true);

  if (filters.source) {
    query = query.eq("source", filters.source);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.employmentType) {
    query = query.eq("employment_type", filters.employmentType);
  }
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    // Volltextsuche über title/description (search_vector) ODER
    // einfache ILIKE-Treffer auf Titel/Firma/Ort - robuster bei kurzen
    // oder ungewöhnlichen Suchbegriffen als reine Volltextsuche.
    const likeQ = `%${q.replace(/[%_]/g, "")}%`;
    query = query.or(
      `title.ilike.${likeQ},company.ilike.${likeQ},location.ilike.${likeQ}`
    );
  }

  query = query.order("posted_at", { ascending: false, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    console.error("getJobs:", error.message);
    return [];
  }

  return (data as JobRow[]).map(rowToJob);
}

/** Einzelnen Job per ID laden (z.B. für die Detailseite). */
export async function getJobById(supabase: SupabaseClient, id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getJobById:", error.message);
    return null;
  }
  if (!data) return null;

  return rowToJob(data as JobRow);
}

/** Distinkte, nicht-leere Kategorien aller aktiven Jobs (für den Filter). */
export async function getJobCategories(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null);

  if (error) {
    console.error("getJobCategories:", error.message);
    return [];
  }

  const categories = new Set<string>();
  for (const row of data as { category: string | null }[]) {
    if (row.category) categories.add(row.category);
  }
  return Array.from(categories).sort();
}
