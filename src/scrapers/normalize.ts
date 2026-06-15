import { EmploymentType } from "@/lib/types";

/**
 * Gemeinsame Hilfsfunktionen, die von allen Source-Scrapern genutzt werden,
 * damit die Daten in einem einheitlichen Format in die DB wandern.
 */

/** Entfernt überflüssige Whitespaces/Zeilenumbrüche aus gescraptem Text. */
export function cleanText(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/\s+/g, " ").trim();
}

/**
 * Versucht aus einem Freitext (Jobtitel, Stellenart-Feld, etc.) die
 * Anstellungsart zu erkennen. Reihenfolge ist relevant - "Werkstudent"
 * wird z.B. vor "Vollzeit" geprüft, falls beides im Text vorkommt.
 */
export function guessEmploymentType(text: string): EmploymentType {
  const t = text.toLowerCase();

  if (t.includes("werkstudent")) return "werkstudent";
  if (t.includes("praktik") || t.includes("praktikant")) return "praktikum";
  if (t.includes("ausbildung") || t.includes("azubi") || t.includes("auszubildende"))
    return "ausbildung";
  if (t.includes("freelance") || t.includes("freie mitarbeit") || t.includes("selbstständig"))
    return "freelance";
  if (t.includes("teilzeit") || t.includes("minijob") || t.includes("part-time"))
    return "teilzeit";
  if (t.includes("vollzeit") || t.includes("full-time") || t.includes("festanstellung"))
    return "vollzeit";

  return "unbekannt";
}

/**
 * Sehr einfache Kategorie-Erkennung anhand von Keywords im Titel.
 * Kann iterativ erweitert werden, sobald klar ist, welche Kategorien in
 * der Praxis am häufigsten vorkommen.
 */
const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  { category: "Marketing & Sponsoring", keywords: ["marketing", "sponsoring", "social media", "content", "brand"] },
  { category: "Eventmanagement", keywords: ["event", "veranstaltung"] },
  { category: "Sales & Vertrieb", keywords: ["sales", "vertrieb", "account manager", "key account"] },
  { category: "Trainer & Coaching", keywords: ["trainer", "coach", "athletiktrainer", "co-trainer"] },
  { category: "Physiotherapie & Reha", keywords: ["physiotherap", "reha", "masseur", "medizin"] },
  { category: "Wissenschaft & Forschung", keywords: ["wissenschaft", "forschung", "promotion", "lehre"] },
  { category: "Fahrrad & Bike", keywords: ["fahrrad", "bike", "zweirad", "e-bike"] },
  { category: "Praktikum & Studium", keywords: ["praktik", "duales studium", "werkstudent", "ausbildung"] },
];

export function guessCategory(title: string, fallback?: string | null): string | null {
  const t = title.toLowerCase();
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => t.includes(kw))) return category;
  }
  return fallback ?? null;
}

/**
 * Extrahiert einfache Tags aus Titel + Beschreibung (Schlagwörter, die
 * später für das Matching genutzt werden). Bewusst simpel - Duplikate
 * werden entfernt, max. `max` Tags zurückgegeben.
 */
const TAG_KEYWORDS = [
  "fußball",
  "handball",
  "basketball",
  "hockey",
  "leichtathletik",
  "tennis",
  "golf",
  "e-bike",
  "social media",
  "content",
  "sponsoring",
  "athletiktraining",
  "reha",
  "physiotherapie",
  "remote",
  "marketing",
  "vertrieb",
  "event",
  "trainer",
  "lizenz",
];

export function extractTags(text: string, max = 8): string[] {
  const t = text.toLowerCase();
  const found = TAG_KEYWORDS.filter((kw) => t.includes(kw));
  return Array.from(new Set(found)).slice(0, max);
}

/**
 * Parst deutsche Datumsformate wie "10.06.2026" oder "Juni 12, 2026" zu
 * ISO (YYYY-MM-DD). Gibt null zurück, wenn das Format nicht erkannt wird.
 */
const GERMAN_MONTHS: Record<string, string> = {
  januar: "01",
  februar: "02",
  märz: "03",
  april: "04",
  mai: "05",
  juni: "06",
  juli: "07",
  august: "08",
  september: "09",
  oktober: "10",
  november: "11",
  dezember: "12",
};

export function parseGermanDate(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = cleanText(text);

  // Format: DD.MM.YYYY
  const dotMatch = t.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotMatch) {
    const [, day, month, year] = dotMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Format: "Monatname DD, YYYY" (z.B. "Juni 12, 2026")
  const longMatch = t.match(/([a-zäöüß]+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (longMatch) {
    const [, monthName, day, year] = longMatch;
    const month = GERMAN_MONTHS[monthName.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, "0")}`;
    }
  }

  return null;
}
