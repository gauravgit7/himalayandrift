// =============================================================================
// /membership — landing page + Apply / Check Status tabs
// =============================================================================

import type { Metadata }       from "next";
import { CreditCard, Star, CheckCircle2 } from "lucide-react";
import { getCardSettings, getBrandLogos } from "@/lib/supabase/queries";
import { ApplicationForm }     from "@/features/membership/ApplicationForm";
import { StatusChecker }       from "@/features/membership/StatusChecker";
import { AnimateIn }           from "@/components/shared/AnimateIn";
import { MembershipTabs }      from "@/features/membership/MembershipTabs";

export const metadata: Metadata = {
  title:       "Membership Card | Himalayan Drift",
  description: "Apply for your Himalayan Drift membership card — a free digital ID for members.",
};

export const revalidate = 3600;

export default async function MembershipPage() {
  const [settings, brandLogos] = await Promise.all([getCardSettings(), getBrandLogos()]);

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">

      {/* Header */}
      <AnimateIn className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="block w-8 h-px bg-tvs-red-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
            Community
          </span>
          <span className="block w-8 h-px bg-tvs-red-600 rounded-full" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-tvs-charcoal-50 mb-3">
          Membership Card
        </h1>
        <p className="text-sm sm:text-base text-tvs-charcoal-400 max-w-lg mx-auto leading-relaxed">
          Official digital ID for Himalayan Drift members.
          Free to apply — approved by the Himalayan Drift team.
        </p>
      </AnimateIn>

      {/* Benefits section */}
      {settings.benefits.length > 0 && (
        <AnimateIn className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="block w-3 h-px bg-tvs-red-600 rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
              Member Benefits
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {settings.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl gradient-card border border-tvs-charcoal-700/60"
              >
                <CheckCircle2 className="size-4 text-tvs-red-500 shrink-0 mt-0.5" />
                <span className="text-sm text-tvs-charcoal-200 leading-relaxed">{benefit}</span>
              </div>
            ))}
          </div>
        </AnimateIn>
      )}

      {/* Tabs: Apply | Check Status */}
      <AnimateIn>
        <MembershipTabs settings={settings} brandLogos={brandLogos} />
      </AnimateIn>
    </main>
  );
}
