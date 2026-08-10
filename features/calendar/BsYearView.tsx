// =============================================================================
// BsYearView — 12 BS mini-month overview for a Bikram Sambat year
// Mirrors the structure of YearView.tsx but uses BS calendar logic
// =============================================================================

import {
  getBsMonthCalendarDays,
  getBsMonthDays,
  BS_MONTHS,
  SHORT_BS_MONTHS,
  adToBs,
} from "@/utils/nepali-date";
import { cn } from "@/utils/cn";
import { RIDE_TYPE_STYLES, RIDE_TYPE_STYLE_FALLBACK } from "@/lib/constants";
import type { Ride } from "@/types";

// ---------------------------------------------------------------------------
// Priority → dot ring (same as YearView)
// ---------------------------------------------------------------------------

const PRIORITY_DOT: Record<string, string> = {
  marquee:   "ring-1 ring-yellow-400/60",
  signature: "ring-1 ring-tvs-red-400/40",
  standard:  "",
};

// ---------------------------------------------------------------------------
// Build ride lookup keyed by AD date string
// ---------------------------------------------------------------------------

function buildRideMap(rides: Ride[]): Record<string, Ride[]> {
  const map: Record<string, Ride[]> = {};
  rides.forEach((ride) => {
    let current = new Date(ride.startDate + "T00:00:00");
    const end   = new Date(ride.endDate   + "T00:00:00");
    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,"0")}-${String(current.getDate()).padStart(2,"0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(ride);
      current = new Date(current.getTime() + 86400000);
    }
  });
  return map;
}

// ---------------------------------------------------------------------------
// Today's AD date string (computed once)
// ---------------------------------------------------------------------------

function todayIso(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
}

// ---------------------------------------------------------------------------
// Mini BS month grid
// ---------------------------------------------------------------------------

function BsMiniMonth({
  bsYear,
  bsMonth,
  rideMap,
  onDayClick,
  onMonthClick,
}: {
  bsYear:       number;
  bsMonth:      number;
  rideMap:      Record<string, Ride[]>;
  onDayClick:   (month: number) => void;
  onMonthClick: (month: number) => void;
}) {
  const days     = getBsMonthCalendarDays(bsYear, bsMonth);
  const today    = todayIso();
  const todayBS  = adToBs(today);
  const isCurrentBsMonth =
    todayBS.year === bsYear && todayBS.month === bsMonth;

  return (
    <div className="flex flex-col gap-1">
      {/* Month name button */}
      <button
        onClick={() => onMonthClick(bsMonth)}
        className={cn(
          "text-left text-sm font-bold pb-1 hover:text-tvs-red-400 transition-colors duration-150",
          isCurrentBsMonth ? "text-tvs-red-400" : "text-tvs-charcoal-200"
        )}
      >
        {BS_MONTHS[bsMonth]}
      </button>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-px">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[9px] font-bold text-tvs-charcoal-600 pb-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((cell) => {
          const ridesOnDay  = rideMap[cell.adDateStr] ?? [];
          const hasRides    = ridesOnDay.length > 0 && cell.isCurrentMonth;
          const isToday     = cell.adDateStr === today;
          const rideTypes   = [...new Set(ridesOnDay.map((r) => r.rideType))].slice(0, 3);
          const extra       = ridesOnDay.length - 3;

          return (
            <button
              key={cell.adDateStr}
              onClick={() => hasRides && onDayClick(bsMonth)}
              disabled={!hasRides && !isToday}
              className={cn(
                "relative flex flex-col items-center gap-[2px] py-0.5 rounded transition-all duration-100",
                cell.isCurrentMonth
                  ? hasRides
                    ? "hover:bg-tvs-charcoal-800 cursor-pointer"
                    : "cursor-default"
                  : "opacity-30 cursor-default",
                isToday && "ring-1 ring-tvs-red-600/60 bg-tvs-red-950/30"
              )}
              title={hasRides ? `${ridesOnDay.length} ride${ridesOnDay.length > 1 ? "s" : ""}` : undefined}
            >
              {/* BS day number (primary) */}
              <span className={cn(
                "text-[11px] leading-none font-medium",
                isToday
                  ? "text-tvs-red-400 font-bold"
                  : cell.isCurrentMonth
                  ? hasRides ? "text-tvs-charcoal-50" : "text-tvs-charcoal-400"
                  : "text-tvs-charcoal-700"
              )}>
                {cell.bsDay}
              </span>

              {/* Ride dots */}
              {hasRides && (
                <div className="flex items-center gap-[2px]">
                  {rideTypes.map((type, ci) => {
                    const topRide = ridesOnDay.find((r) => r.rideType === type);
                    return (
                      <span
                        key={`${type}-${ci}`}
                        className={cn(
                          "size-1 rounded-full",
                          (RIDE_TYPE_STYLES[type] ?? RIDE_TYPE_STYLE_FALLBACK).dot,
                          topRide ? PRIORITY_DOT[topRide.priority] : ""
                        )}
                      />
                    );
                  })}
                  {extra > 0 && (
                    <span className="text-[8px] text-tvs-charcoal-500 leading-none">+{extra}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BsYearView — main export
// ---------------------------------------------------------------------------

interface BsYearViewProps {
  rides:        Ride[];
  bsYear:       number;
  onMonthClick: (bsMonth: number) => void;
}

export function BsYearView({ rides, bsYear, onMonthClick }: BsYearViewProps) {
  const rideMap = buildRideMap(rides);

  // Per-BS-month ride count for the overview bar
  const totalByMonth = Array.from({ length: 12 }, (_, m) =>
    rides.filter((r) => {
      const bs = adToBs(r.startDate);
      return bs.year === bsYear && bs.month === m;
    }).length
  );

  return (
    <div className="space-y-8">
      {/* Overview bar: rides per BS month */}
      <div className="grid grid-cols-12 gap-1 h-10 items-end">
        {totalByMonth.map((count, m) => (
          <button
            key={m}
            onClick={() => count > 0 && onMonthClick(m)}
            className={cn(
              "flex flex-col items-center gap-0.5 group",
              count === 0 ? "cursor-default" : "cursor-pointer"
            )}
            title={`${BS_MONTHS[m]}: ${count} rides`}
          >
            <span className="text-[9px] text-tvs-charcoal-600 group-hover:text-tvs-charcoal-400 transition-colors">
              {count > 0 ? count : ""}
            </span>
            <div
              className={cn(
                "w-full rounded-sm transition-all duration-200",
                count > 0
                  ? "bg-tvs-red-600/60 group-hover:bg-tvs-red-500"
                  : "bg-tvs-charcoal-800/40"
              )}
              style={{ height: count > 0 ? `${Math.max(4, Math.min(32, count * 6))}px` : "4px" }}
            />
            <span className="text-[9px] text-tvs-charcoal-600 truncate w-full text-center leading-none">
              {SHORT_BS_MONTHS[m]}
            </span>
          </button>
        ))}
      </div>

      {/* 12 mini-month grids */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8">
        {Array.from({ length: 12 }, (_, m) => (
          <BsMiniMonth
            key={m}
            bsYear={bsYear}
            bsMonth={m}
            rideMap={rideMap}
            onDayClick={onMonthClick}
            onMonthClick={onMonthClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-tvs-charcoal-800/50 text-xs text-tvs-charcoal-500">
        <span className="font-medium text-tvs-charcoal-400">Legend:</span>
        {Object.values(RIDE_TYPE_STYLES).map((style) => (
          <span key={style.label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", style.dot)} />
            {style.label}
          </span>
        ))}
        <span className="ml-auto text-tvs-charcoal-700">
          Numbers show Bikram Sambat dates
        </span>
      </div>
    </div>
  );
}
