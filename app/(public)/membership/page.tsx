// =============================================================================
// /membership — landing page + Apply / Check Status tabs
// =============================================================================

import type { Metadata }       from "next";
import { CreditCard, Star, CheckCircle2 } from "lucide-react";
import {
  getCardSettings, getBrandLogos, getNavbarUser, getMyMemberCard,
}                              from "@/lib/supabase/queries";
import { AnimateIn }           from "@/components/shared/AnimateIn";
import { MembershipTabs }      from "@/features/membership/MembershipTabs";
import { MyMembershipPanel }   from "@/features/membership/MyMembershipPanel";

export const metadata: Metadata = {
  title:       "Membership Card",
  description: "Apply for your Himalayan Drift membership card — a free digital ID for members.",
};

// Deliberately not ISR any more: the page shows a signed-in rider their own
// card, so a cached copy would be somebody else's.
export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const [settings, brandLogos, user] = await Promise.all([
    getCardSettings(),
    getBrandLogos(),
    getNavbarUser(),
  ]);
  const myCard = user ? await getMyMemberCard() : null;
  const hasCard = myCard?.status === "approved" && !!myCard.cardNumber;

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">

      {/* Header */}
      <AnimateIn className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="block w-8 h-px bg-hd-ember-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
            Community
          </span>
          <span className="block w-8 h-px bg-hd-ember-600 rounded-full" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-hd-ink-50 mb-3">
          {hasCard ? "Your Membership Card" : "Membership Card"}
        </h1>
        <p className="text-sm sm:text-base text-hd-ink-400 max-w-lg mx-auto leading-relaxed">
          {hasCard
            ? "Carry it on your phone, or print it for your wallet."
            : "Official digital ID for Himalayan Drift members. Free to apply — approved by the Himalayan Drift team."}
        </p>
      </AnimateIn>

      {/* Benefits — worth reading before you apply, noise once you have one */}
      {!hasCard && settings.benefits.length > 0 && (
        <AnimateIn className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="block w-3 h-px bg-hd-ember-600 rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
              Member Benefits
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {settings.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl gradient-card border border-hd-ink-700/60"
              >
                <CheckCircle2 className="size-4 text-hd-ember-500 shrink-0 mt-0.5" />
                <span className="text-sm text-hd-ink-200 leading-relaxed">{benefit}</span>
              </div>
            ))}
          </div>
        </AnimateIn>
      )}

      {/* Signed in: their own card, or a one-tap request built from what the
          account already holds. Signed out: the form and the code checker,
          which is the only audience either was ever for. */}
      <AnimateIn>
        {user ? (
          <MyMembershipPanel
            card={myCard}
            settings={settings}
            brandLogos={brandLogos}
            fullName={user.fullName}
            isAdmin={user.isAdmin}
          />
        ) : (
          <MembershipTabs settings={settings} brandLogos={brandLogos} />
        )}
      </AnimateIn>
    </main>
  );
}
