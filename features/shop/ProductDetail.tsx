// =============================================================================
// ProductDetail — one item, its sizes, and the button that adds it
// 'use client' — size selection, quantity, gallery
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Link                  from "next/link";
import { ShoppingBag, Check, Minus, Plus, ImageOff, ArrowLeft } from "lucide-react";
import { cn }                from "@/utils/cn";
import { useCart }           from "@/features/shop/CartProvider";
import { discountedPrice, fullPrice, formatNpr } from "@/features/shop/pricing";
import { ROUTES }            from "@/lib/constants";
import type { Product }      from "@/types";

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();

  const sizes = useMemo(
    () => product.variants.filter((v) => v.isActive),
    [product.variants],
  );

  // Preselect the first size that is actually in stock. Landing on a sold-out
  // size and having to hunt for an available one is a needless first move.
  const [variantId, setVariantId] = useState<string | null>(
    () => sizes.find((v) => v.stock > 0)?.id ?? sizes[0]?.id ?? null,
  );
  const [qty,   setQty]   = useState(1);
  const [image, setImage] = useState(0);
  const [added, setAdded] = useState(false);

  const variant   = sizes.find((v) => v.id === variantId) ?? null;
  const price     = discountedPrice(product, variant);
  const was       = fullPrice(product, variant);
  const available = sizes.length ? (variant?.stock ?? 0) : product.stock;
  const soldOut   = available === 0;
  const needsSize = sizes.length > 0 && !variant;
  const canAdd    = !soldOut && !needsSize;

  const addToCart = () => {
    if (!canAdd) return;
    add({ productId: product.id, variantId: variant?.id ?? null, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const max = available ?? 99;

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.shop}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-hd-ink-400 hover:text-hd-ink-100 transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to the shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 items-start">

        {/* ── Gallery ── */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-hd-ink-900 border border-hd-ink-700/60">
            {product.imageUrls[image] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrls[image]}
                alt={product.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <ImageOff className="size-10 text-hd-ink-700" />
              </span>
            )}
          </div>

          {product.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.imageUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setImage(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={cn(
                    "size-16 rounded-lg overflow-hidden border shrink-0 transition-colors",
                    i === image ? "border-hd-ember-600" : "border-hd-ink-700 hover:border-hd-ink-500",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <div className="space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-hd-ember-400 font-bold">
              {product.category}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-hd-ink-50 mt-1.5">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="text-sm text-hd-ink-400 mt-2 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-hd-ember-400">
              {formatNpr(price)}
            </span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-base text-hd-ink-600 line-through">
                  {formatNpr(was)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-hd-ember-600 text-white text-[10px] font-bold">
                  −{product.discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((v) => {
                  const gone = v.stock === 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setVariantId(v.id); setQty(1); }}
                      disabled={gone}
                      className={cn(
                        "min-w-12 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors",
                        gone
                          ? "border-hd-ink-800 text-hd-ink-700 line-through cursor-not-allowed"
                          : v.id === variantId
                            ? "border-hd-ember-600 bg-hd-ember-950/40 text-hd-ember-300"
                            : "border-hd-ink-700 text-hd-ink-300 hover:border-hd-ink-500",
                      )}
                    >
                      {v.label}
                      {v.priceDelta !== 0 && !gone && (
                        <span className="ml-1 text-[10px] text-hd-ink-500">
                          {v.priceDelta > 0 ? "+" : ""}{Math.round(v.priceDelta)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {variant && variant.stock > 0 && variant.stock <= 5 && (
                <p className="text-xs text-amber-500">
                  Only {variant.stock} left in {variant.label}
                </p>
              )}
            </div>
          )}

          {/* Quantity */}
          {canAdd && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
                How many
              </p>
              <div className="inline-flex items-center rounded-lg border border-hd-ink-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="One fewer"
                  className="px-3 py-2 text-hd-ink-300 hover:text-white hover:bg-hd-ink-800 transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-hd-ink-100 tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(max, q + 1))}
                  disabled={qty >= max}
                  aria-label="One more"
                  className="px-3 py-2 text-hd-ink-300 hover:text-white hover:bg-hd-ink-800 disabled:opacity-30 transition-colors"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Add */}
          <button
            type="button"
            onClick={addToCart}
            disabled={!canAdd}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all",
              !canAdd
                ? "bg-hd-ink-800 text-hd-ink-500 cursor-not-allowed"
                : added
                  ? "bg-emerald-700 text-white"
                  : "bg-hd-ember-600 hover:bg-hd-ember-500 text-white hover:shadow-glow-ember active:scale-[0.99]",
            )}
          >
            {soldOut
              ? "Sold out"
              : needsSize
                ? "Pick a size"
                : added
                  ? <><Check className="size-4" /> In your basket</>
                  : <><ShoppingBag className="size-4" /> Add to basket</>}
          </button>

          {added && (
            <Link
              href={ROUTES.shopCheckout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
            >
              Go to the basket →
            </Link>
          )}

          {product.description && (
            <div className="pt-4 border-t border-hd-ink-800">
              <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 mb-2">
                Details
              </p>
              <p className="text-sm text-hd-ink-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
