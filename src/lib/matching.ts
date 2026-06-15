import { CandidateProfile, Job, MatchResult } from "./types";

/**
 * Einfache, erklärbare Matching-Logik (Regelbasiert / Keyword-Scoring).
 *
 * Ziel: Ein Score 0-100, der grob widerspiegelt, wie gut ein Job zu einem
 * Kandidatenprofil passt - inkl. nachvollziehbarer Gründe ("reasons"), die
 * im Frontend angezeigt werden können.
 *
 * Diese Funktion ist bewusst simpel gehalten und kann später durch ein
 * Embedding-/LLM-basiertes Matching ersetzt oder ergänzt werden, ohne dass
 * sich die Aufrufer (UI, API-Routen) ändern müssen - solange `MatchResult`
 * als Rückgabetyp erhalten bleibt.
 */

const WEIGHTS = {
  sport: 30,
  role: 25,
  skillOverlap: 25,
  location: 10,
  employmentType: 10,
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function textContainsAny(text: string, terms: string[]): string[] {
  const normalizedText = normalize(text);
  return terms.filter((term) => normalizedText.includes(normalize(term)));
}

export function scoreJobForCandidate(job: Job, candidate: CandidateProfile): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Sportart-Match (im Titel, Kategorie oder Tags)
  const haystack = [job.title, job.category ?? "", ...job.tags].join(" ");
  const matchedSports = textContainsAny(haystack, candidate.sports);
  if (matchedSports.length > 0) {
    score += WEIGHTS.sport;
    reasons.push(`Sportart-Match: ${matchedSports.join(", ")}`);
  }

  // 2. Rollen-Match (gewünschte Rolle taucht im Jobtitel auf)
  const matchedRoles = textContainsAny(job.title, candidate.desiredRoles);
  if (matchedRoles.length > 0) {
    score += WEIGHTS.role;
    reasons.push(`Passende Rolle: ${matchedRoles.join(", ")}`);
  }

  // 3. Skill-Overlap (Skills des Kandidaten vs. Tags/Beschreibung des Jobs)
  const jobText = [job.description, ...job.tags].join(" ");
  const matchedSkills = textContainsAny(jobText, candidate.skills);
  if (matchedSkills.length > 0) {
    const overlapRatio = matchedSkills.length / Math.max(candidate.skills.length, 1);
    score += Math.round(WEIGHTS.skillOverlap * Math.min(overlapRatio * 1.5, 1));
    reasons.push(`Skill-Überlappung: ${matchedSkills.join(", ")}`);
  }

  // 4. Standort-Match (inkl. "Remote")
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

  // 5. Anstellungsart-Match
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

/**
 * Sortiert eine Liste von Jobs nach Match-Score für einen Kandidaten
 * (absteigend). Jobs mit Score 0 werden nicht ausgeschlossen, damit die
 * Liste vollständig bleibt - das Frontend kann z.B. einen Mindest-Score
 * als Filter anbieten.
 */
export function rankJobsForCandidate(jobs: Job[], candidate: CandidateProfile): MatchResult[] {
  return jobs
    .map((job) => scoreJobForCandidate(job, candidate))
    .sort((a, b) => b.score - a.score);
}
