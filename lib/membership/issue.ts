// =============================================================================
// Issuing membership cards
//
// There is one approval in this club, and it is the approval of a PERSON. The
// card is what follows from it — an issuance, not a second judgement. Before
// this module the two were separate queues, so a rider could be an approved
// member with a card still sitting pending behind it, or hold an approved card
// while their account waited. Neither state means anything to anybody.
//
// So every path that turns a person into a cardholder comes through here:
//
//   · the committee approves a member          → approveRegistration
//   · the committee issues a card by hand       → issueCardForMember
//   · a rider asks for one from their profile   → requestMemberCard
//
// All three need the same three things: the six details a card cannot be
// printed without, a number nobody else has, and an expiry. Having them in one
// file is what stops those three answers from drifting apart.
// =============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { MEMBER_CARD_PREFIX } from "@/lib/constants";
import { generateCode }       from "@/lib/codes";
import type { CardRequirement } from "@/types";

type Admin = ReturnType<typeof createAdminClient>;

/** The columns a card is printed from, as they are named on `profiles`. */
export const CARD_SOURCE_COLUMNS =
  "full_name, avatar_url, date_of_birth, blood_group, emergency_phone, license_number, is_admin";

export interface CardSource {
  full_name:       string | null;
  avatar_url:      string | null;
  date_of_birth:   string | null;
  blood_group:     string | null;
  emergency_phone: string | null;
  license_number:  string | null;
  is_admin?:       boolean | null;
}

/**
 * Which of the six a profile is still short of.
 *
 * Reported rather than merely counted, because "we cannot make your card"
 * is a useless sentence and "we need your photo and licence number" is not.
 */
export function missingCardFields(p: CardSource): CardRequirement[] {
  const missing: CardRequirement[] = [];
  if (!p.avatar_url)              missing.push("photo");
  if (!p.full_name?.trim())       missing.push("fullName");
  if (!p.date_of_birth)           missing.push("dateOfBirth");
  if (!p.blood_group?.trim())     missing.push("bloodGroup");
  if (!p.emergency_phone?.trim()) missing.push("emergencyPhone");
  if (!p.license_number?.trim())  missing.push("licenseNumber");
  return missing;
}

/**
 * The next public card number for this year: HD-26-00001.
 *
 * Derived from the highest number already issued, not from a row count. Counts
 * and reality part company the moment a row is deleted, and reissuing a number
 * that is already printed on somebody's card is not a mistake you can undo.
 * Zero-padding is what lets the database's text ordering answer "highest".
 */
export function cardNumberPrefix(now = new Date()): string {
  return `${MEMBER_CARD_PREFIX}-${String(now.getFullYear()).slice(2)}-`;
}

/** The arithmetic, separated from the query so it can be checked without one. */
export function nextInSequence(prefix: string, last: string | null): string {
  const seq  = last ? Number(last.slice(prefix.length)) : 0;
  const next = Number.isFinite(seq) ? seq + 1 : 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

async function nextCardNumber(admin: Admin): Promise<string> {
  const prefix = cardNumberPrefix();

  const { data } = await admin
    .from("member_cards")
    .select("card_number")
    .like("card_number", `${prefix}%`)
    .order("card_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return nextInSequence(prefix, (data as { card_number: string } | null)?.card_number ?? null);
}

async function validUntil(admin: Admin): Promise<string> {
  const { data } = await admin
    .from("card_settings").select("validity_years").eq("id", 1).maybeSingle();
  const years = (data as { validity_years: number } | null)?.validity_years ?? 2;
  const until = new Date();
  until.setFullYear(until.getFullYear() + years);
  return until.toISOString().slice(0, 10);
}

const isDuplicate = (e: unknown) => (e as { code?: string } | null)?.code === "23505";

/**
 * Run a write that needs a fresh card number, retrying if somebody else took
 * it first. Two admins approving two members in the same second is not rare in
 * a club that does its paperwork in one sitting, and `card_number` is unique,
 * so without this the second approval simply fails with a constraint error the
 * admin cannot act on.
 */
async function withCardNumber(
  admin: Admin,
  // PromiseLike, not Promise: a PostgREST query builder is a thenable that only
  // becomes a Promise once awaited, so callers can hand their builder over
  // directly instead of wrapping every one of them.
  write: (cardNumber: string, until: string) => PromiseLike<{ error: unknown }>,
): Promise<{ cardNumber: string | null; error: string | null }> {
  const until = await validUntil(admin);

  for (let attempt = 0; attempt < 5; attempt++) {
    const cardNumber = await nextCardNumber(admin);
    const { error }  = await write(cardNumber, until);
    if (!error) return { cardNumber, error: null };
    if (!isDuplicate(error)) {
      return { cardNumber: null, error: (error as { message: string }).message };
    }
  }
  return { cardNumber: null, error: "Could not allocate a card number. Please try again." };
}

export interface IssueResult {
  /** Set when a card now exists and is approved — whether this call made it so
   *  or found it already done. */
  cardNumber: string | null;
  /** Non-empty when the profile cannot yet be printed from. The member is
   *  approved regardless; only the card waits. */
  missing:    CardRequirement[];
  /** True when the card already existed and this call changed nothing. */
  existing:   boolean;
  error:      string | null;
}

/**
 * Give this account a live, approved card — creating one from the profile if
 * there is none, or approving the request they already have.
 *
 * Deliberately not a failure when the profile is incomplete. Approving a
 * member is a decision about the person; a missing photograph is an errand,
 * and an errand must not be able to veto a decision.
 */
export async function issueCardForUser(userId: string): Promise<IssueResult> {
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(CARD_SOURCE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { cardNumber: null, missing: [], existing: false, error: profileError.message };
  if (!profile)     return { cardNumber: null, missing: [], existing: false, error: "No profile for that account." };

  const p = profile as unknown as CardSource;

  // A revoked or rejected card is history, not an obstacle: the point of
  // keeping the row is the record, and the point of excluding it here is that
  // the rider can be issued a replacement.
  const { data: live } = await admin
    .from("member_cards")
    .select("id, status, card_number")
    .eq("user_id", userId)
    .not("status", "in", "(rejected,revoked)")
    .maybeSingle();

  const card = live as { id: string; status: string; card_number: string | null } | null;

  if (card?.status === "approved") {
    return { cardNumber: card.card_number, missing: [], existing: true, error: null };
  }

  // Approving a request they already made. Their details came off the form,
  // not the profile, so an incomplete profile is irrelevant here.
  if (card) {
    const res = await withCardNumber(admin, (cardNumber, until) =>
      admin.from("member_cards").update({
        status:      "approved",
        card_number: cardNumber,
        approved_at: new Date().toISOString(),
        valid_until: until,
        updated_at:  new Date().toISOString(),
      }).eq("id", card.id).eq("status", "pending"),
    );
    return { cardNumber: res.cardNumber, missing: [], existing: false, error: res.error };
  }

  // Nothing to approve, so print one from the profile — if it is printable.
  const missing = missingCardFields(p);
  if (missing.length) {
    return { cardNumber: null, missing, existing: false, error: null };
  }

  const res = await withCardNumber(admin, (cardNumber, until) =>
    admin.from("member_cards").insert({
      user_id:          userId,
      access_code:      generateCode("member"),
      full_name:        p.full_name!.trim(),
      photo_url:        p.avatar_url!,
      date_of_birth:    p.date_of_birth!,
      blood_group:      p.blood_group!.trim(),
      emergency_phone:  p.emergency_phone!.trim(),
      license_number:   p.license_number!.trim(),
      // The member was approved by a human looking at these details. That is
      // the consent, and it is a stronger one than a tickbox.
      consent_accepted: true,
      linked_by:        "admin",
      linked_at:        new Date().toISOString(),
      status:           "approved",
      card_number:      cardNumber,
      approved_at:      new Date().toISOString(),
      valid_until:      until,
    }),
  );

  return { cardNumber: res.cardNumber, missing: [], existing: false, error: res.error };
}

/**
 * Approve a card that has no account behind it — a walk-in application whose
 * person the matcher never found. The only path that still issues a card
 * without approving a member, because there is no member to approve.
 */
export async function issueCardById(cardId: string): Promise<IssueResult> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("member_cards")
    .select("id, status, card_number")
    .eq("id", cardId)
    .maybeSingle();

  if (error)  return { cardNumber: null, missing: [], existing: false, error: error.message };
  if (!data)  return { cardNumber: null, missing: [], existing: false, error: "Card not found." };

  const card = data as { id: string; status: string; card_number: string | null };
  if (card.status === "approved") {
    return { cardNumber: card.card_number, missing: [], existing: true, error: null };
  }

  const res = await withCardNumber(admin, (cardNumber, until) =>
    admin.from("member_cards").update({
      status:           "approved",
      card_number:      cardNumber,
      approved_at:      new Date().toISOString(),
      valid_until:      until,
      rejection_reason: null,
      revoked_at:       null,
      revoked_reason:   null,
      updated_at:       new Date().toISOString(),
    }).eq("id", cardId),
  );

  return { cardNumber: res.cardNumber, missing: [], existing: false, error: res.error };
}

/**
 * Withdraw a card that was issued.
 *
 * The row keeps its number and its history — a card that has been printed and
 * handed over is a fact, and the useful question later is not "does this
 * number exist" but "was it withdrawn, and why". The QR validator reads the
 * status, so a revoked card stops verifying the moment this runs.
 */
export async function revokeCardById(
  cardId: string,
  reason: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("member_cards")
    .update({
      status:         "revoked",
      revoked_at:     new Date().toISOString(),
      revoked_reason: reason.trim() || null,
      updated_at:     new Date().toISOString(),
    })
    .eq("id", cardId)
    .eq("status", "approved");

  return { error: error?.message ?? null };
}
