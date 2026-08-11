// =============================================================================
// MonthView - Phase 4 · Full monthly calendar grid
// Shows ride chips per day - multi-day rides on all their days
// Click chip → navigate to ride detail
// =============================================================================

import Link from "next/link";
import { format, parseISO, isToday } from "@/utils/date";
import { getMonthCalendarDays, getRideDurationDays } from "@/utils/date";
import { adToBs } from "@/utils/nepali-date";
import { cn } from "@/utils/cn";
import { ROUTES, MONTHS, RIDE_TYPE_STYLES, RIDE_TYPE_STYLE_FALLBACK } from "@/lib/constants";
import type { Ride } from "@/types";
import type { DateMode } from "@/hooks/useDateMode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthViewProps {
  rides:     Ride[];
  year:      number;
  month:     number; // 0-11
  dateMode?: DateMode;
}

// ---------------------------------------------------------------------------
// Ride-type chip styles
// ---------------------------------------------------------------------------

const CHIP_BASE = "block w-full text-left px-1.5 py-0.5 rounded text-[11px] truncate border-l-2 leading-snug";

// Status dot
const STATUS_DOT: Record<string, string> = {
  planned:   "bg-hd-ink-500",
  tentative: "bg-amber-500",
  confirmed: "bg-emerald-500",
  postponed: "bg-hd-ember-400",
  cancelled: "bg-hd-ember-900",
  completed: "bg-hd-slate-600",
};

// ---------------------------------------------------------------------------
// Build per-day ride map (rides appear on every day they span)
// ---------------------------------------------------------------------------

function buildDayMap(rides: Ride[]): Record<string, Ride[]> {
  const map: Record<string, Ride[]> = {};
  rides.forEach((ride) => {
    let current = new Date(parseISO(ride.startDate));
    const end   = new Date(parseISO(ride.endDate));
    while (current <= end) {
      const key = format(current, "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ride);
      current = new Date(current.getTime() + 86400000);
    }
  });
  return map;
}

// ---------------------------------------------------------------------------
// Ride chip - shown inside a day cell
// ---------------------------------------------------------------------------

function RideChip({ ride, dateStr }: { ride: Ride; dateStr: string }) {
  const isStart    = ride.startDate === dateStr;
  const duration   = getRideDurationDays(ride.startDate, ride.endDate);
  const isMultiDay = duration > 1;
  const typeStyle  = RIDE_TYPE_STYLES[ride.rideType] ?? RIDE_TYPE_STYLE_FALLBACK;

  if (!isStart) {
    // Continuation bar - thin, no text
    return (
      <div
        className={cn(
          "w-full h-4 rounded-sm border-l-2 opacity-60",
          typeStyle.continuation
        )}
        title={`${ride.title} (day ${
          Math.floor(
            (new Date(dateStr).getTime() - new Date(ride.startDate).getTime()) / 86400000
          ) + 1
        })`}
      />
    );
  }

  return (
    <Link
      href={ROUTES.ride(ride.slug)}
      className={cn(
        CHIP_BASE,
        typeStyle.chip,
        "transition-colors duration-150 group"
      )}
      title={ride.title}
    >
      <span className="flex items-center gap-1">
        {/* Status dot */}
        <span
          className={cn(
            "shrink-0 size-1.5 rounded-full",
            STATUS_DOT[ride.status] ?? "bg-hd-ink-500"
          )}
        />
        <span className="flex-1 truncate">{ride.title}</span>
        {/* Multi-day indicator */}
        {isMultiDay && (
          <span className="shrink-0 text-[9px] opacity-70">
            {duration}d
          </span>
        )}
        {/* Marquee star */}
        {ride.rideType === "marquee" && (
          <span className="shrink-0 text-yellow-400 text-[9px]">★</span>
        )}
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Day cell
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 3; // max ride chips before "+N more"

function DayCell({
  day,
  isCurrentMonth,
  dateStr,
  rides,
  dateMode = "ad",
}: {
  day:             Date;
  isCurrentMonth:  boolean;
  dateStr:         string;
  rides:           Ride[];
  dateMode?:       DateMode;
}) {
  const todayFlag  = isToday(day);
  const dayNum     = day.getDate();
  const visible    = rides.slice(0, MAX_VISIBLE);
  const overflow   = rides.length - MAX_VISIBLE;
  const bs         = adToBs(dateStr);

  const primaryDay   = dateMode === "bs" ? bs.day   : dayNum;
  const referenceDay = dateMode === "bs" ? dayNum   : bs.day;

  return (
    <div
      className={cn(
        "relative min-h-[80px] sm:min-h-[96px] p-1 sm:p-1.5 border-b border-r border-hd-ink-800/50",
        isCurrentMonth ? "bg-transparent" : "bg-hd-ink-900/30",
      )}
    >
      {/* Day numbers: primary (large) + reference (tiny) */}
      <div className="flex flex-col items-start mb-1">
        <span
          className={cn(
            "inline-flex items-center justify-center text-xs font-semibold w-6 h-6 rounded-full transition-colors",
            todayFlag
              ? "bg-hd-ember-600 text-white font-bold"
              : isCurrentMonth
              ? "text-hd-ink-200 hover:text-hd-ink-50"
              : "text-hd-ink-700"
          )}
        >
          {primaryDay}
        </span>
        <span className={cn(
          "text-[9px] leading-none ml-0.5",
          isCurrentMonth ? "text-hd-ink-500" : "text-hd-ink-800"
        )}>
          {referenceDay}
        </span>
      </div>

      {/* Ride chips */}
      <div className="flex flex-col gap-0.5">
        {visible.map((ride) => (
          <RideChip key={`${ride.id}-${dateStr}`} ride={ride} dateStr={dateStr} />
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-hd-ink-500 pl-1">
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MonthView - main component
// ---------------------------------------------------------------------------

export function MonthView({ rides, year, month, dateMode = "ad" }: MonthViewProps) {
  const dayMap = buildDayMap(rides);
  const days   = getMonthCalendarDays(year, month);

  // Group days into week rows (always 7 cells per row)
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthRideCount = rides.filter((r) =>
    r.startDate.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)
  ).length;

  return (
    <div className="space-y-4">
      {/* Month header */}
      {(() => {
        const pad    = String(month + 1).padStart(2, "0");
        const bsS    = adToBs(`${year}-${pad}-01`);
        const bsE    = adToBs(`${year}-${pad}-28`);
        const bsLabel = bsS.month === bsE.month
          ? `${bsS.year} ${bsS.monthName}`
          : `${bsS.year} ${bsS.monthName} / ${bsE.monthName}`;
        const adLabel = `${MONTHS[month]} ${year}`;
        const primaryLabel   = dateMode === "bs" ? bsLabel : adLabel;
        const referenceLabel = dateMode === "bs" ? adLabel  : bsLabel;
        return (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-hd-ink-50">
            {primaryLabel}
          </h2>
          <p className="text-xs text-hd-ink-500 mt-0.5">{referenceLabel}</p>
        </div>
        <span className="text-sm text-hd-ink-400">
          {monthRideCount} {monthRideCount === 1 ? "ride" : "rides"} this month
        </span>
      </div>
        );
      })()}

      {/* Calendar grid */}
      <div className="rounded-xl overflow-hidden border border-hd-ink-800/50">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-hd-ink-800/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-bold text-hd-ink-500 uppercase tracking-wide bg-hd-ink-900/50"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = day.getMonth() === month;
              return (
                <DayCell
                  key={dateStr}
                  day={day}
                  isCurrentMonth={isCurrentMonth}
                  dateStr={dateStr}
                  rides={isCurrentMonth ? (dayMap[dateStr] ?? []) : []}
                  dateMode={dateMode}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-hd-ink-500">
        {[
          { label: "Planned",   dot: "bg-hd-ink-500" },
          { label: "Tentative", dot: "bg-amber-500" },
          { label: "Confirmed", dot: "bg-emerald-500" },
          { label: "Postponed", dot: "bg-hd-ember-400" },
          { label: "Completed", dot: "bg-hd-slate-600" },
        ].map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
