// =============================================================================
// RideCountdown — "Next ride in X days" pill for the homepage hero
// Client component: computes days from today, refreshes at midnight
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { Ride } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RideCountdownProps {
  nextRide: Ride | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RideCountdown({ nextRide }: RideCountdownProps) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!nextRide) return;

    const update = () => setDays(getDaysUntil(nextRide.startDate));
    update();

    // Re-compute at midnight so "in 1 day" flips to "Tomorrow!" automatically
    const now           = new Date();
    const msToMidnight  = new Date(
      now.getFullYear(), now.getMonth(), now.getDate() + 1
    ).getTime() - now.getTime();

    const timer = setTimeout(() => {
      update();
    }, msToMidnight);

    return () => clearTimeout(timer);
  }, [nextRide]);

  if (!nextRide || days === null || days < 0) return null;

  const urgencyLabel =
    days === 0 ? "Today! 🔥" :
    days === 1 ? "Tomorrow!" :
    days <= 7  ? `${days} days` :
                 `${days} days`;

  const isUrgent = days <= 3;

  return (
    <Link
      href={ROUTES.ride(nextRide.slug)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tvs-charcoal-800/70 border border-tvs-charcoal-700/50 hover:border-tvs-red-700/50 hover:bg-tvs-charcoal-700/70 transition-all duration-200 group w-fit"
    >
      <Flag className="size-3 text-tvs-red-500 shrink-0" />
      <span className="text-xs text-tvs-charcoal-500 group-hover:text-tvs-charcoal-300 transition-colors whitespace-nowrap">
        Next ride
      </span>
      <span className={
        isUrgent
          ? "text-xs font-bold text-tvs-red-400 whitespace-nowrap"
          : "text-xs font-bold text-tvs-charcoal-200 whitespace-nowrap"
      }>
        {urgencyLabel}
      </span>
      <span className="text-xs text-tvs-charcoal-500 truncate max-w-[160px] group-hover:text-tvs-charcoal-300 transition-colors">
        · {nextRide.title}
      </span>
    </Link>
  );
}
