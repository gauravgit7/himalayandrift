// =============================================================================
// CalendarToolbar - Phase 4 · Navigation + view switcher + stats row
// Part of the sticky header
// Phase 11 · AD/BS date mode toggle added
// =============================================================================

"use client";

import { ChevronLeft, ChevronRight, Calendar, List, LayoutGrid, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { MONTHS } from "@/lib/constants";
import { adToBs, BS_MONTHS } from "@/utils/nepali-date";
import { DateModeToggle } from "@/components/shared/DateModeToggle";
import type { CalendarView } from "@/types";
import type { RideStats } from "@/utils/ride";
import type { DateMode } from "@/hooks/useDateMode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarToolbarProps {
  view:           CalendarView;
  year:           number;
  month:          number; // 0-11
  onViewChange:   (v: CalendarView) => void;
  onPrevMonth:    () => void;
  onNextMonth:    () => void;
  onPrevYear:     () => void;
  onNextYear:     () => void;
  filteredCount:  number;
  totalCount:     number;
  isFiltered:     boolean;
  stats:          RideStats;
  isLoadingYear?: boolean;
  dateMode:       DateMode;
  onToggleDateMode: () => void;
}

// ---------------------------------------------------------------------------
// View tabs config
// ---------------------------------------------------------------------------

const VIEWS: { id: CalendarView; label: string; icon: React.ReactNode }[] = [
  { id: "year",  label: "Year",  icon: <LayoutGrid className="size-3.5" /> },
  { id: "month", label: "Month", icon: <Calendar    className="size-3.5" /> },
  { id: "list",  label: "List",  icon: <List        className="size-3.5" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarToolbar({
  view,
  year,
  month,
  onViewChange,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  filteredCount,
  totalCount,
  isFiltered,
  stats,
  isLoadingYear = false,
  dateMode,
  onToggleDateMode,
}: CalendarToolbarProps) {

  // Navigation label + handler depend on current view AND date mode.
  // In BS mode: year = BS year, month = BS month (0=Baisakh…11=Chaitra)
  // In AD mode: year = AD year, month = AD month (0=Jan…11=Dec)
  const isMonthView = view === "month";

  const primaryNavLabel = (() => {
    if (dateMode === "bs") {
      return isMonthView ? `${BS_MONTHS[month]} ${year}` : `${year} BS`;
    }
    // AD mode
    return isMonthView ? `${MONTHS[month]} ${year}` : `${year}`;
  })();

  // Reference label shown as small subtext underneath
  const referenceNavLabel = (() => {
    if (dateMode === "bs") {
      // Reference = approximate AD equivalent
      if (isMonthView) {
        // BS month → approx AD month (rough label only)
        return `${year - 56}–${year - 57} AD`;
      }
      return `≈ ${year - 57}–${year - 56} AD`;
    }
    // AD mode — reference = BS equivalent
    if (isMonthView) {
      const pad = String(month + 1).padStart(2, "0");
      const s = adToBs(`${year}-${pad}-01`);
      const e = adToBs(`${year}-${pad}-28`);
      return s.month === e.month ? `${s.year} ${s.monthName} BS` : `${s.year} ${s.monthName}/${e.monthName} BS`;
    }
    const bsS = adToBs(`${year}-01-01`);
    const bsE = adToBs(`${year}-12-31`);
    return bsS.year === bsE.year ? `${bsS.year} BS` : `${bsS.year}–${bsE.year} BS`;
  })();

  const handlePrev = isMonthView ? onPrevMonth : onPrevYear;
  const handleNext = isMonthView ? onNextMonth : onNextYear;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center gap-3 flex-wrap">

        {/* ── Page title ── */}
        <div className="flex items-center gap-2 mr-2">
          <Calendar className="size-5 text-tvs-red-500 shrink-0" />
          <h1 className="text-base font-black text-tvs-charcoal-50 tracking-tight whitespace-nowrap">
            Ride Calendar
          </h1>
        </div>

        {/* ── Year / month navigation ── */}
        <div className="flex items-center gap-1 bg-tvs-charcoal-900 border border-tvs-charcoal-800 rounded-lg overflow-hidden">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-tvs-charcoal-800 text-tvs-charcoal-400 hover:text-tvs-charcoal-50 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="px-3 py-1 flex flex-col items-center min-w-[130px]">
            <span className="text-sm font-bold text-tvs-charcoal-50 tabular-nums leading-tight flex items-center gap-1.5">
              {primaryNavLabel}
              {isLoadingYear && <Loader2 className="size-3 animate-spin text-tvs-red-400" />}
            </span>
            <span className="text-[10px] text-tvs-charcoal-500 tabular-nums leading-tight">
              {referenceNavLabel}
            </span>
          </div>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-tvs-charcoal-800 text-tvs-charcoal-400 hover:text-tvs-charcoal-50 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* ── Date mode toggle (AD / BS) ── */}
        <DateModeToggle mode={dateMode} toggle={onToggleDateMode} size="sm" />

        {/* ── View switcher ── */}
        <div className="flex items-center bg-tvs-charcoal-900 border border-tvs-charcoal-800 rounded-lg overflow-hidden">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors",
                view === v.id
                  ? "bg-tvs-red-600 text-white"
                  : "text-tvs-charcoal-400 hover:text-tvs-charcoal-50 hover:bg-tvs-charcoal-800"
              )}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* ── Ride count / filter status ── */}
        <div className="ml-auto flex items-center gap-3 text-xs text-tvs-charcoal-400">
          {isFiltered ? (
            <span className="font-semibold">
              <span className="text-tvs-red-400">{filteredCount}</span>
              <span className="text-tvs-charcoal-600"> / {totalCount}</span>
              <span className="ml-1">rides</span>
            </span>
          ) : (
            <span>
              <span className="font-bold text-tvs-charcoal-200">{totalCount}</span>
              <span className="ml-1">rides in {year}</span>
            </span>
          )}

          {/* Quick stat pills */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-medium">
              {stats.byStatus.confirmed + stats.completed} done/confirmed
            </span>
            <span className="px-2 py-0.5 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-400 font-medium">
              {stats.marqueeCount} marquee
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
