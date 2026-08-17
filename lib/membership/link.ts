// =============================================================================
// Linking membership cards to accounts
//
// Two ways in, and they do not arrive in the same order for everybody:
//
//   · a rider signs up first, then asks for a card from their profile — the
//     card is stamped with their user_id at birth and nothing here is needed
//   · a rider applies for a card while signed out, holding only an access
//     code, and signs up weeks later — that is the case this file exists for
//
// The matching itself lives in ./identity, deliberately free of any database
// import. This module is the plumbing: fetch the candidates, ask for a
// judgement, and write the answer down along with the evidence.
//
// Everything here uses the service-role client. member_cards is publicly
// readable (the QR validator depends on it) but not publicly writable, and
// claiming a card is exactly the kind of write that must not be reachable
// from a browser.
// =============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import {
  matchIdentity, pickSingleMatch, rankCandidates,
  type IdentityFacts, type MatchResult, type AccountCandidate,
} from "./identity";

export type { AccountCandidate };

// How many unclaimed applications to weigh in one pass. A club that has taken
// more than this many walk-in applications without a single one being claimed
// has a different problem, and an unbounded scan on every sign-in is not the
// answer to it.
const SCAN_LIMIT = 500;

interface CardRow {
  id:              string;
  access_code:     string;
  status:          string;
  full_name:       string | null;
  date_of_birth:   string | null;
  license_number:  string | null;
  emergency_phone: string | null;
  blood_group:     string | null;
  photo_url:       string | null;
  created_at:      string;
}

interface ProfileRow {
  id:              string;
  full_name:       string | null;
  date_of_birth:   string | null;
  license_number:  string | null;
  emergency_phone: string | null;
  blood_group:     string | null;
  avatar_url:      string | null;
  email:           string | null;
}

const CARD_COLS =
  "id, access_code, status, full_name, date_of_birth, license_number, " +
  "emergency_phone, blood_group, photo_url, created_at";

const PROFILE_COLS =
  "id, full_name, date_of_birth, license_number, emergency_phone, " +
  "blood_group, avatar_url, email";

function facts(row: CardRow | ProfileRow): IdentityFacts {
  return {
    fullName:       row.full_name,
    dateOfBirth:    row.date_of_birth,
    licenseNumber:  row.license_number,
    emergencyPhone: row.emergency_phone,
    bloodGroup:     row.blood_group,
  };
}

// ---------------------------------------------------------------------------
// Backfill
// ---------------------------------------------------------------------------

/**
 * A claimed card carries details the account may never have been asked for.
 * Copy across only what the profile is missing — an empty field is a gap to
 * fill, a filled one is the rider's own answer and is not ours to overwrite.
 */
async function backfillProfile(
  admin:   ReturnType<typeof createAdminClient>,
  profile: ProfileRow,
  card:    CardRow,
): Promise<void> {
  const patch: Record<string, string> = {};
  const copy = (
    profileKey: keyof ProfileRow, profileVal: string | null,
    cardVal: string | null,
  ) => {
    if (!profileVal?.trim() && cardVal?.trim()) patch[profileKey] = cardVal.trim();
  };

  copy("date_of_birth",   profile.date_of_birth,   card.date_of_birth);
  copy("license_number",  profile.license_number,  card.license_number);
  copy("emergency_phone", profile.emergency_phone, card.emergency_phone);
  copy("blood_group",     profile.blood_group,     card.blood_group);
  copy("avatar_url",      profile.avatar_url,      card.photo_url);
  copy("full_name",       profile.full_name,       card.full_name);

  if (!Object.keys(patch).length) return;

  const { error } = await admin.from("profiles").update(patch).eq("id", profile.id);
  if (error) console.error("[link] profile backfill failed:", error.message);
}

// ---------------------------------------------------------------------------
// Automatic claim
// ---------------------------------------------------------------------------

export interface ClaimResult {
  /** The card that was claimed, if one clearly belonged to this account. */
  linked:    { cardId: string; accessCode: string; status: string; score: number } | null;
  /** More than one application looked like this person — left for an admin. */
  ambiguous: number;
  error:     string | null;
}

/**
 * Called after sign-up, after sign-in, and after a profile save — the three
 * moments at which the account's details can newly become enough to recognise
 * an application by. It is cheap when there is nothing to do (one indexed
 * query returning no rows) and idempotent when there is.
 */
export async function claimOrphanCardsForUser(userId: string): Promise<ClaimResult> {
  const admin = createAdminClient();

  const { data: profileData, error: profileError } = await admin
    .from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle();

  if (profileError) return { linked: null, ambiguous: 0, error: profileError.message };
  if (!profileData) return { linked: null, ambiguous: 0, error: null };
  const profile = profileData as unknown as ProfileRow;

  // One live card per account, enforced by a partial unique index. If the
  // rider already has one, there is nothing to claim and the insert would
  // fail anyway.
  const { data: own } = await admin
    .from("member_cards").select("id")
    .eq("user_id", userId).neq("status", "rejected").maybeSingle();
  if (own) return { linked: null, ambiguous: 0, error: null };

  const { data: orphanData, error: orphanError } = await admin
    .from("member_cards").select(CARD_COLS)
    .is("user_id", null)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(SCAN_LIMIT);

  if (orphanError) return { linked: null, ambiguous: 0, error: orphanError.message };

  const orphans = (orphanData ?? []) as unknown as CardRow[];
  if (!orphans.length) return { linked: null, ambiguous: 0, error: null };

  const scored = orphans.map((item) => ({
    item,
    match: matchIdentity(facts(item), facts(profile)),
  }));

  const winner = pickSingleMatch(scored);

  if (!winner) {
    const ambiguous = scored.filter((c) => c.match.confident).length;
    if (ambiguous > 1) {
      console.warn(
        `[link] ${ambiguous} applications match account ${userId} — left for an admin to resolve.`,
      );
    }
    return { linked: null, ambiguous, error: null };
  }

  const card = winner.item;

  // Guarded on user_id being null so two concurrent sign-ins cannot both
  // claim the same application; the loser updates zero rows.
  const { data: claimed, error: claimError } = await admin
    .from("member_cards")
    .update({
      user_id:    userId,
      linked_by:  "auto",
      linked_at:  new Date().toISOString(),
      link_score: Number(winner.match.score.toFixed(4)),
    })
    .eq("id", card.id)
    .is("user_id", null)
    .select("id")
    .maybeSingle();

  if (claimError) return { linked: null, ambiguous: 0, error: claimError.message };
  if (!claimed)   return { linked: null, ambiguous: 0, error: null };  // lost the race

  await backfillProfile(admin, profile, card);

  return {
    linked: {
      cardId:     card.id,
      accessCode: card.access_code,
      status:     card.status,
      score:      winner.match.score,
    },
    ambiguous: 0,
    error:     null,
  };
}

// ---------------------------------------------------------------------------
// Admin merge — the missed cases
// ---------------------------------------------------------------------------

/**
 * Every account, ranked by how much it looks like this application. Ranked
 * rather than filtered on purpose: the merge tool exists for the cases the
 * automatic pass would not touch, so hiding the near-misses would hide exactly
 * the rows an admin opened it to see.
 */
export async function candidatesForCard(
  cardId: string,
  query?: string,
  limit  = 8,
): Promise<{
  linked:     AccountCandidate | null;
  candidates: AccountCandidate[];
  error:      string | null;
}> {
  const admin = createAdminClient();
  const empty = { linked: null, candidates: [] };

  const { data: cardData, error: cardError } = await admin
    .from("member_cards").select(`${CARD_COLS}, user_id`).eq("id", cardId).maybeSingle();

  if (cardError) return { ...empty, error: cardError.message };
  if (!cardData)  return { ...empty, error: "Card not found." };
  const card = cardData as unknown as CardRow & { user_id: string | null };

  // A name or email typed into the merge tool's search box. Without one, every
  // account is scored — fine for a club, and the ranking is the point.
  let profileQuery = admin.from("profiles").select(PROFILE_COLS).limit(2000);
  const q = query?.trim();
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    profileQuery = profileQuery.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  const { data: profileData, error: profileError } = await profileQuery;

  if (profileError) return { ...empty, error: profileError.message };
  const profiles = (profileData ?? []) as unknown as ProfileRow[];

  // Which of these already hold a live card — shown as a warning rather than
  // used as a filter, because a duplicate application is a thing an admin may
  // well want to see and reject.
  const { data: heldData } = await admin
    .from("member_cards").select("id, user_id")
    .not("user_id", "is", null).neq("status", "rejected");
  const held = new Set(
    ((heldData ?? []) as { id: string; user_id: string }[])
      .filter((r) => r.id !== cardId)
      .map((r) => r.user_id),
  );

  const toCandidate = (item: ProfileRow): AccountCandidate => {
    const match = matchIdentity(facts(card), facts(item));
    return {
      userId:    item.id,
      fullName:  item.full_name ?? "(no name)",
      email:     item.email,
      avatarUrl: item.avatar_url,
      score:     match.score,
      matched:   match.matched,
      compared:  match.compared,
      confident: match.confident,
      reason:    match.reason,
      hasCard:   held.has(item.id),
    };
  };

  // The account it already belongs to, fetched separately: a linked account
  // need not be anywhere near the top of the ranking, and if an admin is here
  // to undo a bad link, it certainly will not be.
  let linked: AccountCandidate | null = null;
  if (card.user_id) {
    const { data: linkedData } = await admin
      .from("profiles").select(PROFILE_COLS).eq("id", card.user_id).maybeSingle();
    linked = linkedData ? toCandidate(linkedData as unknown as ProfileRow) : null;
  }

  const scored = profiles
    .filter((p) => p.id !== card.user_id)
    .map((item) => ({ item, match: matchIdentity(facts(card), facts(item)) }));

  return {
    linked,
    candidates: rankCandidates(scored).slice(0, limit).map(({ item }) => toCandidate(item)),
    error: null,
  };
}

/** Score one specific pairing — used to record why an admin's link was right. */
export async function scorePairing(
  cardId: string, userId: string,
): Promise<MatchResult | null> {
  const admin = createAdminClient();
  const [{ data: c }, { data: p }] = await Promise.all([
    admin.from("member_cards").select(CARD_COLS).eq("id", cardId).maybeSingle(),
    admin.from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle(),
  ]);
  if (!c || !p) return null;
  return matchIdentity(
    facts(c as unknown as CardRow),
    facts(p as unknown as ProfileRow),
  );
}

/** Attach a card to an account by hand, and fill the account's gaps from it. */
export async function linkCardToAccount(
  cardId: string, userId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const { data: cardData, error: cardError } = await admin
    .from("member_cards").select(CARD_COLS).eq("id", cardId).maybeSingle();
  if (cardError) return { error: cardError.message };
  if (!cardData)  return { error: "Card not found." };
  const card = cardData as unknown as CardRow;

  const { data: profileData, error: profileError } = await admin
    .from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle();
  if (profileError) return { error: profileError.message };
  if (!profileData)  return { error: "That account has no profile row." };
  const profile = profileData as unknown as ProfileRow;

  const match = matchIdentity(facts(card), facts(profile));

  const { error } = await admin
    .from("member_cards")
    .update({
      user_id:    userId,
      linked_by:  "admin",
      linked_at:  new Date().toISOString(),
      link_score: Number(match.score.toFixed(4)),
    })
    .eq("id", cardId);

  if (error) {
    // 23505 is the one-live-card-per-account index doing its job.
    if ((error as { code?: string }).code === "23505") {
      return { error: "That account already has a live membership card." };
    }
    return { error: error.message };
  }

  await backfillProfile(admin, profile, card);
  return { error: null };
}

/** Detach a card that was linked to the wrong account. */
export async function unlinkCard(cardId: string): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("member_cards")
    .update({ user_id: null, linked_by: null, linked_at: null, link_score: null })
    .eq("id", cardId);
  return { error: error?.message ?? null };
}
