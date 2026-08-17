// =============================================================================
// /shop — the shop window
// =============================================================================

import type { Metadata } from "next";
import Link              from "next/link";
import { notFound }      from "next/navigation";
import { ShoppingBag, Info, Truck } from "lucide-react";
import { getProducts, getShopSettings } from "@/lib/supabase/queries";
import { ProductCard }   from "@/features/shop/ProductCard";
import { AnimateIn }     from "@/components/shared/AnimateIn";
import { ROUTES }        from "@/lib/constants";

export const metadata: Metadata = {
  title:       "Shop",
  description: "Himalayan Drift merch — shirts, patches and the rest of the kit.",
};

// Stock changes as orders are approved, and a cached page that says "3 left"
// after the last one went is worse than no number at all.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [settings, products] = await Promise.all([getShopSettings(), getProducts()]);

  // A shop switched off is not an empty shop — the page should not exist.
  if (!settings.isEnabled) notFound();

  const featured = products.filter((p) => p.isFeatured);
  const rest     = products.filter((p) => !p.isFeatured);

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">

      <AnimateIn className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="block w-8 h-px bg-hd-ember-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
            Merch
          </span>
          <span className="block w-8 h-px bg-hd-ember-600 rounded-full" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-hd-ink-50 mb-3">
          The Shop
        </h1>
        <p className="text-sm sm:text-base text-hd-ink-400 max-w-lg mx-auto leading-relaxed">
          Kit for the road. Every order is checked by hand, so give us a day or
          two to come back to you.
        </p>
      </AnimateIn>

      {settings.announcement && (
        <AnimateIn className="mb-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-hd-ember-950/25 border border-hd-ember-800/40 max-w-2xl mx-auto">
            <Info className="size-4 text-hd-ember-400 shrink-0 mt-0.5" />
            <p className="text-sm text-hd-ink-200 leading-relaxed whitespace-pre-line">
              {settings.announcement}
            </p>
          </div>
        </AnimateIn>
      )}

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <ShoppingBag className="size-12 mx-auto mb-4 text-hd-ink-700" />
          <p className="text-sm text-hd-ink-500">
            Nothing in stock right now. Check back before the next ride.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {featured.length > 0 && (
            <AnimateIn>
              <div className="flex items-center gap-2 mb-4">
                <span className="block w-3 h-px bg-hd-ember-600 rounded-full" />
                <span className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
                  Pick of the rack
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </AnimateIn>
          )}

          {rest.length > 0 && (
            <AnimateIn>
              {featured.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="block w-3 h-px bg-hd-ink-700 rounded-full" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-hd-ink-500">
                    Everything else
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {rest.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </AnimateIn>
          )}
        </div>
      )}

      {settings.deliveryNote && (
        <AnimateIn className="mt-12">
          <div className="flex items-start gap-3 p-4 rounded-xl gradient-card border border-hd-ink-700/60 max-w-2xl mx-auto">
            <Truck className="size-4 text-hd-ink-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 mb-1">
                Delivery
              </p>
              <p className="text-sm text-hd-ink-300 leading-relaxed whitespace-pre-line">
                {settings.deliveryNote}
              </p>
            </div>
          </div>
        </AnimateIn>
      )}

      <div className="mt-10 text-center">
        <Link
          href={ROUTES.shopCheckout}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
        >
          <ShoppingBag className="size-4" /> View your basket
        </Link>
      </div>
    </main>
  );
}
