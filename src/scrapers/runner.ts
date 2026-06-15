/**
 * Scraper-Runner (CLI): führt alle Source-Scraper aus und schreibt die
 * Ergebnisse in die Supabase-`jobs`-Tabelle (Upsert über
 * `(source, external_id)`).
 *
 * Die eigentliche Logik (Scraper ausführen, Upsert) liegt in
 * `src/scrapers/core.ts` und wird auch vom Cron-Route-Handler
 * `src/app/api/scrape-trigger/route.ts` genutzt.
 *
 * Aufruf:
 *   npm run scrape         -> scraped + schreibt in die DB
 *   npm run scrape:dry      -> scraped nur, gibt Ergebnisse auf der Konsole aus
 *
 * Optional: SCRAPE_LIMIT=5 npm run scrape  -> begrenzt jede Quelle auf
 * max. N Jobs (nützlich zum Testen, damit nicht alle Detailseiten geladen
 * werden müssen).
 */

import fs from "fs";
import path from "path";

import { SCRAPERS, runScrapers, upsertJobs } from "./core";

/**
 * Lädt einfache KEY=VALUE-Paare aus `.env.local` / `.env` ins
 * `process.env`, falls dort noch nicht gesetzt. Bewusst minimal gehalten
 * (kein zusätzliches dotenv-Package), reicht für lokale Scraper-Läufe.
 */
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const isDryRun = process.argv.includes("--dry");
const limitEnv = process.env.SCRAPE_LIMIT ? Number(process.env.SCRAPE_LIMIT) : undefined;
const limit = limitEnv && !Number.isNaN(limitEnv) ? limitEnv : undefined;

async function main() {
  const results: Awaited<ReturnType<typeof runScrapers>> = [];

  for (const scraper of SCRAPERS) {
    process.stdout.write(`-> Scrape ${scraper.label} (${scraper.source})...\n`);
    const [result] = await runScrapers([scraper], limit);
    results.push(result);
    if (result.error) {
      process.stderr.write(`   Fehler: ${result.error}\n`);
    } else {
      process.stdout.write(`   ${result.jobs.length} Job(s) gefunden.\n`);
    }
  }

  const totalJobs = results.reduce((sum, r) => sum + r.jobs.length, 0);
  process.stdout.write(`\nInsgesamt ${totalJobs} Job(s) über ${results.length} Quelle(n).\n`);

  if (isDryRun) {
    process.stdout.write("\n--dry: keine DB-Schreibvorgänge. Beispiel-Jobs:\n");
    for (const result of results) {
      process.stdout.write(`\n## ${result.label} (${result.source})\n`);
      if (result.error) {
        process.stdout.write(`   Fehler: ${result.error}\n`);
        continue;
      }
      for (const job of result.jobs.slice(0, 3)) {
        process.stdout.write(
          `   - ${job.title} | ${job.company ?? "?"} | ${job.location ?? "?"} | ${job.employmentType} | ${job.sourceUrl}\n`
        );
      }
    }
    return;
  }

  const summary = await upsertJobs(results);
  for (const s of summary) {
    if (s.error) {
      process.stderr.write(`   Upsert-Fehler für ${s.label}: ${s.error}\n`);
    } else {
      process.stdout.write(`   ${s.label}: ${s.upsertedCount ?? s.jobCount} Zeile(n) upserted.\n`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
