// =============================================================================
// StatusChecker — enter access code, see application status + card
// 'use client'
// =============================================================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link                        from "next/link";
import { Search, CheckCircle2,
         Clock, XCircle, Printer }  from "lucide-react";
import { cn }                       from "@/utils/cn";
import { CardRenderer }             from "@/features/membership/CardRenderer";
import { ROUTES }                   from "@/lib/constants";
import type { MemberCard, CardSettings, BrandLogos } from "@/types";

interface StatusCheckerProps {
  settings:    CardSettings;
  brandLogos?: BrandLogos | null;
  /** Handed in by /check, which has already established the code exists. */
  initialCode?: string;
}

export function StatusChecker({ settings, brandLogos, initialCode }: StatusCheckerProps) {
  const [code,    setCode]    = useState(initialCode ?? "");
  const [card,    setCard]    = useState<MemberCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleCheck = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true); setError(null); setCard(null);

    try {
      const res  = await fetch(`/api/members/status?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok || !data.card) {
        setError(data.error ?? "No application found for this code. Check your code and try again.");
      } else {
        setCard(data.card);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  // Arriving with a code means the lookup has already happened once, on /check.
  // Making the rider press Check again to see the answer they were promised is
  // the site asking twice for the same thing.
  const auto = useRef(false);
  useEffect(() => {
    if (!initialCode || auto.current) return;
    auto.current = true;
    void handleCheck();
  }, [initialCode, handleCheck]);

  return (
    <div className="space-y-6">
      {/* Code input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          placeholder="HD-XXXXXX"
          maxLength={10}
          className={cn(
            "flex-1 h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700",
            "text-sm text-hd-ink-100 placeholder:text-hd-ink-600 font-mono tracking-widest",
            "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40 transition-colors uppercase",
          )}
        />
        <button
          type="button"
          onClick={handleCheck}
          disabled={loading || !code.trim()}
          className={cn(
            "flex items-center gap-1.5 px-4 rounded-lg text-sm font-semibold transition-all",
            loading || !code.trim()
              ? "bg-hd-ink-700 text-hd-ink-500 cursor-not-allowed"
              : "bg-hd-ember-600 hover:bg-hd-ember-500 text-white hover:shadow-glow-ember",
          )}
        >
          {loading
            ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search className="size-4" />}
          {loading ? "Checking…" : "Check"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/50 border border-hd-ember-800/40 text-hd-ember-300 text-sm">
          <XCircle className="size-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Result */}
      {card && (
        <div className="space-y-5">

          {/* Status banner */}
          {card.status === "pending" && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/40 border border-amber-800/40">
              <Clock className="size-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-300">Under Review</p>
                <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                  Your application is being reviewed by the Himalayan Drift team.
                  Check back in a few days.
                </p>
              </div>
            </div>
          )}

          {card.status === "rejected" && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-hd-ember-950/40 border border-hd-ember-800/40">
              <XCircle className="size-5 text-hd-ember-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-hd-ember-300">Application Rejected</p>
                {card.rejectionReason && (
                  <p className="text-xs text-hd-ember-400 mt-1 leading-relaxed">
                    Reason: {card.rejectionReason}
                  </p>
                )}
                <p className="text-xs text-hd-ink-500 mt-2">
                  Please correct the issue and resubmit using the button below.
                </p>
                <Link
                  href={`/membership?code=${encodeURIComponent(code.trim())}&resubmit=1`}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-xs font-semibold transition-colors"
                >
                  Edit &amp; Resubmit →
                </Link>
              </div>
            </div>
          )}

          {card.status === "approved" && (
            <>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-300">Approved — Card Ready</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Card number: <span className="font-mono text-emerald-400">{card.cardNumber}</span>
                  </p>
                </div>
              </div>

              {/* Card preview */}
              <div className="overflow-x-auto pb-2">
                <CardRenderer card={card} settings={settings} brandLogos={brandLogos} />
              </div>

              {/* Print button */}
              <Link
                href={ROUTES.memberCard(card.accessCode)}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-200 hover:text-white text-sm font-semibold transition-all"
              >
                <Printer className="size-4" />
                Open Print / Download View
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
