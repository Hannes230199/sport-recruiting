import type { SupabaseClient } from "@supabase/supabase-js";
import { Application, ApplicationCandidate, ApplicationStatus } from "@/lib/types";
import { JobRow, rowToJob } from "./jobs";

interface ApplicationRow {
  id: string;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  match_score: number | null;
  applied_at: string | null;
  updated_at: string;
  notes: string | null;
  jobs: JobRow | null;
}

interface CandidateProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
}

interface ApplicationRowWithCandidate extends ApplicationRow {
  candidate_profiles: CandidateProfileRow | null;
}

const APPLICATION_COLUMNS_WITH_JOB =
  "id, candidate_id, job_id, status, match_score, applied_at, updated_at, notes, jobs(*)";

/** Für den Recruiter-Bereich: Bewerbung inkl. Job- UND Kandidat:innen-Daten. */
const APPLICATION_COLUMNS_FOR_RECRUITER =
  "id, candidate_id, job_id, status, match_score, applied_at, updated_at, notes, jobs(*), candidate_profiles(id, full_name, email, phone, location)";

function rowToCandidate(row: CandidateProfileRow): ApplicationCandidate {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    location: row.location,
  };
}

function rowToApplication(row: ApplicationRow | ApplicationRowWithCandidate): Application {
  const candidateRow = (row as ApplicationRowWithCandidate).candidate_profiles;

  return {
    id: row.id,
    candidateId: row.candidate_id,
    jobId: row.job_id,
    status: row.status,
    matchScore: row.match_score,
    appliedAt: row.applied_at,
    updatedAt: row.updated_at,
    notes: row.notes,
    job: row.jobs ? rowToJob(row.jobs) : undefined,
    candidate: candidateRow ? rowToCandidate(candidateRow) : undefined,
  };
}

/** Alle Bewerbungen eines Kandidaten inkl. der zugehörigen Job-Daten. */
export async function getApplications(
  supabase: SupabaseClient,
  candidateId: string
): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_COLUMNS_WITH_JOB)
    .eq("candidate_id", candidateId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getApplications:", error.message);
    return [];
  }

  return (data as unknown as ApplicationRow[]).map(rowToApplication);
}

/** Prüft, ob für (Kandidat, Job) bereits eine Bewerbung existiert. */
export async function getApplicationForJob(
  supabase: SupabaseClient,
  candidateId: string,
  jobId: string
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_COLUMNS_WITH_JOB)
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (error) {
    console.error("getApplicationForJob:", error.message);
    return null;
  }
  if (!data) return null;

  return rowToApplication(data as unknown as ApplicationRow);
}

/**
 * Legt eine Bewerbung an ("Jetzt bewerben"). Falls für diesen Job bereits
 * eine Bewerbung existiert (unique constraint candidate_id+job_id), wird
 * stattdessen `status`/`match_score`/`applied_at` aktualisiert.
 */
export async function createOrUpdateApplication(
  supabase: SupabaseClient,
  candidateId: string,
  jobId: string,
  matchScore: number | null
): Promise<void> {
  const { error } = await supabase.from("applications").upsert(
    {
      candidate_id: candidateId,
      job_id: jobId,
      status: "submitted" as ApplicationStatus,
      match_score: matchScore,
      applied_at: new Date().toISOString(),
    },
    { onConflict: "candidate_id,job_id" }
  );

  if (error) {
    throw new Error(`Bewerbung konnte nicht gespeichert werden: ${error.message}`);
  }
}

/**
 * Alle Bewerbungen aller Kandidat:innen inkl. Job- und Kandidat:innen-Daten
 * (Recruiter-Bereich). Setzt voraus, dass die RLS-Policy
 * "Recruiter lesen alle Bewerbungen" greift (eingeloggter Nutzer mit
 * `is_recruiter = true`) - andernfalls liefert Supabase eine leere Liste.
 */
export async function getAllApplications(
  supabase: SupabaseClient,
  filters?: { status?: ApplicationStatus }
): Promise<Application[]> {
  let query = supabase
    .from("applications")
    .select(APPLICATION_COLUMNS_FOR_RECRUITER)
    .order("updated_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getAllApplications:", error.message);
    return [];
  }

  return (data as unknown as ApplicationRowWithCandidate[]).map(rowToApplication);
}

/**
 * Aktualisiert Status und/oder Notizen einer Bewerbung (Recruiter-Bereich).
 * Setzt voraus, dass die RLS-Policy "Recruiter aktualisieren alle
 * Bewerbungen" greift.
 */
export async function updateApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string,
  status: ApplicationStatus,
  notes: string | null
): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ status, notes })
    .eq("id", applicationId);

  if (error) {
    throw new Error(`Status konnte nicht aktualisiert werden: ${error.message}`);
  }
}
