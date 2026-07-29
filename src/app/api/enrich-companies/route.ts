/**
 * POST /api/enrich-companies
 *
 * Fetches company website URLs for existing jobs in the DB that have
 * company_url = NULL. Processes a limited batch per call so Vercel's
 * function timeout is not exceeded.
 *
 * Query params:
 *   ?limit=N   - how many jobs to enrich per call (default 30)
 *
 * Protected by CRON_SECRET just like the main scrape-trigger route.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrichExistingJobs } from "@/scrapers/enricher";

export const maxDuration = 60; // Vercel Pro function timeout

export async function POST(req: NextRequest) {
  // Auth check
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10),
    100
  );

  const supabase = createAdminClient();

  // Fetch jobs with no company_url, ordered by newest first
  const { data: jobs, error: fetchError } = await supabase
    .from("jobs")
    .select("id, source_url, company")
    .is("company_url", null)
    .not("source_url", "is", null)
    .order("scraped_at", { ascending: false })
    .limit(limit);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ enriched: 0, message: "No jobs need enrichment." });
  }

  const sourceUrls = jobs.map((j) => j.source_url as string);
  const urlMap = await enrichExistingJobs(sourceUrls, 5);

  if (urlMap.size === 0) {
    return NextResponse.json({ enriched: 0, attempted: jobs.length });
  }

  // Update each found company URL
  let enriched = 0;
  for (const job of jobs) {
    const companyUrl = urlMap.get(job.source_url as string);
    if (!companyUrl) continue;

    const { error: updateError } = await supabase
      .from("jobs")
      .update({ company_url: companyUrl })
      .eq("id", job.id);

    if (!updateError) enriched++;
  }

  return NextResponse.json({
    enriched,
    attempted: jobs.length,
    found: urlMap.size,
  });
}
