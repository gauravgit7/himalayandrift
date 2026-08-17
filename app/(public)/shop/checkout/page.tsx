// =============================================================================
// /shop/checkout — the basket and the order form
// =============================================================================

import type { Metadata } from "next";
import { notFound }      from "next/navigation";
import {
  getShopSettings, getPaymentSettings, getNavbarUser,
} from "@/lib/supabase/queries";
import { CheckoutClient } from "@/features/shop/CheckoutClient";
import { AnimateIn }      from "@/components/shared/AnimateIn";

export const metadata: Metadata = { title: "Your Basket" };

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [settings, payment, user] = await Promise.all([
    getShopSettings(), getPaymentSettings(), getNavbarUser(),
  ]);

  if (!settings.isEnabled) notFound();

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <AnimateIn className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-hd-ink-50">
          Your Basket
        </h1>
        <p className="text-sm text-hd-ink-400 mt-2">
          Check it over, tell us where it goes, and pay.
        </p>
      </AnimateIn>

      <AnimateIn>
        <CheckoutClient
          payment={payment}
          deliveryNote={settings.deliveryNote}
          // Prefilled for a signed-in rider, for the same reason the card
          // request is: they have already told us who they are.
          signedInName={user?.fullName || undefined}
        />
      </AnimateIn>
    </main>
  );
}
