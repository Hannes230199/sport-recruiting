import type { SupabaseClient } from "@supabase/supabase-js";
import { CandidateDocument, CandidateProfile, DocumentType, EmploymentType } from "@/lib/types";

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string[] | null;
  sports: string[] | null;
  desired_roles: string[] | null;
  desired_locations: string[] | null;
  employment_types: EmploymentType[] | null;
  favorite_companies: string[] | null;
  cv_text: string | null;
  is_recruiter: boolean | null;
  created_at: string;
  updated_at: string;
}

interface DocumentRow {
  id: string;
  candidate_id: string;
  type: DocumentType;
  file_name: string;
  storage_path: string;
  uploaded_at: string;
}

const PROFILE_COLUMNS =
  "id, full_name, email, phone, location, bio, skills, sports, desired_roles, desired_locations, employment_types, favorite_companies, cv_text, is_recruiter, created_at, updated_at";

function rowToProfile(row: ProfileRow, documents: CandidateDocument[]): CandidateProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    bio: row.bio,
    skills: row.skills ?? [],
    sports: row.sports ?? [],
    desiredRoles: row.desired_roles ?? [],
    desiredLocations: row.desired_locations ?? [],
    employmentTypes: row.employment_types ?? [],
    favoriteCompanies: row.favorite_companies ?? [],
    cvText: row.cv_text ?? null,
    documents,
    isRecruiter: row.is_recruiter ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Lädt das Profil des Kandidaten (inkl. Dokumente). Falls noch kein
 * `candidate_profiles`-Eintrag existiert (erster Login), wird einer mit
 * Standardwerten angelegt - dank RLS-Policy "Eigenes Profil anlegen" ist
 * das mit dem eingeloggten Nutzer-Client möglich.
 */
export async function getOrCreateProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<CandidateProfile> {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Profil konnte nicht geladen werden: ${error.message}`);
  }

  if (data) {
    const documents = await getCandidateDocuments(supabase, userId);
    return rowToProfile(data as ProfileRow, documents);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("candidate_profiles")
    .insert({ id: userId, email, full_name: "" })
    .select(PROFILE_COLUMNS)
    .single();

  if (insertError || !inserted) {
    throw new Error(`Profil konnte nicht angelegt werden: ${insertError?.message}`);
  }

  return rowToProfile(inserted as ProfileRow, []);
}

/**
 * Leichtgewichtige Prüfung, ob der eingeloggte Nutzer Recruiter:in ist
 * (z.B. für die Navigation im Header) - ohne `getOrCreateProfile`
 * aufzurufen, das bei fehlendem Profil einen neuen Eintrag anlegen würde.
 */
export async function isRecruiter(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("is_recruiter")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;

  return Boolean((data as { is_recruiter: boolean | null }).is_recruiter);
}

export interface ProfileUpdateInput {
  fullName: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  sports: string[];
  desiredRoles: string[];
  desiredLocations: string[];
  employmentTypes: EmploymentType[];
  favoriteCompanies: string[];
}

/** Speichert die vom Nutzer im Profilformular eingegebenen Angaben. */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  input: ProfileUpdateInput
): Promise<void> {
  const { error } = await supabase
    .from("candidate_profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      location: input.location,
      bio: input.bio,
      skills: input.skills,
      sports: input.sports,
      desired_roles: input.desiredRoles,
      desired_locations: input.desiredLocations,
      employment_types: input.employmentTypes,
      favorite_companies: input.favoriteCompanies,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Profil konnte nicht gespeichert werden: ${error.message}`);
  }
}

/**
 * Lädt die Dokumente eines Kandidaten und erzeugt für jedes eine
 * zeitlich begrenzte signierte URL (der Storage-Bucket ist privat).
 */
export async function getCandidateDocuments(
  supabase: SupabaseClient,
  candidateId: string
): Promise<CandidateDocument[]> {
  const { data, error } = await supabase
    .from("candidate_documents")
    .select("id, candidate_id, type, file_name, storage_path, uploaded_at")
    .eq("candidate_id", candidateId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("getCandidateDocuments:", error.message);
    return [];
  }

  const rows = data as DocumentRow[];
  if (rows.length === 0) return [];

  return Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("candidate-documents")
        .createSignedUrl(row.storage_path, 60 * 60);

      return {
        id: row.id,
        candidateId: row.candidate_id,
        type: row.type,
        fileName: row.file_name,
        fileUrl: signed?.signedUrl ?? "#",
        uploadedAt: row.uploaded_at,
      };
    })
  );
}

/**
 * Lädt eine Datei in den privaten Bucket `candidate-documents` hoch
 * (Pfad: `{candidateId}/{uuid}-{dateiname}`, passend zur RLS-Policy, die
 * den ersten Pfad-Teil mit `auth.uid()` vergleicht) und legt den
 * zugehörigen `candidate_documents`-Eintrag an.
 */
export async function uploadCandidateDocument(
  supabase: SupabaseClient,
  candidateId: string,
  type: DocumentType,
  file: File
): Promise<void> {
  const storagePath = `${candidateId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("candidate-documents")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) {
    throw new Error(`Datei konnte nicht hochgeladen werden: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase.from("candidate_documents").insert({
    candidate_id: candidateId,
    type,
    file_name: file.name,
    storage_path: storagePath,
  });

  if (insertError) {
    await supabase.storage.from("candidate-documents").remove([storagePath]);
    throw new Error(`Dokument konnte nicht gespeichert werden: ${insertError.message}`);
  }

  // Extract text from CV PDF and store for matching
  if (type === "cv" && file.type === "application/pdf") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = await import("pdf-parse") as any;
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await pdfParse(buffer);
      const cvText = parsed.text.slice(0, 20000); // cap at 20k chars
      await supabase
        .from("candidate_profiles")
        .update({ cv_text: cvText })
        .eq("id", candidateId);
    } catch (err) {
      // Non-fatal: matching still works without CV text
      console.warn("CV text extraction failed:", err);
    }
  }
}

/** Löscht ein Dokument (DB-Eintrag + Datei im Storage). */
export async function deleteCandidateDocument(
  supabase: SupabaseClient,
  candidateId: string,
  documentId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("candidate_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Dokument nicht gefunden: ${error?.message ?? documentId}`);
  }

  const { storage_path } = data as { storage_path: string };

  await supabase.storage.from("candidate-documents").remove([storage_path]);

  const { error: deleteError } = await supabase
    .from("candidate_documents")
    .delete()
    .eq("id", documentId)
    .eq("candidate_id", candidateId);

  if (deleteError) {
    throw new Error(`Dokument konnte nicht gelöscht werden: ${deleteError.message}`);
  }
}
