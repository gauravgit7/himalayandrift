// =============================================================================
// CalendarShell - Phase 4 · State orchestrator for the full calendar system
// 'use client' - manages view, year/month nav, and filter state
// Phase 11 · Multi-year: fetches rides for new years client-side via /api/rides
// Phase 11b · Full BS calendar: independent BS year/month nav, parallel views
// =============================================================================

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { applyCalendarFilters, sortRidesByDate, computeRideStats } from "@/utils/ride";
import { useDateMode }       from "@/hooks/useDateMode";
import { adYearToBsYear, getBsYearAdRange, adToBs } from "@/utils/nepali-date";
import type { CalendarFilters, CalendarView, Ride } from "@/types";
import { CalendarToolbar }   from "./CalendarToolbar";
import { CalendarFilterBar } from "./CalendarFilterBar";
import { CalendarExportBar } from "./CalendarExportBar";
// AD views
import { YearView }          from "./YearView";
import { MonthView }         from "./MonthView";
import { ListView }          from "./ListView";
// BS views
import { BsYearView }        from "./BsYearView";
import { BsMonthView }       from "./BsMonthView";
import { BsListView }        from "./BsListView";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_YEAR  = new Date().getFullYear();
const DEFAULT_MONTH = new Date().getMonth(); // 0-indexed

const DEFAULT_FILTERS: CalendarFilters = {
  rideType:   "all",
  status:     "all",
  priority:   "all",
  dateRange:  { start: null, end: null },
  searchQuery: "",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CalendarShellProps {
  allRides:    Ride[];
  initialYear: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarShell({ allRides, initialYear }: CalendarShellProps) {
  // ── AD calendar state ─────────────────────────────────────────────────────
  const [view,    setView]    = useState<CalendarView>("year");
  const [adYear,  setAdYear]  = useState(initialYear);
  const [adMonth, setAdMonth] = useState(DEFAULT_MONTH);
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS);

  // ── BS calendar state ─────────────────────────────────────────────────────
  // BS year whose Baisakh 1 falls in initialYear
  const [bsYear,  setBsYear]  = useState(() => adYearToBsYear(initialYear));
  const [bsMonth, setBsMonth] = useState(0); // start at Baisakh

  // ── Date mode (AD / BS) ───────────────────────────────────────────────────
  const { mode: dateMode, toggle: rawToggle } = useDateMode();

  // When toggling AD→BS, sync the BS year to the current AD year;
  // When toggling BS→AD, no sync needed (AD year is independent).
  const handleToggleDateMode = useCallback(() => {
    if (dateMode === "ad") {
      setBsYear(adYearToBsYear(adYear));
      setBsMonth(0);
    }
    rawToggle();
  }, [dateMode, adYear, rawToggle]);

  // ── Multi-AD-year ride cache ───────────────────────────────────────────────
  const [ridesCache, setRidesCache] = useState<Record<number, Ride[]>>(
    () => ({ [initialYear]: allRides })
  );
  const [fetchingYears, setFetchingYears] = useState<Set<number>>(new Set());
  const fetchedYears = useRef<Set<number>>(new Set([initialYear]));

  const ensureAdYear = useCallback((yr: number) => {
    if (fetchedYears.current.has(yr)) return;
    fetchedYears.current.add(yr);
    setFetchingYears((s) => new Set(s).add(yr));
    fetch(`/api/rides?year=${yr}`)
      .then((r) => r.json())
      .then((rides: Ride[]) => setRidesCache((prev) => ({ ...prev, [yr]: rides })))
      .catch(()            => setRidesCache((prev) => ({ ...prev, [yr]: []    })))
      .finally(()          => setFetchingYears((s) => { const n = new Set(s); n.delete(yr); return n; }));
  }, []);

  // AD mode: fetch the active AD year
  useEffect(() => {
    if (dateMode === "ad") ensureAdYear(adYear);
  }, [dateMode, adYear, ensureAdYear]);

  // BS mode: a BS year spans two AD years — fetch both
  useEffect(() => {
    if (dateMode !== "bs") return;
    const { startIso } = getBsYearAdRange(bsYear);
    const adY1 = parseInt(startIso.slice(0, 4), 10);
    const adY2 = adY1 + 1;
    ensureAdYear(adY1);
    ensureAdYear(adY2);
  }, [dateMode, bsYear, ensureAdYear]);

  // ── Derive rides for the active calendar ──────────────────────────────────
  const activeRides = useMemo(() => {
    if (dateMode === "bs") {
      // Merge the two AD years that span this BS year, then filter to BS year
      const { startIso } = getBsYearAdRange(bsYear);
      const adY1 = parseInt(startIso.slice(0, 4), 10);
      const merged = [...(ridesCache[adY1] ?? []), ...(ridesCache[adY1 + 1] ?? [])];
      // Deduplicate by id
      const seen = new Set<string>();
      const deduped = merged.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
      // Keep only rides whose BS start date is in this BS year
      return deduped.filter((r) => adToBs(r.startDate).year === bsYear);
    }
    return ridesCache[adYear] ?? [];
  }, [dateMode, adYear, bsYear, ridesCache]);

  const isLoadingYear = useMemo(() => {
    if (dateMode === "bs") {
      const { startIso } = getBsYearAdRange(bsYear);
      const adY1 = parseInt(startIso.slice(0, 4), 10);
      return fetchingYears.has(adY1) || fetchingYears.has(adY1 + 1);
    }
    return fetchingYears.has(adYear);
  }, [dateMode, adYear, bsYear, fetchingYears]);

  // ── Filtered rides + stats ────────────────────────────────────────────────
  const filteredRides = useMemo(
    () => sortRidesByDate(applyCalendarFilters(activeRides, filters)),
    [activeRides, filters]
  );

  const stats = useMemo(() => computeRideStats(filteredRides), [filteredRides]);

  const isFiltered = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS),
    [filters]
  );

  // ── Filter helpers ────────────────────────────────────────────────────────
  const updateFilter = useCallback(
    <K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }, []
  );
  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // ── AD navigation ─────────────────────────────────────────────────────────
  const prevAdMonth = useCallback(() => {
    if (adMonth === 0) { setAdMonth(11); setAdYear((y) => y - 1); }
    else setAdMonth((m) => m - 1);
  }, [adMonth]);

  const nextAdMonth = useCallback(() => {
    if (adMonth === 11) { setAdMonth(0); setAdYear((y) => y + 1); }
    else setAdMonth((m) => m + 1);
  }, [adMonth]);

  const jumpToAdMonth = useCallback((m: number) => {
    setAdMonth(m); setView("month");
  }, []);

  // ── BS navigation ─────────────────────────────────────────────────────────
  const prevBsMonth = useCallback(() => {
    if (bsMonth === 0) { setBsMonth(11); setBsYear((y) => y - 1); }
    else setBsMonth((m) => m - 1);
  }, [bsMonth]);

  const nextBsMonth = useCallback(() => {
    if (bsMonth === 11) { setBsMonth(0); setBsYear((y) => y + 1); }
    else setBsMonth((m) => m + 1);
  }, [bsMonth]);

  const jumpToBsMonth = useCallback((m: number) => {
    setBsMonth(m); setView("month");
  }, []);

  // ── Unified navigation props (passed to toolbar) ──────────────────────────
  const navProps = dateMode === "bs"
    ? {
        year:       bsYear,
        month:      bsMonth,
        onPrevYear:  () => setBsYear((y) => y - 1),
        onNextYear:  () => setBsYear((y) => y + 1),
        onPrevMonth: prevBsMonth,
        onNextMonth: nextBsMonth,
      }
    : {
        year:       adYear,
        month:      adMonth,
        onPrevYear:  () => setAdYear((y) => y - 1),
        onNextYear:  () => setAdYear((y) => y + 1),
        onPrevMonth: prevAdMonth,
        onNextMonth: nextAdMonth,
      };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-dvh pt-16 bg-hd-ink-950">

      {/* ── Sticky toolbar ── */}
      <div className="sticky top-16 z-40 bg-hd-ink-950/95 backdrop-blur-md border-b border-hd-ink-800/60">
        <CalendarToolbar
          view={view}
          year={navProps.year}
          month={navProps.month}
          onViewChange={setView}
          onPrevMonth={navProps.onPrevMonth}
          onNextMonth={navProps.onNextMonth}
          onPrevYear={navProps.onPrevYear}
          onNextYear={navProps.onNextYear}
          filteredCount={filteredRides.length}
          totalCount={activeRides.length}
          isFiltered={isFiltered}
          stats={stats}
          isLoadingYear={isLoadingYear}
          dateMode={dateMode}
          onToggleDateMode={handleToggleDateMode}
        />
        <CalendarFilterBar
          filters={filters}
          onUpdate={updateFilter}
          onClear={clearFilters}
          isFiltered={isFiltered}
        />
      </div>

      {/* ── Calendar views ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {isLoadingYear ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-hd-ink-500">
            <div className="size-10 border-2 border-hd-ember-600/40 border-t-hd-ember-500 rounded-full animate-spin" />
            <p className="text-sm">
              Loading {dateMode === "bs" ? `${bsYear} BS` : adYear} rides…
            </p>
          </div>
        ) : dateMode === "bs" ? (
          /* ── BS views ── */
          <>
            {view === "year" && (
              <BsYearView
                rides={filteredRides}
                bsYear={bsYear}
                onMonthClick={jumpToBsMonth}
              />
            )}
            {view === "month" && (
              <BsMonthView
                rides={filteredRides}
                bsYear={bsYear}
                bsMonth={bsMonth}
              />
            )}
            {view === "list" && (
              <BsListView
                rides={filteredRides}
                bsYear={bsYear}
              />
            )}
          </>
        ) : (
          /* ── AD views ── */
          <>
            {view === "year" && (
              <YearView
                rides={filteredRides}
                year={adYear}
                dateMode={dateMode}
                onDayClick={jumpToAdMonth}
                onMonthClick={jumpToAdMonth}
              />
            )}
            {view === "month" && (
              <MonthView
                rides={filteredRides}
                year={adYear}
                month={adMonth}
                dateMode={dateMode}
              />
            )}
            {view === "list" && (
              <ListView
                rides={filteredRides}
                year={adYear}
                dateMode={dateMode}
              />
            )}
          </>
        )}
      </main>

      {/* ── Export bar ── */}
      <CalendarExportBar year={dateMode === "bs" ? bsYear : adYear} />
    </div>
  );
}
