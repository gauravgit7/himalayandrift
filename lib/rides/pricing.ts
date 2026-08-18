// =============================================================================
// Ride pricing — the fee, the club discount, and the rider's tier
//
// A ride has one list fee and an optional flat discount off it for everybody.
// On top of that, a member's TIER takes a percentage off — so a veteran sees a
// lower number without ever being shown a menu of what everyone else pays.
//
// That last part is the whole point of the redesign. The previous version asked
// the rider to pick their own rate from a list, which meant every rider read
// the full price table and could see exactly what they were not getting. A
// discount that has to be compared to be understood is not a benefit; it is a
// ranking. The tier lives on the account now, the form resolves ONE number, and
// nobody sees anybody else's.
//
// Every figure is resolved here and again on the server at submission. The form
// may display a price; it may never decide one.
//
// Pure, and importing nothing but types.
// =============================================================================

import type { MembershipTier } from "@/types";

/** The shape both the Ride type and a raw DB row can satisfy. */
export interface PricingInput {
  registrationFee:      number | null;
  registrationDiscount: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Clamped the same way the database check constraint clamps it. */
function safePercent(p: number): number {
  return Math.min(Math.max(p, 0), 90);
}

/**
 * What a rider on no tier pays: the list fee less the club-wide discount.
 *
 * Clamped at zero — a discount larger than the fee is a typo, and a negative
 * price would have the club paying people to turn up.
 */
export function standardPrice(ride: PricingInput): number | null {
  const fee = ride.registrationFee;
  if (fee === null) return null;
  if (fee <= 0) return 0;
  return round2(Math.max(0, fee - Math.max(0, ride.registrationDiscount ?? 0)));
}

/** The struck-through "was", or null when there is nothing to strike. */
export function listPrice(ride: PricingInput): number | null {
  const fee = ride.registrationFee;
  if (fee === null || fee <= 0) return null;
  return (ride.registrationDiscount ?? 0) > 0 ? round2(fee) : null;
}

export interface RiderPrice {
  /** What this rider owes. Null on a ride with no fee at all. */
  price:      number | null;
  /** The price before their tier was applied — shown struck through, but only
   *  when the tier actually changed it. */
  before:     number | null;
  /** The tier that moved the number, or null if none did. */
  tier:       MembershipTier | null;
  /** True when there is money to collect and a screenshot to ask for. */
  isPaid:     boolean;
}

/**
 * The price for one rider.
 *
 * Order of operations, and it matters: list fee → club discount → tier
 * percentage. The tier takes its cut of the already-discounted price, so a ride
 * on offer does not quietly hand veterans a second, compounding discount off
 * the higher number.
 */
export function priceForRider(
  ride: PricingInput,
  tier: MembershipTier | null,
  tiersEnabled: boolean,
): RiderPrice {
  const base = standardPrice(ride);
  if (base === null) return { price: null, before: null, tier: null, isPaid: false };

  const live = tiersEnabled && tier?.isActive ? tier : null;
  const pct  = live ? safePercent(live.discountPercent) : 0;

  if (!live || pct === 0 || base === 0) {
    return { price: base, before: null, tier: live, isPaid: base > 0 };
  }

  const price = round2(Math.max(0, base * (1 - pct / 100)));
  return { price, before: base, tier: live, isPaid: price > 0 };
}

/** Is there a fee at all, before any tier is considered? */
export function isPaidRide(ride: PricingInput): boolean {
  const p = standardPrice(ride);
  return p !== null && p > 0;
}

/** Nepali rupees, grouped, no decimals. */
export function formatFee(amount: number, currency = "Rs"): string {
  return `${currency} ${Math.round(amount).toLocaleString("en-IN")}`;
}

// ---------------------------------------------------------------------------
// Loyalty
// ---------------------------------------------------------------------------

/**
 * What one rider earns from something worth `base` points.
 *
 * Rounded, because a 1.5x multiplier on an odd number is otherwise a fraction
 * of a point that no display would ever show honestly.
 *
 * The factor used is recorded on the ledger row beside the total, so promoting
 * a rider later never rewrites what they earned before.
 */
export function pointsEarned(
  base: number,
  tier: MembershipTier | null,
  tiersEnabled: boolean,
): { points: number; factor: number } {
  const safeBase = Math.max(0, Math.round(base || 0));
  const factor = tiersEnabled && tier?.isActive
    ? Math.max(0, Number(tier.rewardFactor) || 1)
    : 1;
  return { points: Math.round(safeBase * factor), factor };
}
