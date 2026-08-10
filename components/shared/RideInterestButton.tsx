// =============================================================================
// RideInterestButton — "I'm joining" soft-RSVP with toggle-off support
// No auth required. Uses localStorage to persist state across page loads.
// Optimistic UI: count updates instantly, API call confirms in background.
//
// States:
//  idle     — grey button, "I'm joining"
//  joined   — green button, "You're in!" / hover shows "Remove"
//  loading  — spinner, button locked
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Check, Loader2, X } from "lucide-react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RideInterestButtonProps {
  rideId:       string;
  initialCount: number;
  className?:   string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RideInterestButton({
  rideId,
  initialCount,
  className,
}: RideInterestButtonProps) {
  const storageKey = `tvs-interest-${rideId}`;

  const [count,     setCount]     = useState(initialCount);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") setHasJoined(true);
    } catch {}
  }, [storageKey]);

  const handleClick = useCallback(async () => {
    if (isLoading) return;

    const joining = !hasJoined;

    // Optimistic update
    setHasJoined(joining);
    setCount((c) => joining ? c + 1 : Math.max(0, c - 1));
    setIsLoading(true);

    try {
      const res = await fetch("/api/rides/interest", {
        method:  joining ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rideId }),
      });
      const data = await res.json();

      if (typeof data.count === "number") setCount(data.count);

      // Sync localStorage
      if (joining) {
        localStorage.setItem(storageKey, "1");
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Revert on network error
      setHasJoined(!joining);
      setCount((c) => joining ? Math.max(0, c - 1) : c + 1);
    } finally {
      setIsLoading(false);
    }
  }, [rideId, hasJoined, isLoading, storageKey]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "group flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
        hasJoined
          // Joined: green by default, shifts to a muted red-tint on hover to
          // signal that clicking again will remove interest.
          ? "bg-emerald-950/50 border border-emerald-700/40 text-emerald-400 hover:bg-red-950/40 hover:border-red-800/40 hover:text-red-400 active:scale-[0.97]"
          : "bg-tvs-charcoal-800/80 border border-tvs-charcoal-700 text-tvs-charcoal-200 hover:bg-tvs-charcoal-700 hover:text-white hover:border-tvs-charcoal-500 active:scale-[0.97]",
        isLoading && "cursor-wait",
        className
      )}
      title={hasJoined ? "Click to remove your interest" : "Mark your interest in joining this ride"}
    >
      {/* Icon — spinner during load; on joined state the ✓ slides out and
          × slides in on hover so the user knows clicking will toggle off. */}
      {isLoading ? (
        <Loader2 className="size-4 animate-spin shrink-0" />
      ) : hasJoined ? (
        <>
          <Check className="size-4 shrink-0 group-hover:hidden" />
          <X     className="size-4 shrink-0 hidden group-hover:block" />
        </>
      ) : (
        <Users className="size-4 shrink-0" />
      )}

      {/* Label — same hover swap for joined state */}
      {hasJoined ? (
        <>
          <span className="group-hover:hidden">You&apos;re in!</span>
          <span className="hidden group-hover:block">Remove</span>
        </>
      ) : (
        <span>I&apos;m joining</span>
      )}

      {/* Count badge */}
      {count > 0 && (
        <span
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-full tabular-nums transition-colors duration-200",
            hasJoined
              ? "bg-emerald-900/50 text-emerald-300 group-hover:bg-red-900/40 group-hover:text-red-300"
              : "bg-tvs-charcoal-700 text-tvs-charcoal-400"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
