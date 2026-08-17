// =============================================================================
// CodeCheckForm — type a reference code, land on the right page
// 'use client'
//
// Deliberately a doorway rather than a destination. Ride registrations and shop
// orders already have full status pages, and a membership code has the card
// view on /membership; rendering any of that a second time inside a small box
// would mean two versions of the same screen to keep in step.
//
// The lookup is NOT scoped to whatever page the form is sitting on. A rider on
// the Gorkha page holding a Manang code should be shown their Manang
// registration, not told nothing was found — that is technically true and
// practically a dead end, and they cannot tell which of the two things went
// wrong.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter }             from "next/navigation";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { cn }           from "@/utils/cn";
import { resolveCode }  from "@/lib/supabase/actions";

export function CodeCheckForm({
  autoFocus, onResolved,
}: {
  autoFocus?:  boolean;
  /** Fired just before navigating, so a modal can close itself. */
  onResolved?: () => void;
}) {
  const router = useRouter();
  const [code,    setCode]    = useState("");
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const check = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setBusy(true); setError(null);
    const res = await resolveCode(trimmed);

    if (res.error || !res.href) {
      setBusy(false);
      setError(res.error ?? "Could not find that code.");
      return;
    }
    // Left busy on purpose: the navigation is the next thing that happens, and
    // a button that springs back to life first invites a second click.
    onResolved?.();
    router.push(res.href);
  }, [code, router, onResolved]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") void check(); }}
          placeholder="HD-R-AB12CD"
          maxLength={16}
          disabled={busy}
          aria-label="Reference code"
          className={cn(
            "flex-1 h-11 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700",
            "text-sm text-hd-ink-100 placeholder:text-hd-ink-600 font-mono tracking-widest uppercase",
            "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
            "disabled:opacity-60 transition-colors",
          )}
        />
        <button
          type="button"
          onClick={() => void check()}
          disabled={busy || !code.trim()}
          className={cn(
            "flex items-center gap-1.5 px-4 rounded-lg text-sm font-semibold transition-all",
            busy || !code.trim()
              ? "bg-hd-ink-700 text-hd-ink-500 cursor-not-allowed"
              : "bg-hd-ember-600 hover:bg-hd-ember-500 text-white hover:shadow-glow-ember",
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {busy ? "Checking…" : "Check"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/50 border border-hd-ember-800/40">
          <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-sm text-hd-ember-300 leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
}
