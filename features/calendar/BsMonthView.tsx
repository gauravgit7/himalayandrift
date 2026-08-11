// =============================================================================
// BsMonthView — full Bikram Sambat month calendar grid
// Primary: BS day numbers   Reference: AD day number (tiny)
// Ride chips placed on the BS date the ride starts/spans
// =============================================================================

import Link from "next/link";
import {
  getBsMonthCalendarDays,
  getBsMonthDays,
  BS_MONTHS,
  adToBs,
} from "@/utils/nepali-date";
import { formatBsDateRange } from "@/utils/nepali-date";
import { formatRideDateRange } from "@/utils/date";
import { cn } from "@/utils/cn";
import { ROUTES, RIDE_TYPE_STYLES, RIDE_TYPE_STYLE_FALLBACK } from "@/lib/constants";
import type { Ride } from "@/types";

// ---------------------------------------------------------------------------
// Ride-type chip styles (same palette as AD MonthView)
// ---------------------------------------------------------------------------

const CHIP_BASE = "block w-full text-left px-1.5 py-0.5 rounded text-[11px] truncate border-l-2 leading-snug";

const STATUS_DOT: Record<string, string> = {
  planned:   "bg-hd-ink-500",
  tentative: "bg-amber-500",
  confirmed: "bg-emerald-500",
  postponed: "bg-hd-ember-400",
  cancelled: "bg-hd-ember-900",
  completed: "bg-hd-slate-600",
};

// ---------------------------------------------------------------------------
// Build ride map keyed by AD date string (same as rides use)
// ---------------------------------------------------------------------------

function buildDayMap(rides: Ride[]): Record<string, Ride[]> {
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
// Ride chip
// ---------------------------------------------------------------------------

function RideChip({ ride, dateStr }: { ride: Ride; dateStr: string }) {
  const isStart   = ride.startDate === dateStr;
  const typeStyle = RIDE_TYPE_STYLES[ride.rideType] ?? RIDE_TYPE_STYLE_FALLBACK;

  if (!isStart) {
    return (
      <div
        className={cn("w-full h-4 rounded-sm border-l-2 opacity-60", typeStyle.continuation)}
        title={ride.title}
      />
    );
  }

  const durationMs   = new Date(ride.endDate).getTime() - new Date(ride.startDate).getTime();
  const durationDays = Math.round(durationMs / 86400000) + 1;
  const isMultiDay   = durationDays > 1;

  return (
    <Link
      href={ROUTES.ride(ride.slug)}
      className={cn(CHIP_BASE, typeStyle.chip, "transition-colors duration-150")}
      title={ride.title}
    >
      <span className="flex items-center gap-1">
        <span className={cn("shrink-0 size-1.5 rounded-full", STATUS_DOT[ride.status] ?? "bg-hd-ink-500")} />
        <span className="flex-1 truncate">{ride.title}</span>
        {isMultiDay && <span className="shrink-0 text-[9px] opacity-70">{durationDays}d</span>}
        {ride.rideType === "marquee" && <span className="shrink-0 text-yellow-400 text-[9px]">★</span>}
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Day cell
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 3;

function DayCell({
  bsDay,
  adDateStr,
  isCurrentMonth,
  rides,
}: {
  bsDay:          number;
  adDateStr:      string;
  isCurrentMonth: boolean;
  rides:          Ride[];
}) {
  const todayAdStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  })();
  const isToday  = adDateStr === todayAdStr;
  const adDayNum = parseInt(adDateStr.split("-")[2], 10);
  const visible  = rides.slice(0, MAX_VISIBLE);
  const overflow = rides.length - MAX_VISIBLE;

  return (
    <div className={cn(
      "relative min-h-[80px] sm:min-h-[96px] p-1 sm:p-1.5 border-b border-r border-hd-ink-800/50",
      isCurrentMonth ? "bg-transparent" : "bg-hd-ink-900/30",
    )}>
      {/* BS day (primary, large circle) + AD day (tiny reference) */}
      <div className="flex flex-col items-start mb-1">
        <span className={cn(
          "inline-flex items-center justify-center text-xs font-semibold w-6 h-6 rounded-full transition-colors",
          isToday
            ? "bg-hd-ember-600 text-white font-bold"
            : isCurrentMonth
            ? "text-hd-ink-200 hover:text-hd-ink-50"
            : "text-hd-ink-700"
        )}>
          {bsDay}
        </span>
        {/* AD reference day */}
        <span className={cn(
          "text-[9px] leading-none ml-0.5",
          isCurrentMonth ? "text-hd-ink-500" : "text-hd-ink-800"
        )}>
          {adDayNum}
        </span>
      </div>

      {/* Ride chips */}
      <div className="flex flex-col gap-0.5">
        {visible.map((ride) => (
          <RideChip key={`${ride.id}-${adDateStr}`} ride={ride} dateStr={adDateStr} />
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-hd-ink-500 pl-1">+{overflow} more</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BsMonthView — main export
// ---------------------------------------------------------------------------

interface BsMonthViewProps {
  rides:     Ride[];
  bsYear:    number;
  bsMonth:   number; // 0-indexed (0=Baisakh … 11=Chaitra)
}

export function BsMonthView({ rides, bsYear, bsMonth }: BsMonthViewProps) {
  const days    = getBsMonthCalendarDays(bsYear, bsMonth);
  const dayMap  = buildDayMap(rides);
  const total   = getBsMonthDays(bsYear, bsMonth);

  // Rides starting in this BS month
  const monthRideCount = rides.filter((r) => {
    const bs = adToBs(r.startDate);
    return bs.year === bsYear && bs.month === bsMonth;
  }).length;

  // Group days into weeks
  const weeks: typeof days[number][][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthName = BS_MONTHS[bsMonth] ?? "";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-hd-ink-50">
            {monthName} <span className="text-hd-ink-500">{bsYear}</span>
          </h2>
          <p className="text-xs text-hd-ink-500 mt-0.5">
            {total} days · Bikram Sambat
          </p>
        </div>
        <span className="text-sm text-hd-ink-400">
          {monthRideCount} {monthRideCount === 1 ? "ride" : "rides"} this month
        </span>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl overflow-hidden border border-hd-ink-800/50">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-hd-ink-800/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-bold text-hd-ink-500 uppercase tracking-wide bg-hd-ink-900/50">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((cell) => (
              <DayCell
                key={cell.adDateStr}
                bsDay={cell.bsDay}
                adDateStr={cell.adDateStr}
                isCurrentMonth={cell.isCurrentMonth}
                rides={cell.isCurrentMonth ? (dayMap[cell.adDateStr] ?? []) : []}
              />
            ))}
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
            <span className={cn("size-2 rounded-full shrink-0", s.dot)} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-hd-ink-700">
          Large # = BS day · small # = AD day
        </span>
      </div>
    </div>
  );
}
