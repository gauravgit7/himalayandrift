// =============================================================================
// RideCard - reusable ride card used in homepage, calendar list, search results
// Server component - no interactivity, renders from data prop
// =============================================================================

import Link              from "next/link";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
// RideRouteMapClient is 'use client' and handles ssr:false internally
import RideRouteMapClient from "@/components/maps/RideRouteMapClient";
import { cn } from "@/utils/cn";
import { formatRideDateRange, getRideDurationDays } from "@/utils/date";
import { formatBsDateRange } from "@/utils/nepali-date";
import { ROUTES, APP_META } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { SeriesBadge } from "./SeriesBadge";
import type { Ride, BrandLogos } from "@/types";
import type { DateMode } from "@/hooks/useDateMode";

// ---------------------------------------------------------------------------
// Logo overlay - centered in the gradient banner when no photo is uploaded
// ---------------------------------------------------------------------------

function LogoOverlay({ brandLogos }: { brandLogos?: BrandLogos | null }) {
  if (!brandLogos?.logoUrl) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandLogos.logoUrl}
        alt={APP_META.shortName}
        className="h-12 w-auto object-contain opacity-80 max-w-[55%]"
      />
    </div>
  );
}

// Priority → visual accent
const PRIORITY_ACCENT: Record<string, string> = {
  marquee:   "border-violet-700/60  hover:border-violet-500/80",
  signature: "border-hd-ember-800/50 hover:border-hd-ember-600/70",
  standard:  "border-hd-ink-800 hover:border-hd-ink-600",
};

const PRIORITY_TOP_STRIPE: Record<string, string> = {
  marquee:   "bg-gradient-to-r from-violet-600 to-hd-ember-600",
  signature: "bg-hd-ember-600",
  standard:  "bg-hd-ink-700",
};

interface RideCardProps {
  ride: Ride;
  variant?: "default" | "compact" | "featured";
  className?: string;
  /** Brand logos - when provided, shown centered on the gradient banner when no photo uploaded */
  brandLogos?: BrandLogos | null;
  /** Date display mode: "ad" (default) = Gregorian primary, "bs" = Bikram Sambat primary */
  dateMode?: DateMode;
}

export function RideCard({ ride, variant = "default", className, brandLogos, dateMode = "ad" }: RideCardProps) {
  const duration    = getRideDurationDays(ride.startDate, ride.endDate);
  const adDateLabel = formatRideDateRange(ride.startDate, ride.endDate);
  const bsDateLabel = formatBsDateRange(ride.startDate, ride.endDate);
  const isMarquee   = ride.priority === "marquee";

  // Primary = the selected mode; reference = the other one shown as subtext
  const primaryDate   = dateMode === "bs" ? bsDateLabel : adDateLabel;
  const referenceDate = dateMode === "bs" ? adDateLabel : bsDateLabel;

  if (variant === "compact") {
    return (
      <Link
        href={ROUTES.ride(ride.slug)}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg",
          "bg-hd-ink-900 border border-hd-ink-800",
          "hover:bg-hd-ink-800 hover:border-hd-ink-700",
          "transition-all duration-200",
          className
        )}
      >
        {/* Color strip */}
        <div
          className={cn(
            "w-1 self-stretch rounded-full shrink-0",
            PRIORITY_TOP_STRIPE[ride.priority]
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-hd-ink-100 truncate group-hover:text-hd-ink-50">
            {ride.title}
          </p>
          <p className="text-xs text-hd-ink-300 mt-0.5 leading-tight">{primaryDate}</p>
          <p className="text-[10px] text-hd-ink-500 leading-tight">{referenceDate}</p>
        </div>
        <StatusBadge status={ride.status} size="xs" />
      </Link>
    );
  }

  return (
    <Link
      href={ROUTES.ride(ride.slug)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl",
        "gradient-card border transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-card",
        PRIORITY_ACCENT[ride.priority],
        className
      )}
    >
      {/* Top priority stripe (marquee gets gradient, rest gets solid) */}
      <div className={cn("h-0.5 w-full shrink-0", PRIORITY_TOP_STRIPE[ride.priority])} />

      {/* Banner: photo → mini route map → gradient+logo */}
      <div className="dark-surface relative h-36 shrink-0 overflow-hidden bg-hd-ink-800">
        {ride.bannerImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ride.bannerImageUrl}
            alt={ride.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : ride.routeData?.waypoints?.length ? (
          /* Mini route map - non-interactive, pointer-events disabled so card click works */
          <div className="w-full h-full pointer-events-none">
            <RideRouteMapClient
              waypoints={ride.routeData.waypoints}
              totalDistanceKm={ride.routeData.totalDistanceKm}
              className="h-full"
            />
          </div>
        ) : (
          /* Gradient + brand logo */
          <div
            className={cn(
              "relative w-full h-full",
              isMarquee ? "gradient-marquee" : "gradient-brand"
            )}
          >
            <LogoOverlay brandLogos={brandLogos} />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 max-w-[calc(100%-1rem)]">
          {ride.series && (
            <SeriesBadge series={ride.series} volume={ride.volume} size="xs" />
          )}
          {isMarquee && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/60 text-yellow-400 border border-yellow-700/50">
              ★ MARQUEE
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2">
          <StatusBadge status={ride.status} size="xs" />
        </div>

        {/* Duration badge for multi-day */}
        {duration > 1 && (
          <div className="absolute bottom-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-hd-ink-200">
            {duration}D
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3
            className={cn(
              "font-semibold leading-snug line-clamp-2 group-hover:text-hd-ink-50 transition-colors",
              variant === "featured"
                ? "text-base text-hd-ink-50"
                : "text-sm text-hd-ink-100"
            )}
          >
            {ride.title}
          </h3>
          {ride.shortDescription && (
            <p className="text-xs text-hd-ink-400 mt-1 line-clamp-2">
              {ride.shortDescription}
            </p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-hd-ink-300">
          <span className="flex items-center gap-1">
            <Calendar className="size-3 shrink-0 text-hd-ink-400" />
            <span className="flex flex-col leading-tight">
              <span className="text-hd-ink-200">{primaryDate}</span>
              <span className="text-[10px] text-hd-ink-500">{referenceDate}</span>
            </span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3 shrink-0 text-hd-ink-400" />
            {ride.location}
          </span>
          {ride.expectedRiders > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3 shrink-0 text-hd-ink-400" />
              {ride.expectedRiders}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {ride.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-hd-ink-800 text-hd-ink-400 border border-hd-ink-700"
              >
                #{tag}
              </span>
            ))}
          </div>
          <span className="text-hd-ember-500 group-hover:text-hd-ember-400 transition-colors">
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
