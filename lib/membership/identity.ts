// =============================================================================
// Identity matching — is this membership card the same person as this account?
//
// A membership card can be applied for by someone who is signed out; all they
// get back is an access code. If that person later signs up, the card and the
// account are two records for one rider with nothing joining them. This module
// decides, from the details both records carry, whether they are the same
// person — and how sure it is.
//
// Deliberately pure and free of any database import, because the interesting
// part is the judgement, not the plumbing, and judgement is worth being able
// to reason about (and test) on its own.
//
// The rules, in short:
//   · only fields present on BOTH sides count, so a sparse profile is not
//     punished for what it does not have
//   · at least MIN_COMPARABLE of them must be present, or there is not enough
//     evidence to be talking about a match at all
//   · the weighted score must reach MIN_SCORE
//   · and at least one STRONG field must match, because name and blood group
//     agreeing means very little in a club where names repeat and there are
//     eight blood groups
// =============================================================================

export type IdentityField =
  | "fullName"
  | "dateOfBirth"
  | "licenseNumber"
  | "emergencyPhone"
  | "bloodGroup";

/** The identity-bearing details, as held by either a card or a profile. */
export interface IdentityFacts {
  fullName?:       string | null;
  dateOfBirth?:    string | null;   // ISO yyyy-mm-dd
  licenseNumber?:  string | null;
  emergencyPhone?: string | null;
  bloodGroup?:     string | null;
}

export interface MatchResult {
  /** 0-1. Share of the available evidence that agrees. */
  score:      number;
  /** Fields present on both sides — the evidence that was actually weighed. */
  compared:   IdentityField[];
  /** Of those, the ones that agree (similarity >= FIELD_MATCH). */
  matched:    IdentityField[];
  /** Passes every rule, so it is safe to link without a human looking. */
  confident:  boolean;
  /** Why it failed, when it did. Shown to admins in the merge tool. */
  reason:     string | null;
}

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

/**
 * A licence number identifies one human being. A date of birth nearly does.
 * An emergency contact is weaker than it looks — two brothers in the same club
 * will both put their father down — so it supports a match without ever making
 * one. Blood group is barely evidence: one value in eight.
 */
const WEIGHTS: Record<IdentityField, number> = {
  licenseNumber:  40,
  dateOfBirth:    25,
  fullName:       25,
  emergencyPhone: 20,
  bloodGroup:      5,
};

/** One of these must agree. Nothing else is specific enough to a person. */
const STRONG_FIELDS: IdentityField[] = ["licenseNumber", "dateOfBirth"];

/** Per-field similarity at or above which the field counts as agreeing. */
const FIELD_MATCH = 0.8;

/** Below three shared fields there is not enough to be confident about. */
export const MIN_COMPARABLE = 3;

/** The 70% the whole feature is specified around. */
export const MIN_SCORE = 0.7;

const FIELDS: IdentityField[] = [
  "fullName", "dateOfBirth", "licenseNumber", "emergencyPhone", "bloodGroup",
];

export const FIELD_LABELS: Record<IdentityField, string> = {
  fullName:       "Name",
  dateOfBirth:    "Date of birth",
  licenseNumber:  "Licence",
  emergencyPhone: "Emergency contact",
  bloodGroup:     "Blood group",
};

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/** Combining marks, left behind by NFD. Written as a property escape so this
 *  file stays plain ASCII — the alternative is a literal range of invisible
 *  characters that no editor or diff renders honestly. */
const RE_DIACRITIC = /\p{M}/gu;

function present(v: string | null | undefined): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Lowercase, drop accents and punctuation, collapse whitespace. */
function normName(v: string): string {
  return v
    .normalize("NFD").replace(RE_DIACRITIC, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Digits only, then the last 9 — enough to see past +977 / 0 prefixes. */
function normPhone(v: string): string | null {
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7) return null;   // too short to identify anyone
  return digits.slice(-9);
}

function normLicense(v: string): string | null {
  const s = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length < 4) return null;
  return s;
}

function normBlood(v: string): string {
  return v.toUpperCase().replace(/\s+/g, "")
    .replace(/POSITIVE$/, "+").replace(/NEGATIVE$/, "-");
}

function normDate(v: string): string | null {
  // Accept a full ISO timestamp as well as a bare date.
  const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Name similarity
// ---------------------------------------------------------------------------

/** Dice coefficient over character bigrams — forgiving of spelling drift. */
function diceBigrams(a: string, b: string): number {
  const bigrams = (s: string) => {
    const out: string[] = [];
    const flat = s.replace(/\s/g, "");
    for (let i = 0; i < flat.length - 1; i++) out.push(flat.slice(i, i + 2));
    return out;
  };
  const A = bigrams(a), B = bigrams(b);
  if (!A.length || !B.length) return a === b ? 1 : 0;

  const pool = new Map<string, number>();
  for (const g of A) pool.set(g, (pool.get(g) ?? 0) + 1);

  let hits = 0;
  for (const g of B) {
    const n = pool.get(g) ?? 0;
    if (n > 0) { pool.set(g, n - 1); hits++; }
  }
  return (2 * hits) / (A.length + B.length);
}

/**
 * "Gaurav Subedi" and "Gaurav Raj Subedi" are one rider who filled two forms
 * on different days. "Gaurab" and "Gaurav" are one rider and one keyboard.
 * A lone first name matching, though, is capped — half this club answers to
 * the same handful of given names.
 */
export function nameSimilarity(a: string, b: string): number {
  const x = normName(a), y = normName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;

  const tx = new Set(x.split(" ").filter(Boolean));
  const ty = new Set(y.split(" ").filter(Boolean));
  let shared = 0;
  for (const t of tx) if (ty.has(t)) shared++;

  const smaller = Math.min(tx.size, ty.size);
  // Containment, not Jaccard: an extra middle name is not disagreement.
  let tokenScore = smaller ? shared / smaller : 0;
  if (smaller < 2) tokenScore = Math.min(tokenScore, 0.5);

  return Math.max(tokenScore, diceBigrams(x, y));
}

// ---------------------------------------------------------------------------
// Per-field comparison
// ---------------------------------------------------------------------------

/**
 * Returns null when the field cannot be compared — absent on one side, or
 * present but too degenerate to mean anything (a two-character licence, a
 * four-digit phone number). Incomparable is not the same as disagreeing, and
 * conflating the two is how a rider with a half-filled profile gets scored as
 * a stranger.
 */
function compareField(f: IdentityField, a: IdentityFacts, b: IdentityFacts): number | null {
  const av = a[f], bv = b[f];
  if (!present(av) || !present(bv)) return null;

  switch (f) {
    case "fullName":
      return nameSimilarity(av, bv);

    case "dateOfBirth": {
      const x = normDate(av), y = normDate(bv);
      return x && y ? (x === y ? 1 : 0) : null;
    }

    case "licenseNumber": {
      const x = normLicense(av), y = normLicense(bv);
      return x && y ? (x === y ? 1 : 0) : null;
    }

    case "emergencyPhone": {
      const x = normPhone(av), y = normPhone(bv);
      return x && y ? (x === y ? 1 : 0) : null;
    }

    case "bloodGroup":
      return normBlood(av) === normBlood(bv) ? 1 : 0;
  }
}

// ---------------------------------------------------------------------------
// The judgement
// ---------------------------------------------------------------------------

export function matchIdentity(card: IdentityFacts, profile: IdentityFacts): MatchResult {
  const compared: IdentityField[] = [];
  const matched:  IdentityField[] = [];

  let earned    = 0;
  let available = 0;

  for (const f of FIELDS) {
    const sim = compareField(f, card, profile);
    if (sim === null) continue;

    compared.push(f);
    available += WEIGHTS[f];
    earned    += WEIGHTS[f] * sim;
    if (sim >= FIELD_MATCH) matched.push(f);
  }

  const score = available > 0 ? earned / available : 0;

  let reason: string | null = null;
  if (compared.length < MIN_COMPARABLE) {
    reason = `Only ${compared.length} field${compared.length === 1 ? "" : "s"} in common — needs ${MIN_COMPARABLE}.`;
  } else if (score < MIN_SCORE) {
    reason = `Match is ${Math.round(score * 100)}% — needs ${Math.round(MIN_SCORE * 100)}%.`;
  } else if (!STRONG_FIELDS.some((f) => matched.includes(f))) {
    reason = "No licence or date-of-birth match — too weak to link on its own.";
  }

  return { score, compared, matched, confident: reason === null, reason };
}

/**
 * Pick the one card that is clearly this account, or none.
 *
 * Two candidates clearing the bar is not a close call to be broken by a
 * hundredth of a point — it means two people in the club look alike on paper,
 * and guessing between them hands one rider's card to another. Both are left
 * for the merge tool, where a human can look at the photos.
 */
export function pickSingleMatch<T>(
  candidates: { item: T; match: MatchResult }[],
): { item: T; match: MatchResult } | null {
  const confident = candidates.filter((c) => c.match.confident);
  return confident.length === 1 ? confident[0] : null;
}

/**
 * One account, scored against one application — the row the merge tool draws.
 * Lives here rather than beside the database code so a client component can
 * import the type without dragging a service-role client into its graph.
 */
export interface AccountCandidate {
  userId:    string;
  fullName:  string;
  email:     string | null;
  avatarUrl: string | null;
  score:     number;
  matched:   IdentityField[];
  compared:  IdentityField[];
  confident: boolean;
  reason:    string | null;
  /** Already holds a live card, so linking this one would be a second. */
  hasCard:   boolean;
}

/** Ranked best-first, for the admin merge tool. Includes the failures. */
export function rankCandidates<T>(
  candidates: { item: T; match: MatchResult }[],
): { item: T; match: MatchResult }[] {
  return [...candidates].sort((a, b) => b.match.score - a.match.score);
}
