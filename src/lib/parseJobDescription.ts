/**
 * Parses a raw (scraped) job description string into structured sections.
 *
 * Handles formats found in German sport-job postings:
 *  1. ALL-CAPS inline markers: "...AUFGABEN Du führst...QUALIFIKATIONEN Ausbildung..."
 *  2. Line-break-separated headers: "Deine Aufgaben\n- Führe das Team\n..."
 *  3. Emoji bullet separators: "✅ Strategie ... ✓ Führung ..."
 */

export interface ParsedJobDescription {
  companyInfo: string[];   // prose paragraphs
  tasks: string[];         // bullet strings
  requirements: string[];  // bullet strings
  moreInfo: string[];      // bullet strings / paragraphs
}

// Recognise emoji/symbol bullets so we can split on them
const BULLET_EMOJI_RE = /(?:^|(?<=\s))[✅✓✔☑🔸🔹▶►•·–—]\s*/gu;

/** Normalise a raw text block: unify dash types, collapse whitespace. */
function normalise(text: string): string {
  return text
    .replace(/–|—/g, "-")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Split a blob into clean bullet strings. */
function extractBullets(raw: string): string[] {
  const text = normalise(raw);

  // Strategy 1: emoji bullets (✅, ✓, etc.) — split on them
  const emojiParts = text.split(BULLET_EMOJI_RE).map((s) => s.trim()).filter((s) => s.length > 8);
  if (emojiParts.length > 1) return emojiParts;

  // Strategy 2: explicit line-based bullets (-, •, *, numbered)
  const lineParts = text
    .split(/\n/)
    .map((l) => l.replace(/^[\s\-\•\·\*\d\.]+/, "").trim())
    .filter((l) => l.length > 8);
  if (lineParts.length > 1) return lineParts;

  // Strategy 3: inline bullets separated by " - "
  const dashParts = text.split(/\s+-\s+/).map((s) => s.trim()).filter((s) => s.length > 8);
  if (dashParts.length > 1) return dashParts;

  // Strategy 4: sentence-level fallback
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 8);
}

/** Split text into clean prose paragraphs. */
function extractParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n(?=\s*\n)/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 10);
}

// ─── Section header patterns ────────────────────────────────────────────────

const SECTION_HEADERS: { key: keyof ParsedJobDescription; re: RegExp }[] = [
  {
    key: "tasks",
    re: /\b(deine?\s+)?aufgaben(\s*[&+]\s*\w+)?|tätigkeiten|stellenbeschreibung|was\s+du\s+(tust|machst)|deine\s+rolle|was\s+dich\s+erwartet|das\s+erwartet\s+dich|job\s*description/i,
  },
  {
    key: "requirements",
    re: /\b(dein\s+)?profil\b|qualifikationen?|anforderungen?|was\s+du\s+mitbringst|das\s+bringst\s+du\s+mit|wen\s+wir\s+suchen|voraussetzungen/i,
  },
  {
    key: "moreInfo",
    re: /\bbenefits?\b|wir\s+bieten|das\s+bieten\s+wir|unser\s+angebot|deine\s+benefits|was\s+wir\s+(dir\s+)?bieten|vorteile|vergütung/i,
  },
];

// ALL-CAPS inline markers
const CAPS_SECTION_RE =
  /\b(AUFGABEN|QUALIFIKATIONEN?|ANFORDERUNGEN?|PROFIL|BENEFITS?|WIR BIETEN|UNSER ANGEBOT|VERGÜTUNG|DAS ERWARTET DICH|DAS BRINGST DU MIT)\b/g;

function capsSectionKey(header: string): keyof ParsedJobDescription {
  if (/AUFGABEN|ERWARTET/.test(header)) return "tasks";
  if (/QUALIFI|ANFORDER|PROFIL|BRINGST/.test(header)) return "requirements";
  return "moreInfo";
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseJobDescription(raw: string): ParsedJobDescription {
  const result: ParsedJobDescription = {
    companyInfo: [],
    tasks: [],
    requirements: [],
    moreInfo: [],
  };

  if (!raw || raw.trim().length === 0) return result;

  // ── A: detect soft line-break headers ────────────────────────────────────
  const splitRe = new RegExp(
    SECTION_HEADERS.map((h) => `(${h.re.source})`).join("|"),
    "gi"
  );
  const parts = raw.split(splitRe).filter((p) => p !== undefined);

  if (parts.length > 1) {
    result.companyInfo = extractParagraphs(parts[0]);

    let currentKey: keyof ParsedJobDescription | null = null;
    for (let i = 1; i < parts.length; i++) {
      const part = (parts[i] ?? "").trim();
      if (!part) continue;
      const matchedSection = SECTION_HEADERS.find((h) => h.re.test(part));
      if (matchedSection) { currentKey = matchedSection.key; continue; }
      if (currentKey) result[currentKey].push(...extractBullets(part));
    }
  }

  // ── B: ALL-CAPS inline markers (fallback / supplement) ───────────────────
  if (result.tasks.length === 0 && result.requirements.length === 0) {
    const capsMatches = [...raw.matchAll(CAPS_SECTION_RE)];

    if (capsMatches.length >= 2) {
      const firstIdx = capsMatches[0].index ?? 0;
      if (firstIdx > 30) result.companyInfo = extractParagraphs(raw.slice(0, firstIdx));

      for (let i = 0; i < capsMatches.length; i++) {
        const start = (capsMatches[i].index ?? 0) + capsMatches[i][0].length;
        const end = i + 1 < capsMatches.length ? (capsMatches[i + 1].index ?? raw.length) : raw.length;
        const text = raw.slice(start, end).trim();
        const key = capsSectionKey(capsMatches[i][0]);
        result[key].push(...extractBullets(text));
      }
    }
  }

  // ── Fallback: no structure found ─────────────────────────────────────────
  if (
    result.companyInfo.length === 0 &&
    result.tasks.length === 0 &&
    result.requirements.length === 0 &&
    result.moreInfo.length === 0
  ) {
    result.companyInfo = extractParagraphs(raw);
  }

  // Deduplicate items that spilled into multiple sections
  const seen = new Set<string>();
  for (const key of Object.keys(result) as (keyof ParsedJobDescription)[]) {
    result[key] = result[key].filter((s) => {
      const k = s.slice(0, 60);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  return result;
}
