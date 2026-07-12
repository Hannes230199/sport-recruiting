import { CandidateProfile, Job, MatchResult } from "./types";

/**
 * Regelbasiertes Matching mit CV-Text-Unterstützung.
 *
 * Score 0-100, aufgeteilt auf 6 Dimensionen:
 *   - Sportart-Match        20 Punkte
 *   - Rollen-Match          20 Punkte
 *   - Skill-Overlap         20 Punkte
 *   - CV-Text-Match         20 Punkte  ← neu: Keywords aus Job im CV gefunden
 *   - Standort              10 Punkte
 *   - Anstellungsart        10 Punkte
 */

const WEIGHTS = {
  sport: 20,
  role: 20,
  skillOverlap: 20,
  cvMatch: 20,
  location: 10,
  employmentType: 10,
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function textContainsAny(text: string, terms: string[]): string[] {
  const normalizedText = normalize(text);
  return terms.filter((term) => term.length > 2 && normalizedText.includes(normalize(term)));
}

/** Extrahiert bedeutungstragende Keywords aus einem Job für den CV-Abgleich. */
function extractJobKeywords(job: Job): string[] {
  const keywords: string[] = [];

  // Titel-Wörter (mind. 4 Zeichen, keine Stopwörter)
  const STOP = new Set(["und", "oder", "für", "mit", "bei", "der", "die", "das", "eine", "einen", "m/w/d", "w/m/d"]);
  const titleWords = job.title
    .split(/[\s/,()\-]+/)
    .map((w) => w.replace(/[^a-zA-ZäöüÄÖÜß]/g, ""))
    .filter((w) => w.length >= 4 && !STOP.has(w.toLowerCase()));
  keywords.push(...titleWords);

  // Kategorie
  if (job.category) keywords.push(job.category);

  // Tags
  keywords.push(...job.tags);

  // Top-Keywords aus Beschreibung (häufig vorkommende substantivische Begriffe)
  // Einfache Heuristik: Großgeschriebene Wörter mit mind. 5 Zeichen
  const descWords = job.description
    .split(/\s+/)
    .filter((w) => w.length >= 5 && /^[A-ZÄÖÜ]/.test(w))
    .map((w) => w.replace(/[^a-zA-ZäöüÄÖÜß]/g, ""))
    .filter((w) => w.length >= 5 && !STOP.has(w.toLowerCase()));

  // Dedupliziert, max. 30 Keywords aus Beschreibung
  const descSet = new Set(descWords);
  keywords.push(...Array.from(descSet).slice(0, 30));

  return [...new Set(keywords)]; // global dedup
}

export function scoreJobForCandidate(job: Job, candidate: CandidateProfile): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Sportart-Match (Titel, Kategorie, Tags)
  const haystack = [job.title, job.category ?? "", ...job.tags].join(" ");
  const matchedSports = textContainsAny(haystack, candidate.sports);
  if (matchedSports.length > 0) {
    score += WEIGHTS.sport;
    reasons.push(`Sportart-Match: ${matchedSports.join(", ")}`);
  }

  // 2. Rollen-Match (gewünschte Rolle im Jobtitel)
  const matchedRoles = textContainsAny(job.title, candidate.desiredRoles);
  if (matchedRoles.length > 0) {
    score += WEIGHTS.role;
    reasons.push(`Passende Rolle: ${matchedRoles.join(", ")}`);
  }

  // 3. Skill-Overlap (Skills vs. Tags + Beschreibung)
  const jobText = [job.description, ...job.tags].join(" ");
  const matchedSkills = textContainsAny(jobText, candidate.skills);
  if (matchedSkills.length > 0) {
    const overlapRatio = matchedSkills.length / Math.max(candidate.skills.length, 1);
    score += Math.round(WEIGHTS.skillOverlap * Math.min(overlapRatio * 1.5, 1));
    reasons.push(`Skill-Überlappung: ${matchedSkills.join(", ")}`);
  }

  // 4. CV-Text-Match (Job-Keywords im Lebenslauf gefunden)
  if (candidate.cvText && candidate.cvText.length > 50) {
    const jobKeywords = extractJobKeywords(job);
    const matchedInCv = textContainsAny(candidate.cvText, jobKeywords);
    if (matchedInCv.length > 0) {
      // Score skaliert mit Trefferquote (max. 20 Punkte)
      const ratio = matchedInCv.length / Math.max(jobKeywords.length, 1);
      const cvScore = Math.round(WEIGHTS.cvMatch * Math.min(ratio * 3, 1));
      score += cvScore;
      const topMatches = matchedInCv.slice(0, 4).join(", ");
      reasons.push(`CV-Match: ${topMatches}${matchedInCv.length > 4 ? ` +${matchedInCv.length - 4}` : ""}`);
    }
  }

  // 5. Standort-Match
  if (job.location) {
    const normalizedLocation = normalize(job.location);
    const locationMatch = candidate.desiredLocations.some((loc) =>
      normalizedLocation.includes(normalize(loc))
    );
    if (locationMatch) {
      score += WEIGHTS.location;
      reasons.push(`Standort passt: ${job.location}`);
    }
  }

  // 6. Anstellungsart-Match
  if (candidate.employmentTypes.includes(job.employmentType)) {
    score += WEIGHTS.employmentType;
    reasons.push(`Anstellungsart passt: ${job.employmentType}`);
  }

  return {
    job,
    score: Math.min(score, 100),
    reasons,
  };
}

export function rankJobsForCandidate(jobs: Job[], candidate: CandidateProfile): MatchResult[] {
  return jobs
    .map((job) => scoreJobForCandidate(job, candidate))
    .sort((a, b) => b.score - a.score);
}
