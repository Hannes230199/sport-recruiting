import { NextRequest, NextResponse } from "next/server";

import { SCRAPERS, runScrapers, upsertJobs } from "@/scrapers/core";

/**
 * Cron-Endpoint, der täglich alle Job-Scraper ausführt und die Ergebnisse
 * per Upsert in die `jobs`-Tabelle schreibt. Wird von Vercel Cron
 * (siehe `vercel.json`) per GET aufgerufen.
 *
 * Absicherung: Wenn die Umgebungsvariable `CRON_SECRET` gesetzt ist, muss
 * der Request den Header `Authorization: Bearer <CRON_SECRET>` mitbringen.
 * Vercel setzt diesen Header bei Cron-Aufrufen automatisch, sofern eine
 * Umgebungsvariable namens `CRON_SECRET` im Projekt existiert - siehe
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 *
 * Manuelles Testen (lokal oder per curl):
 *   curl -H "Authorization: Bearer <CRON_SECRET>" \
 *        "https://<dein-projekt>.vercel.app/api/scrape-trigger"
 *
 * Optional: `?limit=3` begrenzt jede Quelle auf max. N Jobs (zum Testen).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Kein Secret konfiguriert -> Endpoint ist offen. Für Produktion
    // unbedingt CRON_SECRET setzen!
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const results = await runScrapers(SCRAPERS, limit && !Number.isNaN(limit) ? limit : undefined);
  console.log("[scrape] jobs per source:", results.map((r) => `${r.source}:${r.jobs.length}${r.error ? "(ERR:" + r.error + ")" : ""}`).join(", "));

  const summary = await upsertJobs(results);
  console.log("[scrape] upsert summary:", summary.map((s) => `${s.source}:${s.upsertedCount ?? "ERR"}${s.error ? "(ERR:" + s.error + ")" : ""}`).join(", "));

  const totalJobs = results.reduce((sum, r) => sum + r.jobs.length, 0);
  const hasErrors = summary.some((s) => s.error);

  return NextResponse.json(
    {
      ok: !hasErrors,
      totalJobs,
      sources: summary,
      scrapedAt: new Date().toISOString(),
    },
    { status: hasErrors ? 207 : 200 }
  );
}
