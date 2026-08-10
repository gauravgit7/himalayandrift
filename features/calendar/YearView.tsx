// =============================================================================
// YearView - Phase 4 · 12 mini-month overview
// Server-friendly (no client state) - callbacks from parent CalendarShell
// Shows rides as colored dots per day; click month → month view
// =============================================================================

import { format, parseISO, isToday } from "@/utils/date";
import { getMonthCalendarDays } from "@/utils/date";
import { adToBs } from "@/utils/nepali-date";
import { cn } from "@/utils/cn";
import { MONTHS, SHORT_MONTHS } from "@/lib/constants";
import type { Ride } from "@/types";
import type { DateMode } from "@/hooks/useDateMode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface YearViewProps {
  rides:         Ride[];
  year:          number;
  dateMode?:     DateMode;
  onDayClick:    (month: number) => void;
  onMonthClick:  (month: number) => void;
}

// ---------------------------------------------------------------------------
// Community → dot color
// ---------------------------------------------------------------------------

const DOT_COLOR: Record<string, string> = {
  AOG:      "bg-tvs-red-500",
  CULT:     "bg-tvs-steel-500",
  AOGxCULT: "bg-violet-500",
};

// Status → dot ring (extra visual weight for confirmed/marquee)
const PRIORITY_DOT: Record<string, string> = {
  marquee:  "ring-1 ring-yellow-400/60",
  national: "ring-1 ring-tvs-red-400/40",
  chapter:  "",
  local:    "",
};

// ---------------------------------------------------------------------------
// Build lookup: dateStr → Ride[]
// ---------------------------------------------------------------------------

function buildRideMap(rides: Ride[]): Record<string, Ride[]> {
  const map: Record<string, Ride[]> = {};
  rides.forEach((ride) => {
    // Add ride to every date it spans
    const start = parseISO(ride.startDate);
    const end   = parseISO(ride.endDate);
    // Build each day manually (avoids importing eachDayOfInterval)
    let current = new Date(start);
    while (current <= end) {
      const key = format(current, "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ride);
      current = new Date(current.getTime() + 86400000); // +1 day
    }
  });
  return map;
}

// ---------------------------------------------------------------------------
// Mini month component
// ---------------------------------------------------------------------------

function MiniMonth({
  year,
  monthIndex,
  rideMap,
  onDayClick,
  onMonthClick,
  dateMode = "ad",
}: {
  year:        number;
  monthIndex:  number;
  rideMap:     Record<string, Ride[]>;
  onDayClick:  (month: number) => void;
  onMonthClick: (month: number) => void;
  dateMode?:   DateMode;
}) {
  const days = getMonthCalendarDays(year, monthIndex);
  const isCurrentMonth =
    new Date().getFullYear() === year &&
    new Date().getMonth() === monthIndex;

  return (
    <div className="flex flex-col gap-1">
      {/* Month name */}
      <button
        onClick={() => onMonthClick(monthIndex)}
        className={cn(
          "text-left text-sm font-bold pb-1 hover:text-tvs-red-400 transition-colors duration-150",
          isCurrentMonth ? "text-tvs-red-400" : "text-tvs-charcoal-200"
        )}
      >
        {MONTHS[monthIndex]}
      </button>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-px">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-center text-[9px] font-bold text-tvs-charcoal-600 pb-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const isCurrentMonthDay = day.getMonth() === monthIndex;
          const dateStr           = format(day, "yyyy-MM-dd");
          const ridesOnDay        = rideMap[dateStr] ?? [];
          const hasRides          = ridesOnDay.length > 0;
          const todayFlag         = isToday(day);

          // Collect unique communities on this day (for dots)
          const communities = [...new Set(ridesOnDay.map((r) => r.community))].slice(0, 3);
          const extraRides  = ridesOnDay.length - 3;

          return (
            <button
              key={dateStr}
              onClick={() => hasRides && onDayClick(monthIndex)}
              className={cn(
                "relative flex flex-col items-center gap-[2px] py-0.5 rounded transition-all duration-100",
                isCurrentMonthDay
                  ? hasRides
                    ? "hover:bg-tvs-charcoal-800 cursor-pointer"
                    : "cursor-default"
                  : "opacity-30 cursor-default",
                todayFlag && "ring-1 ring-tvs-red-600/60 bg-tvs-red-950/30"
              )}
              disabled={!hasRides && !todayFlag}
              title={hasRides ? `${ridesOnDay.length} ride${ridesOnDay.length > 1 ? "s" : ""}` : undefined}
            >
              {/* Day number */}
              {(() => {
                const adDay = day.getDate();
                const bsDay = adToBs(dateStr).day;
                const primary   = dateMode === "bs" ? bsDay : adDay;
                const reference = dateMode === "bs" ? adDay  : bsDay;
                return (
                  <span className="flex flex-col items-center leading-none gap-[1px]">
                    <span
                      className={cn(
                        "text-[11px] leading-none font-medium",
                        todayFlag
                          ? "text-tvs-red-400 font-bold"
                          : isCurrentMonthDay
                          ? hasRides
                            ? "text-tvs-charcoal-50"
                            : "text-tvs-charcoal-400"
                          : "text-tvs-charcoal-700"
                      )}
                    >
                      {primary}
                    </span>
                    {isCurrentMonthDay && (
                      <span className="text-[7px] text-tvs-charcoal-700 leading-none">
                        {reference}
                      </span>
                    )}
                  </span>
                );
              })()}

              {/* Ride dots */}
              {hasRides && isCurrentMonthDay && (
                <div className="flex items-center gap-[2px]">
                  {communities.slice(0, 3).map((comm, ci) => {
                    const topRide = ridesOnDay.find((r) => r.community === comm);
                    return (
                      <span
                        key={`${comm}-${ci}`}
                        className={cn(
                          "size-1 rounded-full",
                          DOT_COLOR[comm] ?? "bg-tvs-charcoal-500",
                          topRide ? PRIORITY_DOT[topRide.priority] : ""
                        )}
                      />
                    );
                  })}
                  {extraRides > 0 && (
                    <span className="text-[8px] text-tvs-charcoal-500 leading-none">
                      +{extraRides}
                    </span>
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
// YearView - main component
// ---------------------------------------------------------------------------

export function YearView({ rides, year, dateMode = "ad", onDayClick, onMonthClick }: YearViewProps) {
  const rideMap = buildRideMap(rides);

  // Quick summary bar
  const totalByMonth = Array.from({ length: 12 }, (_, m) => {
    const prefix = `${year}-${String(m + 1).padStart(2, "0")}`;
    return rides.filter(
      (r) => r.startDate.startsWith(prefix)
    ).length;
  });

  return (
    <div className="space-y-8">
      {/* Year overview bar */}
      <div className="grid grid-cols-12 gap-1 h-10 items-end">
        {totalByMonth.map((count, m) => (
          <button
            key={m}
            onClick={() => count > 0 && onMonthClick(m)}
            className={cn(
              "flex flex-col items-center gap-0.5 group",
              count === 0 ? "cursor-default" : "cursor-pointer"
            )}
            title={`${MONTHS[m]}: ${count} rides`}
          >
            <span className="text-[9px] text-tvs-charcoal-600 group-hover:text-tvs-charcoal-400 transition-colors">
              {count > 0 ? count : ""}
            </span>
            <div
              className={cn(
                "w-full rounded-t transition-all duration-200",
                count === 0
                  ? "h-1 bg-tvs-charcoal-800"
                  : "bg-tvs-red-700/70 group-hover:bg-tvs-red-600"
              )}
              style={{ height: count > 0 ? `${Math.max(4, (count / 7) * 32)}px` : "4px" }}
            />
            <span className="text-[8px] text-tvs-charcoal-600">
              {SHORT_MONTHS[m]}
            </span>
          </button>
        ))}
      </div>

      {/* 12-month mini-calendar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth
            key={m}
            year={year}
            monthIndex={m}
            rideMap={rideMap}
            onDayClick={onDayClick}
            onMonthClick={onMonthClick}
            dateMode={dateMode}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-tvs-charcoal-800/50 text-xs text-tvs-charcoal-500">
        <span className="font-medium text-tvs-charcoal-400">Legend:</span>
        {[
          { label: "AOG",      color: "bg-tvs-red-500" },
          { label: "CULT",     color: "bg-tvs-steel-500" },
          { label: "AOG×CULT", color: "bg-violet-500" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", l.color)} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 ml-2">
          <span className="size-2 rounded-full bg-tvs-red-500 ring-1 ring-yellow-400/60" />
          Marquee priority
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded flex items-center justify-center ring-1 ring-tvs-red-600/60 bg-tvs-red-950/30 text-[8px] text-tvs-red-400">•</span>
          Today
        </span>
      </div>
    </div>
  );
}
