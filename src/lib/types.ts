/**
 * Zentrale Typdefinitionen für die Sport-Recruiting-Plattform.
 *
 * Diese Typen spiegeln das Datenbankschema aus
 * `supabase/migrations/0001_init.sql` wider. Wenn sich das Schema ändert,
 * bitte auch hier anpassen (oder später durch generierte Supabase-Typen
 * ersetzen: `supabase gen types typescript`).
 */

export type JobSource =
  | "jobsimsport"
  | "dshs_koeln"
  | "spobis_jobs"
  | "sport_job"
  | "joborama";

export const JOB_SOURCES: { id: JobSource; label: string; url: string }[] = [
  { id: "jobsimsport", label: "JobsImSport.de", url: "https://jobsimsport.de/" },
  { id: "dshs_koeln", label: "DSHS Köln Jobbörse", url: "https://jobs.dshs-koeln.de/jobs/" },
  { id: "spobis_jobs", label: "SPOBIS Jobs", url: "https://www.spobis-jobs.com/" },
  { id: "sport_job", label: "Sport-Job.com", url: "https://www.sport-job.com/" },
  { id: "joborama", label: "Joborama", url: "https://www.joborama.de/" },
];

export type EmploymentType =
  | "vollzeit"
  | "teilzeit"
  | "praktikum"
  | "werkstudent"
  | "ausbildung"
  | "freelance"
  | "unbekannt";

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  vollzeit: "Vollzeit",
  teilzeit: "Teilzeit",
  praktikum: "Praktikum",
  werkstudent: "Werkstudent",
  ausbildung: "Ausbildung",
  freelance: "Freelance",
  unbekannt: "Unbekannt",
};

export interface Job {
  id: string;
  source: JobSource;
  externalId: string | null;
  sourceUrl: string;
  title: string;
  company: string | null;
  location: string | null;
  employmentType: EmploymentType;
  /** z.B. "Fußball", "Eventmanagement", "Marketing", "Reha & Physio" */
  category: string | null;
  /** Freitext-Skills/Tags, die aus der Stellenbeschreibung extrahiert wurden */
  tags: string[];
  description: string;
  salaryRange: string | null;
  postedAt: string | null; // ISO date
  scrapedAt: string; // ISO datetime
  isActive: boolean;
}

export type DocumentType = "cv" | "cover_letter" | "certificate" | "reference" | "other";

export interface CandidateDocument {
  id: string;
  candidateId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface CandidateProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  /** z.B. ["Trainerschein A", "Eventmanagement", "Social Media"] */
  skills: string[];
  /** z.B. ["Fußball", "Basketball"] */
  sports: string[];
  desiredRoles: string[];
  desiredLocations: string[];
  employmentTypes: EmploymentType[];
  documents: CandidateDocument[];
  isRecruiter: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Entwurf",
  submitted: "Eingereicht",
  in_review: "In Prüfung",
  interview: "Interview",
  offer: "Angebot",
  rejected: "Abgelehnt",
  withdrawn: "Zurückgezogen",
};

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: ApplicationStatus;
  matchScore: number | null;
  appliedAt: string | null;
  updatedAt: string;
  notes: string | null;
  // joined for convenience in der UI
  job?: Job;
  // nur für den Recruiter-Bereich befüllt (Kandidat:innen-Stammdaten)
  candidate?: ApplicationCandidate;
}

/** Reduzierte Kandidat:innen-Infos für die Recruiter-Übersicht. */
export interface ApplicationCandidate {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
}

export interface MatchResult {
  job: Job;
  score: number; // 0-100
  reasons: string[];
}
