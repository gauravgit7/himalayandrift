// =============================================================================
// BsListView - Bikram Sambat list view: rides grouped by BS month
// Used when dateMode === "bs" — months are Baisakh → Chaitra
// =============================================================================

import { RideCard }          from "@/components/shared/RideCard";
import { sortRidesByDate }   from "@/utils/ride";
import { adToBs, BS_MONTHS } from "@/utils/nepali-date";
import { formatRideDateRange } from "@/utils/date";
import { cn } from "@/utils/cn";
import { RIDE_TYPES, RIDE_TYPE_STYLES, RIDE_TYPE_STYLE_FALLBACK } from "@/lib/constants";
import type { Ride, BrandLogos } from "@/types";

// ---------------------------------------------------------------------------
// Group rides by BS month within a specific BS year
// ---------------------------------------------------------------------------

function groupByBsMonth(rides: Ride[], bsYear: number): Record<number, Ride[]> {
  const grouped: Record<number, Ride[]> = {};
  for (let m = 0; m < 12; m++) grouped[m] = [];

  rides.forEach((ride) => {
    const bs = adToBs(ride.startDate);
    if (bs.year === bsYear) {
      grouped[bs.month].push(ride);
    }
  });

  return grouped;
}

// ---------------------------------------------------------------------------
// BS Month section
// ---------------------------------------------------------------------------

function BsMonthSection({
  bsYear,
  bsMonth,
  rides,
  brandLogos,
}: {
  bsYear:      number;
  bsMonth:     number;
  rides:       Ride[];
  brandLogos?: BrandLogos | null;
}) {
  const monthName = BS_MONTHS[bsMonth] ?? "";

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
      {/* Sticky month header */}
      <div className="flex items-center gap-3 sticky top-[108px] z-30 bg-hd-ink-950/95 backdrop-blur-sm py-2 -mx-3 sm:-mx-6 px-3 sm:px-6 border-b border-hd-ink-800/40">
        <div className="flex flex-col">
          <h2 className="text-base font-black text-hd-ink-50 leading-tight">
            {monthName}
          </h2>
          <span className="text-[10px] text-hd-ink-500 leading-tight">
            {bsYear} BS
          </span>
        </div>
        <span className="text-xs text-hd-ink-500">
          {rides.length} {rides.length === 1 ? "ride" : "rides"}
        </span>
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
      {rides.length === 0 ? (
        <p className="text-xs text-hd-ink-700 italic pl-1 pb-4">
          No rides in {monthName} {bsYear}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
          {sortRidesByDate(rides).map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              variant="default"
              brandLogos={brandLogos}
              dateMode="bs"
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BsListView — main export
// ---------------------------------------------------------------------------

interface BsListViewProps {
  rides:       Ride[];
  bsYear:      number;
  brandLogos?: BrandLogos | null;
}

export function BsListView({ rides, bsYear, brandLogos }: BsListViewProps) {
  const grouped    = groupByBsMonth(rides, bsYear);
  const monthsWithRides = Object.values(grouped).filter((r) => r.length > 0).length;

  if (rides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-4xl">🏍️</span>
        <h3 className="text-lg font-bold text-hd-ink-200">No rides this BS year</h3>
        <p className="text-sm text-hd-ink-500 max-w-xs">
          No rides scheduled for {bsYear} BS. Try navigating to a different year.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Summary */}
      <div className="flex items-center gap-3 mb-6">
        <p className="text-sm text-hd-ink-400">
          <span className="text-hd-ink-50 font-bold">{rides.length}</span>{" "}
          {rides.length === 1 ? "ride" : "rides"} across{" "}
          <span className="text-hd-ink-50 font-bold">{monthsWithRides}</span>{" "}
          {monthsWithRides === 1 ? "month" : "months"} in{" "}
          <span className="text-hd-ink-50 font-bold">{bsYear} BS</span>
        </p>
      </div>

      {/* One section per BS month (Baisakh → Chaitra) */}
      {Array.from({ length: 12 }, (_, m) => (
        <BsMonthSection
          key={m}
          bsYear={bsYear}
          bsMonth={m}
          rides={grouped[m]}
          brandLogos={brandLogos}
        />
      ))}
    </div>
  );
}
