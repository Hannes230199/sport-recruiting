"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, deleteCandidateDocument, uploadCandidateDocument } from "@/lib/data/profile";
import { DocumentType, EmploymentType } from "@/lib/types";

const ALLOWED_DOCUMENT_TYPES: DocumentType[] = ["cv", "cover_letter", "certificate", "reference", "other"];

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Server Action: speichert die Angaben aus dem Profilformular. */
export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/profil");
  }

  await updateProfile(supabase, user.id, {
    fullName: String(formData.get("fullName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    skills: splitList(formData.get("skills")),
    sports: splitList(formData.get("sports")),
    desiredRoles: splitList(formData.get("desiredRoles")),
    desiredLocations: splitList(formData.get("desiredLocations")),
    employmentTypes: formData.getAll("employmentTypes") as EmploymentType[],
  });

  revalidatePath("/profil");
}

/**
 * Server Action: lädt ein neues Dokument (CV, Zertifikat, ...) in den
 * privaten Storage-Bucket `candidate-documents` hoch und legt den
 * zugehörigen `candidate_documents`-Eintrag an.
 */
export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/profil");
  }

  const file = formData.get("file");
  const typeRaw = String(formData.get("documentType") ?? "other");
  const type = (
    ALLOWED_DOCUMENT_TYPES.includes(typeRaw as DocumentType) ? typeRaw : "other"
  ) as DocumentType;

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/profil?error=${encodeURIComponent("Bitte wähle eine Datei aus.")}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    redirect(`/profil?error=${encodeURIComponent("Datei ist zu groß (max. 10 MB).")}`);
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    redirect(
      `/profil?error=${encodeURIComponent("Nur PDF- und Word-Dateien (PDF, DOC, DOCX) sind erlaubt.")}`
    );
  }

  try {
    await uploadCandidateDocument(supabase, user.id, type, file);
  } catch (err) {
    redirect(
      `/profil?error=${encodeURIComponent(err instanceof Error ? err.message : "Upload fehlgeschlagen.")}`
    );
  }

  revalidatePath("/profil");
  redirect(`/profil?message=${encodeURIComponent("Dokument erfolgreich hochgeladen.")}`);
}

/** Server Action: entfernt ein hochgeladenes Dokument. */
export async function removeDocument(documentId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/profil");
  }

  await deleteCandidateDocument(supabase, user.id, documentId);
  revalidatePath("/profil");
}
