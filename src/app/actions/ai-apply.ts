"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getJobById } from "@/lib/data/jobs";
import { getOrCreateProfile } from "@/lib/data/profile";

export interface AIApplyResult {
  highlights: string[];
  coverLetter: string;
  reachOut: string;
}

export interface AIApplyResponse {
  success: boolean;
  data?: AIApplyResult;
  error?: string;
}

export async function generateApplicationHelper(jobId: string): Promise<AIApplyResponse> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return { success: false, error: "Nicht angemeldet." };
  }

  const [job, profile] = await Promise.all([
    getJobById(supabase, jobId),
    getOrCreateProfile(supabase, authData.user.id, authData.user.email ?? ""),
  ]);

  if (!job) return { success: false, error: "Job nicht gefunden." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { success: false, error: "KI nicht konfiguriert." };

  const client = new Anthropic({ apiKey });

  const profileSummary = [
    profile.fullName && `Name: ${profile.fullName}`,
    profile.bio && `Über mich: ${profile.bio}`,
    profile.skills.length > 0 && `Skills: ${profile.skills.join(", ")}`,
    profile.sports.length > 0 && `Sportarten: ${profile.sports.join(", ")}`,
    profile.desiredRoles.length > 0 && `Gewünschte Rollen: ${profile.desiredRoles.join(", ")}`,
    profile.location && `Standort: ${profile.location}`,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Du bist ein Karriere-Coach spezialisiert auf die Sport-Branche.
Hilf diesem Kandidaten bei der Bewerbung auf folgende Stelle.

## Kandidat:in
${profileSummary || "Keine Profilinfos vorhanden."}

## Stelle
Titel: ${job.title}
Unternehmen: ${job.company ?? "Unbekannt"}
Ort: ${job.location ?? "k.A."}
Beschreibung:
${job.description.slice(0, 3000)}

## Deine Aufgabe
Antworte ausschließlich als gültiges JSON-Objekt mit genau diesen drei Feldern:

{
  "highlights": ["...", "...", "..."],
  "coverLetter": "...",
  "reachOut": "..."
}

- highlights: 3–5 kurze Stichpunkte (je max. 12 Wörter), was der Kandidat in seinem CV/Profil für diese Stelle besonders hervorheben sollte. Falls das Profil leer ist, gib allgemeine Sport-Branche Tipps.
- coverLetter: Ein kurzes Anschreiben auf Deutsch, 200–400 Zeichen, persönlich und direkt. Beginnt mit "Sehr geehrte Damen und Herren," oder dem Unternehmensnamen falls bekannt.
- reachOut: Eine LinkedIn/E-Mail Kurznachricht auf Deutsch, 150–300 Zeichen, locker und professionell. Ideal für Cold Outreach.

Nur das JSON, kein Markdown, keine Erklärungen.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const data: AIApplyResult = JSON.parse(text.trim());

    return { success: true, data };
  } catch (err) {
    console.error("AI apply error:", err);
    return { success: false, error: "KI-Generierung fehlgeschlagen. Bitte erneut versuchen." };
  }
}
