// =============================================================================
// UpcomingRidesSection - Phase 3 · Grid of next upcoming rides
// Phase 9 · Staggered entrance via AnimateIn / StaggerContainer / StaggerItem
// Phase 11 · AD/BS date mode toggle
// =============================================================================

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RideCard }          from "@/components/shared/RideCard";
import { DateModeToggle }    from "@/components/shared/DateModeToggle";
import { useDateMode }       from "@/hooks/useDateMode";
import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
}                            from "@/components/shared/AnimateIn";
import { ROUTES }            from "@/lib/constants";
import { DEFAULT_CALENDAR_YEAR } from "@/lib/constants";
import type { Ride, BrandLogos } from "@/types";

interface UpcomingRidesSectionProps {
  rides:      Ride[];
  brandLogos?: BrandLogos | null;
}

export function UpcomingRidesSection({ rides, brandLogos }: UpcomingRidesSectionProps) {
  const { mode: dateMode, toggle } = useDateMode();

  if (rides.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section header */}
      <AnimateIn className="flex items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="block w-4 h-px bg-tvs-red-600 rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-400">
              What&apos;s Coming
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-tvs-charcoal-50">
            Upcoming Rides
          </h2>
          <p className="mt-1.5 text-sm text-tvs-charcoal-400">
            Next rides across all 9 chapters and communities.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <DateModeToggle mode={dateMode} toggle={toggle} size="sm" />
          <Link
            href={ROUTES.calendar}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-tvs-charcoal-400 hover:text-tvs-red-400 transition-colors duration-200"
          >
            Full calendar
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </AnimateIn>

      {/* Rides grid - stagger each card */}
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rides.map((ride) => (
          // h-full on both item and card keeps equal-height rows in the grid
          <StaggerItem key={ride.id} className="h-full">
            <RideCard ride={ride} variant="default" className="h-full" brandLogos={brandLogos} dateMode={dateMode} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Bottom CTA */}
      <AnimateIn className="mt-8 text-center" delay={0.1}>
        <Link
          href={ROUTES.calendar}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-200 hover:text-tvs-charcoal-50 font-semibold text-sm transition-all duration-200"
        >
          See all {DEFAULT_CALENDAR_YEAR} rides
          <ArrowRight className="size-4" />
        </Link>
      </AnimateIn>
    </section>
  );
}
