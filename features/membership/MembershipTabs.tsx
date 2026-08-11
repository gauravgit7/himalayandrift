// =============================================================================
// MembershipTabs — Apply / Check Status tab switcher
// 'use client' — tab state
// =============================================================================

"use client";

import { useState }            from "react";
import { CreditCard, Search }  from "lucide-react";
import { cn }                  from "@/utils/cn";
import { ApplicationForm }     from "@/features/membership/ApplicationForm";
import { StatusChecker }       from "@/features/membership/StatusChecker";
import type { CardSettings, BrandLogos } from "@/types";

interface MembershipTabsProps {
  settings:    CardSettings;
  brandLogos?: BrandLogos | null;
}

export function MembershipTabs({ settings, brandLogos }: MembershipTabsProps) {
  const [tab, setTab] = useState<"apply" | "status">("apply");

  return (
    <div className="rounded-2xl gradient-card border border-hd-ink-700/60 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-hd-ink-800/60">
        {(["apply", "status"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all",
              tab === t
                ? "text-hd-ink-50 border-b-2 border-hd-ember-600 bg-hd-ember-950/20"
                : "text-hd-ink-500 hover:text-hd-ink-200 hover:bg-hd-ink-800/40",
            )}
          >
            {t === "apply"
              ? <><CreditCard className="size-4" /> Apply for Card</>
              : <><Search className="size-4" /> Check Status</>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tab === "apply" ? (
          <ApplicationForm />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-hd-ink-400">
              Enter the reference code you received after submitting your application.
            </p>
            <StatusChecker settings={settings} brandLogos={brandLogos} />
          </div>
        )}
      </div>
    </div>
  );
}
