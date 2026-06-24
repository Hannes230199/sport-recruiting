/**
 * Parses a raw (scraped) job description string into structured sections.
 *
 * Handles formats found in German sport-job postings:
 *  1. ALL-CAPS inline section markers: "AUFGABEN ... QUALIFIKATIONEN ..."
 *  2. Line-break-separated headers:    "Deine Aufgaben\n- ...\n..."
 *  3. Emoji bullet separators:         "✅ ... ✓ ..."
 *  4. Inline "Keyword: content" pairs: "Hauptaufgaben: ... Anforderungen: ..."
 */

export interface ParsedJobDescription {
  companyInfo: string[];   // prose paragraphs
  tasks: string[];         // bullet strings
  requirements: string[];  // bullet strings
  moreInfo: string[];      // bullet strings / paragraphs
}

// ── Bullet cleanup ────────────────────────────────────────────────────────────

/** Strip artefacts from the front of a scraped bullet and capitalise. */
function cleanBullet(raw: string): string {
  return raw
    // Remove leading whitespace, dashes, colons, bullets, emoji artefacts
    .replace(/^[\s\-–—:•·✅✓✔☑🔸🔹▶►\*]+/, "")
    .trim()
    // Capitalise first character
    .replace(/^([a-zäöüß])/, (c) => c.toUpperCase());
}

/** True if the string is worth keeping as a bullet (not a fragment). */
function isUsefulBullet(s: string): boolean {
  const cleaned = cleanBullet(s);
  // Must be at least 15 chars, start with an uppercase letter or digit,
  // and not be pure noise like "pdf: Germany"
  if (cleaned.length < 15) return false;
  if (!/^[A-ZÄÖÜ0-9„"(]/.test(cleaned)) return false;
  return true;
}

/** Split a long bullet (>220 chars) into sentence-level sub-items. */
function splitLongBullet(text: string): string[] {
  if (text.length <= 220) return [text];
  // Split at sentence-ending punctuation followed by a space + uppercase
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9„])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  return sentences.length > 1 ? sentences : [text];
}

// ── Text splitting helpers ────────────────────────────────────────────────────

const BULLET_EMOJI_RE = /(?:(?<=\s)|^)[✅✓✔☑🔸🔹▶►•·]\s*/gu;

function extractBullets(raw: string): string[] {
  const text = raw.replace(/–|—/g, "-").replace(/[ \t]{2,}/g, " ").trim();

  let candidates: string[] = [];

  // Strategy 1: emoji bullets
  const emojiParts = text.split(BULLET_EMOJI_RE).map((s) => s.trim()).filter(Boolean);
  if (emojiParts.length > 2) candidates = emojiParts;

  // Strategy 2: explicit line-based bullets
  if (!candidates.length) {
    const lineParts = text
      .split(/\n/)
      .map((l) => l.replace(/^[\s\-\•\·\*\d\.]+/, "").trim())
      .filter(Boolean);
    if (lineParts.length > 1) candidates = lineParts;
  }

  // Strategy 3: inline "- " separated items
  if (!candidates.length) {
    const dashParts = text.split(/(?<=[a-zäöüßA-ZÄÖÜ])\s+-\s+(?=[A-ZÄÖÜ])/).map((s) => s.trim()).filter(Boolean);
    if (dashParts.length > 1) candidates = dashParts;
  }

  // Strategy 4: sentence-level
  if (!candidates.length) {
    candidates = text.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9])/).map((s) => s.trim()).filter(Boolean);
  }

  // Clean, filter, then split any remaining long entries
  return candidates
    .map(cleanBullet)
    .filter(isUsefulBullet)
    .flatMap(splitLongBullet);
}

function extractParagraphs(text: string): string[] {
  // First try real paragraph breaks
  let paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 20);

  // If text is a single huge blob, split at sentence boundaries every ~300 chars
  if (paragraphs.length === 1 && paragraphs[0].length > 400) {
    const blob = paragraphs[0];
    const sentences = blob.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„])/).map((s) => s.trim());
    const chunks: string[] = [];
    let current = "";
    for (const s of sentences) {
      if (current.length + s.length > 280 && current.length > 0) {
        chunks.push(current.trim());
        current = s;
      } else {
        current += (current ? " " : "") + s;
      }
    }
    if (current) chunks.push(current.trim());
    paragraphs = chunks.filter((c) => c.length > 20);
  }

  return paragraphs;
}

// ── Section header patterns ───────────────────────────────────────────────────

const SECTION_HEADERS: { key: keyof ParsedJobDescription; re: RegExp }[] = [
  {
    key: "tasks",
    re: /\b(deine?\s+)?aufgaben(\s*[&+]\s*\w+)?|tätigkeiten|stellenbeschreibung|was\s+du\s+(tust|machst)|deine\s+rolle|was\s+dich\s+erwartet|das\s+erwartet\s+dich|hauptaufgaben/i,
  },
  {
    key: "requirements",
    re: /\b(dein\s+)?profil\b|qualifikationen?|anforderungen?|was\s+du\s+mitbringst|das\s+bringst\s+du\s+mit|wen\s+wir\s+suchen|voraussetzungen|was\s+wir\s+suchen/i,
  },
  {
    key: "moreInfo",
    re: /\bbenefits?\b|wir\s+bieten|das\s+bieten\s+wir|unser\s+angebot|deine\s+benefits|was\s+wir\s+(dir\s+)?bieten|vorteile|vergütung|warum\s+(wir|bei\s+uns)|auswahlverfahren/i,
  },
];

// ALL-CAPS inline markers
const CAPS_SECTION_RE =
  /\b(AUFGABEN|HAUPTAUFGABEN|QUALIFIKATIONEN?|ANFORDERUNGEN?|PROFIL|BENEFITS?|WIR BIETEN|UNSER ANGEBOT|VERGÜTUNG|DAS ERWARTET DICH|DAS BRINGST DU MIT|WAS WIR SUCHEN|WARUM [A-Z ]{3,30}ARBEITEN|AUSWAHLVERFAHREN|CAMP DETAILS)\b/g;

function capsSectionKey(header: string): keyof ParsedJobDescription {
  if (/AUFGABEN|HAUPTAUFGABEN|ERWARTET/.test(header)) return "tasks";
  if (/QUALIFI|ANFORDER|PROFIL|BRINGST|WAS WIR SUCHEN/.test(header)) return "requirements";
  return "moreInfo";
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseJobDescription(raw: string): ParsedJobDescription {
  const result: ParsedJobDescription = {
    companyInfo: [],
    tasks: [],
    requirements: [],
    moreInfo: [],
  };

  if (!raw || raw.trim().length === 0) return result;

  // ── A: soft line-break headers ────────────────────────────────────────────
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
      const matched = SECTION_HEADERS.find((h) => h.re.test(part));
      if (matched) { currentKey = matched.key; continue; }
      if (currentKey) result[currentKey].push(...extractBullets(part));
    }
  }

  // ── B: ALL-CAPS inline markers ────────────────────────────────────────────
  if (result.tasks.length === 0 && result.requirements.length === 0) {
    const capsMatches = [...raw.matchAll(CAPS_SECTION_RE)];
    if (capsMatches.length >= 2) {
      const firstIdx = capsMatches[0].index ?? 0;
      if (firstIdx > 30) result.companyInfo = extractParagraphs(raw.slice(0, firstIdx));

      for (let i = 0; i < capsMatches.length; i++) {
        const start = (capsMatches[i].index ?? 0) + capsMatches[i][0].length;
        const end = i + 1 < capsMatches.length
          ? (capsMatches[i + 1].index ?? raw.length)
          : raw.length;
        const text = raw.slice(start, end).trim();
        const key = capsSectionKey(capsMatches[i][0]);
        result[key].push(...extractBullets(text));
      }
    }
  }

  // ── Fallback: no structure ────────────────────────────────────────────────
  if (
    result.companyInfo.length === 0 &&
    result.tasks.length === 0 &&
    result.requirements.length === 0 &&
    result.moreInfo.length === 0
  ) {
    result.companyInfo = extractParagraphs(raw);
  }

  // Deduplicate across sections (keep first occurrence)
  const seen = new Set<string>();
  for (const key of Object.keys(result) as (keyof ParsedJobDescription)[]) {
    result[key] = result[key].filter((s) => {
      const k = s.slice(0, 80);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  return result;
}
