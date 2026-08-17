// =============================================================================
// CodeCheckDialog — the contextual way into the code lookup
// 'use client'
//
// Sits on the ride page, where somebody who has lost their confirmation link
// will go looking. The button is where they expect it; the lookup behind it is
// the site-wide one, so a code for a different ride still works.
//
// A signed-in rider gets a link to their profile instead. Their registrations
// are already listed there with their status, and asking them for a code they
// never kept would be the site failing to remember something it knows.
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import { Search, X, UserCog }  from "lucide-react";
import { cn }                  from "@/utils/cn";
import { CodeCheckForm }       from "@/features/codes/CodeCheckForm";
import { ROUTES }              from "@/lib/constants";

export function CodeCheckDialog({
  signedIn, label = "Check registration status", className,
}: {
  signedIn?:  boolean;
  label?:     string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (signedIn) {
    return (
      <Link
        href={ROUTES.profile}
        className={cn(
          "flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg",
          "border border-hd-ink-700 hover:border-hd-ink-500",
          "text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors",
          className,
        )}
      >
        <UserCog className="size-4" /> See your registrations
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg",
          "border border-hd-ink-700 hover:border-hd-ink-500",
          "text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors",
          className,
        )}
      >
        <Search className="size-4" /> {label}
      </button>

      {open && (
        <div className="print:hidden fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Check a reference code"
            className="relative w-full max-w-md bg-hd-ink-900 border border-hd-ink-700 rounded-2xl shadow-cinematic animate-fade-in"
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b border-hd-ink-800">
              <div>
                <h2 className="text-base font-bold text-hd-ink-50">
                  Check your registration
                </h2>
                <p className="text-xs text-hd-ink-500 mt-1 leading-relaxed">
                  Enter the code you were given when you signed up. It works for
                  any ride, not only this one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 p-1.5 rounded-lg text-hd-ink-400 hover:text-hd-ink-100 hover:bg-hd-ink-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <CodeCheckForm autoFocus onResolved={() => setOpen(false)} />
              <p className="text-[11px] text-hd-ink-600 leading-relaxed">
                A membership card or shop order code works here too.{" "}
                <Link
                  href={ROUTES.profile}
                  className="text-hd-ink-400 hover:text-hd-ember-400 underline underline-offset-2 transition-colors"
                >
                  Signed in? Your rides are on your profile.
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
