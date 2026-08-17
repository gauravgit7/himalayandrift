// =============================================================================
// Shop pricing helpers — shared by the server and the browser
//
// The authoritative arithmetic happens on the server, in priceBasket and
// submitShopOrder. These are the same rules expressed for display, so a card,
// a product page and a basket line never disagree about what a thing costs.
// Nothing here decides what is charged; the server does that, every time.
// =============================================================================

import type { Product, ProductVariant } from "@/types";

/** Clamped the same way the database check constraint clamps it. */
function safeDiscount(percent: number): number {
  return Math.min(Math.max(percent, 0), 90);
}

/** What one unit costs after the discount, including a size surcharge. */
export function discountedPrice(product: Product, variant?: ProductVariant | null): number {
  const base = product.price + (variant?.priceDelta ?? 0);
  return Math.round(base * (1 - safeDiscount(product.discountPercent) / 100) * 100) / 100;
}

/** The struck-through "was" figure. Equals the paid price when nothing is off. */
export function fullPrice(product: Product, variant?: ProductVariant | null): number {
  return Math.round((product.price + (variant?.priceDelta ?? 0)) * 100) / 100;
}

/**
 * How many are available. Null means stock is not tracked for this product —
 * a made-to-order patch never runs out, and showing "0 left" for one would be
 * a lie in the other direction.
 *
 * With variants, the product's own stock column is ignored entirely: the total
 * across sizes is what tells you whether anything at all is left, while each
 * size answers for itself.
 */
export function stockOf(product: Product): number | null {
  const active = product.variants.filter((v) => v.isActive);
  if (active.length) return active.reduce((n, v) => n + v.stock, 0);
  return product.stock ?? null;
}

/** Nepali rupees, grouped, no decimals — nobody prices merch in paisa. */
export function formatNpr(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString("en-IN")}`;
}
