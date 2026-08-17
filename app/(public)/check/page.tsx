// =============================================================================
// /check — one place to look up any reference code
//
// The site hands out three kinds of code and, until now, had three different
// answers to "where do I check this": a tab on /membership, and for the other
// two nothing at all beyond the link sent at submission. This is the permanent
// address for all of them.
// =============================================================================

import type { Metadata } from "next";
import Link              from "next/link";
import { Ticket, CreditCard, ShoppingBag, Flag } from "lucide-react";
import { CodeCheckForm } from "@/features/codes/CodeCheckForm";
import { AnimateIn }     from "@/components/shared/AnimateIn";
import { getNavbarUser } from "@/lib/supabase/queries";
import { ROUTES }        from "@/lib/constants";

export const metadata: Metadata = {
  title:       "Check a Code",
  description: "Look up a Himalayan Drift ride registration, membership card or shop order.",
  // The page itself is fine to index; the pages it leads to are not, and they
  // set their own noindex.
};

export const dynamic = "force-dynamic";

const KINDS = [
  { icon: Flag,       label: "Ride registration", example: "HD-R-AB12CD" },
  { icon: CreditCard, label: "Membership card",   example: "HD-AB12CD"   },
  { icon: ShoppingBag,label: "Shop order",        example: "HDS-AB12CD"  },
];

export default async function CheckCodePage() {
  const user = await getNavbarUser();

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <AnimateIn className="text-center mb-8">
        <div className="size-12 mx-auto mb-4 rounded-full bg-hd-ember-950/50 border border-hd-ember-800/50 flex items-center justify-center">
          <Ticket className="size-5 text-hd-ember-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-hd-ink-50">
          Check a Code
        </h1>
        <p className="text-sm text-hd-ink-400 mt-3 leading-relaxed">
          Whatever you signed up for, the code you were given goes here.
        </p>
      </AnimateIn>

      <AnimateIn>
        <div className="p-5 rounded-2xl gradient-card border border-hd-ink-700 space-y-5">
          <CodeCheckForm autoFocus />

          <div className="space-y-2 pt-4 border-t border-hd-ink-800">
            <p className="text-[10px] uppercase tracking-widest text-hd-ink-500">
              What the codes look like
            </p>
            {KINDS.map(({ icon: Icon, label, example }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon className="size-3.5 text-hd-ink-600 shrink-0" />
                <span className="text-xs text-hd-ink-400 flex-1">{label}</span>
                <span className="text-[11px] font-mono text-hd-ink-500 tracking-wider">
                  {example}
                </span>
              </div>
            ))}
          </div>
        </div>
      </AnimateIn>

      {/* Nobody signed in should have to type a code. Their profile knows. */}
      {user && (
        <AnimateIn className="mt-5">
          <Link
            href={ROUTES.profile}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
          >
            You are signed in — your rides and card are on your profile →
          </Link>
        </AnimateIn>
      )}
    </main>
  );
}
