// =============================================================================
// ProductCard — one item in the shop window
// =============================================================================

import Link from "next/link";
import { ImageOff } from "lucide-react";
import { cn }       from "@/utils/cn";
import { ROUTES }   from "@/lib/constants";
import { discountedPrice, stockOf, formatNpr } from "@/features/shop/pricing";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const price     = discountedPrice(product);
  const stock     = stockOf(product);
  const soldOut   = stock === 0;
  const onOffer   = product.discountPercent > 0;
  const thumbnail = product.imageUrls[0];

  return (
    <Link
      href={ROUTES.product(product.slug)}
      className={cn(
        "group flex flex-col rounded-2xl overflow-hidden border transition-all",
        "gradient-card border-hd-ink-700/60 hover:border-hd-ember-700/50",
      )}
    >
      <div className="relative aspect-square bg-hd-ink-900 overflow-hidden">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={product.name}
            className={cn(
              "size-full object-cover transition-transform duration-500 group-hover:scale-105",
              soldOut && "opacity-40 grayscale",
            )}
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <ImageOff className="size-8 text-hd-ink-700" />
          </span>
        )}

        {onOffer && !soldOut && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-hd-ember-600 text-white text-[10px] font-bold tracking-wide">
            −{product.discountPercent}%
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 py-1.5 bg-hd-ink-950/85 text-center text-[10px] font-bold uppercase tracking-widest text-hd-ink-300">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3.5">
        <p className="text-[9px] uppercase tracking-widest text-hd-ink-500">
          {product.category}
        </p>
        <h3 className="text-sm font-bold text-hd-ink-50 mt-0.5 leading-tight line-clamp-2">
          {product.name}
        </h3>
        {product.shortDescription && (
          <p className="text-xs text-hd-ink-500 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-auto pt-3">
          <span className="text-base font-black text-hd-ember-400">
            {formatNpr(price)}
          </span>
          {onOffer && (
            <span className="text-xs text-hd-ink-600 line-through">
              {formatNpr(product.price)}
            </span>
          )}
        </div>

        {/* Only worth saying when it is nearly gone — a shelf full of stock is
            not news, and a permanent "12 left" reads as a sales tactic. */}
        {stock !== null && stock > 0 && stock <= 5 && (
          <p className="text-[10px] text-amber-500 mt-1">
            Only {stock} left
          </p>
        )}
      </div>
    </Link>
  );
}
