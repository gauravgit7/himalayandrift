// =============================================================================
// Reference codes — one place that knows what a code is
//
// Three things in this site hand out a code and then ask for it back:
//
//   HD-XXXXXX    membership card application
//   HD-R-XXXXXX  ride registration
//   HDS-XXXXXX   shop order
//
// They were built at different times and each grew its own way of being looked
// up — or, in two cases, no way at all beyond the link sent at submission. The
// prefixes are already distinguishable, so one lookup can serve all three, and
// a rider holding a code does not have to know which kind of thing it belongs
// to before they can check it.
//
// Pure. Nothing here touches the database; it only reads the shape.
// =============================================================================

export type CodeKind = "member" | "ride" | "order";

export interface ParsedCode {
  kind: CodeKind;
  /** Canonical form, with the dashes put back. This is what the database has. */
  code: string;
}

export const CODE_KIND_LABEL: Record<CodeKind, string> = {
  member: "Membership card",
  ride:   "Ride registration",
  order:  "Shop order",
};

/** The six random characters every code ends in. */
const BODY = 6;

/** No 0, 1, I or O. These codes get read aloud at a roadside and copied off a
 *  phone screen, where those four are two characters rather than four. L stays
 *  in — it has been in every code the club has issued, and narrowing the
 *  alphabet now would buy nothing that reprinting those codes would not cost. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** The canonical, dashed prefix each kind wears. Generating and parsing both
 *  read this map, so the two cannot drift into disagreeing about a code they
 *  are each certain is a ride registration. */
const PREFIX: Record<CodeKind, string> = {
  member: "HD-",
  ride:   "HD-R-",
  order:  "HDS-",
};

/** Mint a fresh code of the given kind. */
export function generateCode(kind: CodeKind): string {
  let body = "";
  for (let i = 0; i < BODY; i++) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${PREFIX[kind]}${body}`;
}

/**
 * Work out what a code is from its shape.
 *
 * Punctuation is stripped before matching, so a code read aloud, retyped from a
 * screenshot, or pasted with the dashes lost still resolves. Length is what
 * separates the kinds: `HD` + 6 is a card, and since R and S are both in the
 * code alphabet, `HD-RXY123` would otherwise be indistinguishable from a ride
 * code with a dash missing.
 */
export function parseCode(raw: string): ParsedCode | null {
  const flat = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (flat.length === 3 + BODY && flat.startsWith("HDR")) {
    return { kind: "ride", code: `${PREFIX.ride}${flat.slice(3)}` };
  }
  if (flat.length === 3 + BODY && flat.startsWith("HDS")) {
    return { kind: "order", code: `${PREFIX.order}${flat.slice(3)}` };
  }
  if (flat.length === 2 + BODY && flat.startsWith("HD")) {
    return { kind: "member", code: `${PREFIX.member}${flat.slice(2)}` };
  }
  return null;
}

/**
 * Where a code's holder should be sent.
 *
 * Ride registrations and shop orders each have a status page of their own. A
 * membership code goes to /membership instead, because the status view there
 * renders the card itself — which is the thing the holder actually came for.
 */
export function hrefForCode(parsed: ParsedCode): string {
  switch (parsed.kind) {
    case "ride":   return `/rides/registered/${parsed.code}`;
    case "order":  return `/shop/order/${parsed.code}`;
    case "member": return `/membership?code=${encodeURIComponent(parsed.code)}`;
  }
}
