// =============================================================================
// MarqueeHighlight - Phase 3 · Premium showcase of the 2 marquee expeditions
// Phase 9 · Alternating slide-in + spring hover via Framer Motion
// 'use client' - getDaysUntil uses new Date(), motion animations
// =============================================================================

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  formatRideDateRange,
  getRideDurationDays,
  parseISO,
} from "@/utils/date";
import { differenceInDays } from "date-fns";
import { ROUTES } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Ride, BrandLogos } from "@/types";

interface MarqueeHighlightProps {
  rides:       Ride[];
  brandLogos?: BrandLogos | null;
}

// ---------------------------------------------------------------------------
// Days-until helper
// ---------------------------------------------------------------------------

function getDaysUntil(startDateStr: string): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseISO(startDateStr);
  const diff  = differenceInDays(start, today);
  return diff >= 0 ? diff : null;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// ---------------------------------------------------------------------------
// Single marquee card
// ---------------------------------------------------------------------------

function MarqueeCard({ ride, index, brandLogos }: { ride: Ride; index: number; brandLogos?: BrandLogos | null }) {
  const dateLabel = formatRideDateRange(ride.startDate, ride.endDate);
  const duration  = getRideDurationDays(ride.startDate, ride.endDate);
  const daysUntil = getDaysUntil(ride.startDate);
  const waypoints = ride.routeData?.waypoints ?? [];
  const isEven    = index % 2 === 0;

  return (
    <motion.div
      // Entrance: alternate slide from left / right
      initial={{ opacity: 0, x: isEven ? -48 : 48 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      // Hover: spring lift
      whileHover={{ y: -5 }}
      transition={{
        // Entrance transition (default - applies to opacity + x)
        duration: 0.65,
        delay:    index * 0.12,
        ease:     EASE,
        // Per-property override for the hover lift
        y: { type: "spring", stiffness: 280, damping: 22 },
      }}
    >
      <Link
        href={ROUTES.ride(ride.slug)}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300",
          // hover shadow still via CSS (no Framer Motion shadow animation)
          "hover:shadow-cinematic",
          "border-violet-800/50 hover:border-violet-600/70"
        )}
      >
        {/* Background gradient */}
        <div
          className={cn(
            "absolute inset-0",
            isEven
              ? "bg-gradient-to-br from-[#1a0a2e] via-tvs-crimson-950 to-tvs-charcoal-950"
              : "bg-gradient-to-br from-tvs-crimson-950 via-[#1a0a2e] to-tvs-charcoal-950"
          )}
        />
        {/* Glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-violet-950/20 pointer-events-none" />
        {/* Violet top accent line */}
        <div className="relative h-0.5 w-full bg-gradient-to-r from-violet-600 via-tvs-red-600 to-violet-800 shrink-0" />

        <div className="relative flex flex-col h-full p-6 gap-5">

          {/* Top badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400 border border-yellow-700/40">
                ★ MARQUEE
              </span>
            </div>
            <StatusBadge status={ride.status} size="xs" />
          </div>

          {/* Title & description */}
          <div>
            <h3 className="text-xl font-black text-white leading-tight group-hover:text-tvs-red-100 transition-colors duration-200">
              {ride.title}
            </h3>
            {ride.description && (
              <p className="mt-2 text-sm text-tvs-charcoal-300 line-clamp-3 leading-relaxed">
                {ride.description}
              </p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-xs text-tvs-charcoal-300">
              <Calendar className="size-3.5 text-violet-400 shrink-0" />
              <span>{dateLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-tvs-charcoal-300">
              <Clock className="size-3.5 text-violet-400 shrink-0" />
              <span>{duration} days</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-tvs-charcoal-300">
              <MapPin className="size-3.5 text-violet-400 shrink-0" />
              <span>{ride.chapter}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-tvs-charcoal-300">
              <Users className="size-3.5 text-violet-400 shrink-0" />
              <span>{ride.expectedRiders} riders</span>
            </div>
          </div>

          {/* Route waypoints */}
          {waypoints.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-[9px] uppercase tracking-widest text-tvs-charcoal-500 mb-2.5">
                Route - {ride.routeData?.totalDistanceKm} km
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                {waypoints.map((wp, i) => (
                  <span key={wp.name} className="flex items-center gap-1">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        wp.isStop ? "text-tvs-charcoal-100" : "text-tvs-charcoal-400"
                      )}
                    >
                      {wp.name}
                    </span>
                    {i < waypoints.length - 1 && (
                      <ArrowRight className="size-2.5 text-tvs-charcoal-600 shrink-0" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Itinerary preview */}
          {ride.itinerary.length > 0 && (
            <div className="grid grid-cols-1 gap-1.5">
              {ride.itinerary.slice(0, 3).map((day) => (
                <div key={day.day} className="flex items-start gap-2.5 text-xs">
                  <span className="shrink-0 mt-0.5 flex items-center justify-center size-4 rounded-full bg-violet-900/60 border border-violet-700/40 text-violet-300 font-bold text-[9px]">
                    {day.day}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-tvs-charcoal-200">{day.title}</span>
                    {day.estimatedKm != null && day.estimatedKm > 0 && (
                      <span className="ml-1.5 text-tvs-charcoal-500">{day.estimatedKm} km</span>
                    )}
                  </div>
                </div>
              ))}
              {ride.itinerary.length > 3 && (
                <p className="text-[10px] text-tvs-charcoal-500 pl-6.5">
                  +{ride.itinerary.length - 3} more days →
                </p>
              )}
            </div>
          )}

          {/* Footer: countdown + register */}
          <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            {daysUntil !== null ? (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-2xl font-black tabular-nums",
                    daysUntil <= 30 ? "text-tvs-red-400" : "text-violet-300"
                  )}
                >
                  {daysUntil}
                </span>
                <span className="text-xs text-tvs-charcoal-400 leading-tight">
                  days
                  <br />
                  away
                </span>
              </div>
            ) : (
              <span className="text-xs text-tvs-charcoal-500">Completed</span>
            )}

            <div className="flex items-center gap-2">
              {ride.registrationLink && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(ride.registrationLink!, "_blank", "noopener,noreferrer");
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white transition-colors duration-150"
                >
                  Register
                </button>
              )}
              <span className="flex items-center gap-1 text-xs text-tvs-charcoal-400 group-hover:text-tvs-charcoal-200 transition-colors duration-200">
                Full details
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MarqueeHighlight({ rides, brandLogos }: MarqueeHighlightProps) {
  if (rides.length === 0) return null;

  return (
    // dark-surface re-pins charcoal vars to their dark values in light mode,
    // making this section always render as a premium dark panel regardless of theme.
    <section className="dark-surface bg-tvs-charcoal-950 py-16">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-end justify-between mb-8 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="block w-4 h-px bg-violet-600 rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                Flagship Expeditions
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-tvs-charcoal-50">
              Marquee Rides
            </h2>
            <p className="mt-1.5 text-sm text-tvs-charcoal-400 max-w-md">
              Our flagship expeditions - the highest-tier rides of the year.
            </p>
          </div>
          <span className="shrink-0 text-4xl font-black text-violet-900/40 select-none hidden sm:block">
            ★★
          </span>
        </motion.div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {rides.map((ride, i) => (
            <MarqueeCard key={ride.id} ride={ride} index={i} brandLogos={brandLogos} />
          ))}
        </div>
      </div>
    </section>
  );
}
