// =============================================================================
// ListView - Phase 4 · Chronological list grouped by month
// Shows compact RideCards grouped under month headers
// =============================================================================

import { RideCard } from "@/components/shared/RideCard";
import { cn } from "@/utils/cn";
import { MONTHS, RIDE_TYPES, RIDE_TYPE_STYLES, RIDE_TYPE_STYLE_FALLBACK } from "@/lib/constants";
import { adToBs, BS_MONTHS } from "@/utils/nepali-date";
import { groupRidesByMonth, sortRidesByDate } from "@/utils/ride";
import type { Ride, BrandLogos } from "@/types";
import type { DateMode } from "@/hooks/useDateMode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListViewProps {
  rides:       Ride[];
  year:        number;
  brandLogos?: BrandLogos | null;
  dateMode?:   DateMode;
}

// ---------------------------------------------------------------------------
// Month section
// ---------------------------------------------------------------------------

function MonthSection({ monthKey, rides, brandLogos, dateMode = "ad" }: { monthKey: string; rides: Ride[]; brandLogos?: BrandLogos | null; dateMode?: DateMode }) {
  const [y, m] = monthKey.split("-");
  const monthIndex = parseInt(m, 10) - 1;
  const monthName  = MONTHS[monthIndex] ?? monthKey;

  // BS equivalent for this month's 1st
  const bsFirst = adToBs(`${y}-${m.padStart(2, "0")}-01`);
  const bsLast  = adToBs(`${y}-${m.padStart(2, "0")}-28`);
  const bsLabel = bsFirst.month === bsLast.month
    ? `${bsFirst.year} ${bsFirst.monthName}`
    : `${bsFirst.year} ${bsFirst.monthName} / ${BS_MONTHS[bsLast.month]}`;

  // Count by ride type, keeping only the types actually present this month
  const typeCounts = RIDE_TYPES
    .map((t) => ({
      value: t.value,
      label: t.label,
      count: rides.filter((r) => r.rideType === t.value).length,
    }))
    .filter((t) => t.count > 0);

  return (
    <div className="space-y-3">
      {/* Month header */}
      <div className="flex items-center gap-3 sticky top-[108px] z-30 bg-tvs-charcoal-950/95 backdrop-blur-sm py-2 -mx-3 sm:-mx-6 px-3 sm:px-6 border-b border-tvs-charcoal-800/40">
        <div className="flex flex-col">
          <h2 className="text-base font-black text-tvs-charcoal-50 leading-tight">{monthName}</h2>
          <span className="text-[10px] text-tvs-charcoal-600 leading-tight">{bsLabel}</span>
        </div>
        <span className="text-xs text-tvs-charcoal-500">
          {rides.length} {rides.length === 1 ? "ride" : "rides"}
        </span>
        {/* Ride-type breakdown pills */}
        <div className="flex items-center gap-1.5 ml-auto">
          {typeCounts.map((t) => (
            <span
              key={t.value}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                (RIDE_TYPE_STYLES[t.value] ?? RIDE_TYPE_STYLE_FALLBACK).chip,
              )}
            >
              {t.count} {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Ride cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
        {sortRidesByDate(rides).map((ride) => (
          <RideCard key={ride.id} ride={ride} variant="default" brandLogos={brandLogos} dateMode={dateMode} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ListView - main component
// ---------------------------------------------------------------------------

export function ListView({ rides, year, brandLogos, dateMode = "ad" }: ListViewProps) {
  const grouped   = groupRidesByMonth(rides);
  const monthKeys = Object.keys(grouped).sort();

  if (rides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-4xl">🏍️</span>
        <h3 className="text-lg font-bold text-tvs-charcoal-200">No rides match your filters</h3>
        <p className="text-sm text-tvs-charcoal-500 max-w-xs">
          Adjust the filters above to see rides from other chapters or communities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Summary */}
      <div className="flex items-center gap-3 mb-6">
        <p className="text-sm text-tvs-charcoal-400">
          <span className="text-tvs-charcoal-50 font-bold">{rides.length}</span>{" "}
          {rides.length === 1 ? "ride" : "rides"} across{" "}
          <span className="text-tvs-charcoal-50 font-bold">{monthKeys.length}</span>{" "}
          {monthKeys.length === 1 ? "month" : "months"} in {year}
        </p>
      </div>

      {/* Month sections */}
      {monthKeys.map((key) => (
        <MonthSection
          key={key}
          monthKey={key}
          rides={grouped[key]}
          brandLogos={brandLogos}
          dateMode={dateMode}
        />
      ))}
    </div>
  );
}
