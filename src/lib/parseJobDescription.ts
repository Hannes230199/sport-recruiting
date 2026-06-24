/**
 * Parses a raw (scraped) job description string into structured sections.
 *
 * Handles two common formats found in German sport-job postings:
 *  1. All-caps inline headers: "...AUFGABEN Führe das Team...QUALIFIKATIONEN Ausbildung..."
 *  2. Line-break-separated headers: "Deine Aufgaben\n- Führe das Team\n..."
 */

export interface ParsedJobDescription {
  companyInfo: string[];   // prose paragraphs
  tasks: string[];         // bullet strings
  requirements: string[];  // bullet strings
  moreInfo: string[];      // bullet strings / paragraphs
}

// Regex anchors for each section — ordered by priority (first match wins)
const SECTION_PATTERNS: { key: keyof ParsedJobDescription; pattern: RegExp }[] = [
  {
    key: "tasks",
    pattern:
      /\b(deine\s+)?aufgaben(\s*&?\s*\w+)?|tätigkeiten|stellenbeschreibung|was\s+du\s+(tust|machst)|deine\s+rolle|was\s+dich\s+erwartet|job\s+description/i,
  },
  {
    key: "requirements",
    pattern:
      /\b(dein\s+)?profil|qualifikationen?|anforderungen?|was\s+du\s+mitbringst|das\s+bringst\s+du\s+mit|wen\s+wir\s+suchen|voraussetzungen/i,
  },
  {
    key: "moreInfo",
    pattern:
      /\bbenefits?\b|wir\s+bieten|das\s+bieten\s+wir|unser\s+angebot|deine\s+benefits|was\s+wir\s+(dir\s+)?bieten|vorteile|vergütung|gehalt/i,
  },
];

/** Split a blob of text into bullet-point strings. */
function extractBullets(text: string): string[] {
  // Normalise: collapse multiple spaces, unify various dash types
  let t = text.replace(/–|—/g, "-").replace(/[ \t]+/g, " ").trim();

  // Case A: explicit line-based bullets (-, •, ·, *, or numbered)
  const lineBreakBullets = t
    .split(/\n/)
    .map((l) => l.replace(/^[\s\-\•\·\*\d\.]+/, "").trim())
    .filter((l) => l.length > 5);

  if (lineBreakBullets.length > 1) return lineBreakBullets;

  // Case B: inline bullets separated by " - " or " – "
  const inlineBullets = t
    .split(/\s+-\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (inlineBullets.length > 1) return inlineBullets;

  // Case C: sentences as pseudo-bullets
  return t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

/** Split text into clean prose paragraphs. */
function extractParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n(?=\s*\n)/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 10);
}

/**
 * Splits the raw description into sections by detecting header keywords.
 * Works for both all-caps inline headers and newline-separated headers.
 */
export function parseJobDescription(raw: string): ParsedJobDescription {
  const result: ParsedJobDescription = {
    companyInfo: [],
    tasks: [],
    requirements: [],
    moreInfo: [],
  };

  if (!raw || raw.trim().length === 0) return result;

  // ── Strategy A: look for section-breaking keywords as word boundaries ──────
  // Build a combined split regex from all patterns
  const splitPattern = new RegExp(
    SECTION_PATTERNS.map((sp) => `(${sp.pattern.source})`).join("|"),
    "gi"
  );

  const parts = raw.split(splitPattern).filter((p) => p !== undefined);

  if (parts.length > 1) {
    // parts[0] is text before the first header → company info
    result.companyInfo = extractParagraphs(parts[0]);

    let currentKey: keyof ParsedJobDescription | null = null;
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      // Is this a header token?
      const matchedSection = SECTION_PATTERNS.find((sp) => sp.pattern.test(part));
      if (matchedSection) {
        currentKey = matchedSection.key;
        continue;
      }

      if (currentKey) {
        const bullets = extractBullets(part);
        result[currentKey].push(...bullets);
      }
    }
  }

  // ── Strategy B: look for ALL_CAPS inline section markers ─────────────────
  // e.g. "...AUFGABEN Team & Führung – Du führst...QUALIFIKATIONEN..."
  if (result.tasks.length === 0 && result.requirements.length === 0) {
    const capsPattern =
      /\b(AUFGABEN|QUALIFIKATIONEN?|ANFORDERUNGEN?|PROFIL|BENEFITS?|WIR BIETEN|UNSER ANGEBOT|VERGÜTUNG)\b/g;
    const capsMatches = [...raw.matchAll(capsPattern)];

    if (capsMatches.length >= 2) {
      // Extract slices between caps markers
      const slices: { key: keyof ParsedJobDescription; text: string }[] = [];

      for (let i = 0; i < capsMatches.length; i++) {
        const start = (capsMatches[i].index ?? 0) + capsMatches[i][0].length;
        const end = i + 1 < capsMatches.length ? capsMatches[i + 1].index ?? raw.length : raw.length;
        const text = raw.slice(start, end).trim();
        const header = capsMatches[i][0];

        let key: keyof ParsedJobDescription = "moreInfo";
        if (/AUFGABEN/.test(header)) key = "tasks";
        else if (/QUALIFI|ANFORDER|PROFIL/.test(header)) key = "requirements";
        else if (/BENEFIT|BIETEN|ANGEBOT|VERGÜT/.test(header)) key = "moreInfo";

        slices.push({ key, text });
      }

      // Text before first caps marker → company info
      const firstIdx = capsMatches[0].index ?? 0;
      if (firstIdx > 50) {
        result.companyInfo = extractParagraphs(raw.slice(0, firstIdx));
      }

      for (const slice of slices) {
        const bullets = extractBullets(slice.text);
        result[slice.key].push(...bullets);
      }
    }
  }

  // ── Fallback: no structure detected → everything goes to companyInfo ───────
  if (
    result.companyInfo.length === 0 &&
    result.tasks.length === 0 &&
    result.requirements.length === 0 &&
    result.moreInfo.length === 0
  ) {
    result.companyInfo = extractParagraphs(raw);
  }

  return result;
}
