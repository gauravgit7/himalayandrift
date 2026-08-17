// =============================================================================
// Ride pricing — the fee, the discount, and the rider classes
//
// One ride can charge several prices. There is a list fee, an optional flat
// discount off it for everybody, and an optional set of rider classes with
// their own absolute price — members, veterans, a marshal riding along rather
// than leading.
//
// Every one of those numbers is resolved HERE, and the server resolves them
// again from the database at submission. The registration form is allowed to
// display a price; it is never allowed to decide one. A tier arrives from the
// browser as an id and nothing more.
//
// Pure, and importing nothing: the arithmetic is the part worth being able to
// reason about on its own.
// =============================================================================

import type { Ride, RidePriceTier } from "@/types";

/** The shape both the Ride type and the raw DB row can satisfy. */
export interface PricingInput {
  registrationFee:      number | null;
  registrationDiscount: number | null;
  registrationTiers:    RidePriceTier[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Tiers arrive out of jsonb, so they are whatever was last written there —
 * possibly by an older version of the form. A row with no label or no usable
 * price is dropped rather than allowed through, where it would offer a nameless
 * class at NaN rupees.
 *
 * Lives here rather than in the mappers because the server action needs it too,
 * working straight off a raw row.
 */
export function parseTiers(raw: unknown): RidePriceTier[] {
  if (!Array.isArray(raw)) return [];
  const out: RidePriceTier[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!label) continue;
    const rawPrice = row.price;
    const price = typeof rawPrice === "number" ? rawPrice
      : typeof rawPrice === "string" && rawPrice !== "" ? Number(rawPrice)
      : NaN;
    if (!Number.isFinite(price)) continue;
    out.push({
      id:    typeof row.id === "string" && row.id ? row.id : label.toLowerCase(),
      label,
      note:  typeof row.note === "string" && row.note.trim() ? row.note.trim() : null,
      price: Math.max(0, price),
      requiresMemberCard: row.requiresMemberCard === true,
    });
  }
  return out;
}

/**
 * What a rider claiming nothing pays.
 *
 * Clamped at zero: a discount larger than the fee is a typo, and a negative
 * price would have the club paying people to turn up.
 */
export function standardPrice(ride: PricingInput): number | null {
  const fee = ride.registrationFee;
  if (fee === null || fee <= 0) return fee === null ? null : 0;
  const discount = ride.registrationDiscount ?? 0;
  return round2(Math.max(0, fee - Math.max(0, discount)));
}

/** The struck-through "was" figure, or null when there is nothing to strike. */
export function listPrice(ride: PricingInput): number | null {
  const fee = ride.registrationFee;
  if (fee === null || fee <= 0) return null;
  const discount = ride.registrationDiscount ?? 0;
  return discount > 0 ? round2(fee) : null;
}

/** Tiers that are actually usable — a blank label is a half-filled form row. */
export function usableTiers(ride: PricingInput): RidePriceTier[] {
  return (ride.registrationTiers ?? []).filter((t) => t.label?.trim());
}

/**
 * The price for a claimed class, or the standard price when nothing valid was
 * claimed. An id the ride does not offer resolves to the standard price rather
 * than an error: it means a stale form, not an attack, and the honest answer to
 * "this class does not exist here" is "then you pay the normal price".
 */
export function priceForTier(
  ride: PricingInput, tierId: string | null | undefined,
): { price: number | null; tier: RidePriceTier | null } {
  const standard = standardPrice(ride);
  if (!tierId) return { price: standard, tier: null };

  const tier = usableTiers(ride).find((t) => t.id === tierId);
  if (!tier) return { price: standard, tier: null };

  return { price: round2(Math.max(0, tier.price)), tier };
}

/**
 * The lowest price anyone could pay, for a "from Rs X" on a card. Includes the
 * tiers, because a ride whose cheapest class is half the standard price is not
 * honestly described by the standard price alone.
 */
export function lowestPrice(ride: PricingInput): number | null {
  const standard = standardPrice(ride);
  if (standard === null) return null;
  const tiers = usableTiers(ride);
  if (!tiers.length) return standard;
  return round2(Math.min(standard, ...tiers.map((t) => Math.max(0, t.price))));
}

/** Is this ride paid at all? A ride whose every price is zero is a free ride. */
export function isPaidRide(ride: PricingInput): boolean {
  const standard = standardPrice(ride);
  return standard !== null && standard > 0;
}

/** Nepali rupees, grouped, no decimals. */
export function formatFee(amount: number, currency = "Rs"): string {
  return `${currency} ${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Narrow a full Ride down to what the pricing functions need. */
export function pricingOf(ride: Ride): PricingInput {
  return {
    registrationFee:      ride.registrationFee,
    registrationDiscount: ride.registrationDiscount,
    registrationTiers:    ride.registrationTiers,
  };
}
