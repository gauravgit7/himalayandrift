// =============================================================================
// Membership programme — server-side resolution and awarding
//
// One place that knows how to answer "what tier is this rider on" and "pay them
// for this", because three callers need both: ride registration approval, shop
// order approval, and the registration form's own pricing.
//
// Everything here uses the service-role client. The ledger has no insert policy
// at all — a table anyone can write to is a table anyone can pay themselves
// from — so awarding necessarily runs above RLS.
// =============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { pointsEarned }      from "@/lib/rides/pricing";
import type { MembershipTier, MembershipSettings, LoyaltySource } from "@/types";

interface TierRow {
  id: string; name: string; slug: string; description: string | null;
  discount_percent: number; reward_factor: number | string;
  colour: string | null; is_default: boolean; is_active: boolean;
  sort_order: number;
}

function toTier(row: TierRow): MembershipTier {
  return {
    id:              row.id,
    name:            row.name,
    slug:            row.slug,
    description:     row.description ?? null,
    discountPercent: row.discount_percent ?? 0,
    rewardFactor:    Number(row.reward_factor) || 1,
    colour:          row.colour ?? null,
    isDefault:       !!row.is_default,
    isActive:        row.is_active ?? true,
    sortOrder:       row.sort_order ?? 0,
  };
}

export async function loadMembershipSettings(): Promise<MembershipSettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("membership_settings")
    .select("tiers_enabled, loyalty_enabled, points_label")
    .eq("id", 1).maybeSingle();

  const row = (data ?? {}) as {
    tiers_enabled?: boolean; loyalty_enabled?: boolean; points_label?: string;
  };
  return {
    tiersEnabled:   !!row.tiers_enabled,
    loyaltyEnabled: !!row.loyalty_enabled,
    pointsLabel:    row.points_label || "points",
  };
}

/**
 * The tier one account is on, falling back to the club's default.
 *
 * Null for a signed-out registrant, or when tiers are switched off — both of
 * which mean "pays the standard price and earns at 1x", which is what the
 * pricing helpers already do with a null tier.
 */
export async function loadTierForUser(
  userId: string | null | undefined,
  tiersEnabled: boolean,
): Promise<MembershipTier | null> {
  if (!tiersEnabled || !userId) return null;
  const admin = createAdminClient();

  const { data: prof } = await admin
    .from("profiles").select("tier_id").eq("id", userId).maybeSingle();
  const tierId = (prof as { tier_id?: string | null } | null)?.tier_id ?? null;

  const { data: rows } = await admin
    .from("membership_tiers").select("*").eq("is_active", true);
  const tiers = (rows ?? []) as unknown as TierRow[];

  // An explicitly assigned tier wins; otherwise the default catches everybody,
  // including riders whose tier was deleted out from under them.
  const chosen = (tierId && tiers.find((t) => t.id === tierId))
    ?? tiers.find((t) => t.is_default);

  return chosen ? toTier(chosen) : null;
}

/**
 * Pay a rider for something they did.
 *
 * Idempotent by construction: a partial unique index on
 * (source_type, source_id, user_id) for positive rows means approving,
 * un-approving and approving again cannot pay three times. The duplicate is
 * swallowed rather than surfaced, because from the caller's point of view
 * "already paid" and "just paid" are the same outcome.
 *
 * Never throws into its caller. An approval that succeeded must not appear to
 * fail because the points did — the registration is the important half.
 */
export async function awardPoints(opts: {
  userId:     string;
  basePoints: number;
  tier:       MembershipTier | null;
  tiersEnabled:   boolean;
  loyaltyEnabled: boolean;
  reason:     string;
  sourceType: LoyaltySource;
  sourceId:   string;
}): Promise<{ points: number } | null> {
  if (!opts.loyaltyEnabled) return null;
  if (!opts.basePoints || opts.basePoints <= 0) return null;

  const { points, factor } = pointsEarned(
    opts.basePoints, opts.tier, opts.tiersEnabled,
  );
  if (points <= 0) return null;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("loyalty_ledger").insert({
      user_id:     opts.userId,
      points,
      // Stored beside the total so a later promotion never rewrites history,
      // and so a rider can see how the number was reached.
      base_points: Math.max(0, Math.round(opts.basePoints)),
      factor,
      reason:      opts.reason,
      source_type: opts.sourceType,
      source_id:   opts.sourceId,
    });

    if (error) {
      // 23505 is the once-per-source index doing its job.
      if ((error as { code?: string }).code !== "23505") {
        console.error("[awardPoints]", error.message);
      }
      return null;
    }
    return { points };
  } catch (e) {
    console.error("[awardPoints] threw:", e);
    return null;
  }
}

/**
 * Take points back when an approval is undone.
 *
 * A negative row rather than a delete: the ledger is the rider's history, and
 * a history that quietly loses entries cannot be reconciled against anything.
 */
export async function reversePoints(opts: {
  userId:     string;
  sourceType: LoyaltySource;
  sourceId:   string;
  reason:     string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("loyalty_ledger")
      .select("points")
      .eq("user_id", opts.userId)
      .eq("source_type", opts.sourceType)
      .eq("source_id", opts.sourceId)
      .gt("points", 0)
      .maybeSingle();

    const awarded = (data as { points?: number } | null)?.points;
    if (!awarded) return;   // nothing was ever paid for this

    await admin.from("loyalty_ledger").insert({
      user_id:     opts.userId,
      points:      -awarded,
      base_points: 0,
      factor:      1,
      reason:      opts.reason,
      source_type: opts.sourceType,
      source_id:   opts.sourceId,
    });
  } catch (e) {
    console.error("[reversePoints] threw:", e);
  }
}
