// =============================================================================
// RidesFilterList - client-side filterable ride grid for the public /rides page
// 'use client' - filter state
// =============================================================================

"use client";

import { useState, useMemo }     from "react";
import Link                      from "next/link";
import { Search, ArrowRight, SlidersHorizontal } from "lucide-react";
import { RideCard }              from "@/components/shared/RideCard";
import { DateModeToggle }        from "@/components/shared/DateModeToggle";
import { AnimateIn }             from "@/components/shared/AnimateIn";
import { useDateMode }           from "@/hooks/useDateMode";
import { cn }                    from "@/utils/cn";
import { rideIsUpcoming }        from "@/utils/date";
import { ROUTES, RIDE_TYPES }    from "@/lib/constants";
import type { Ride, RideType, BrandLogos, Series } from "@/types";

interface RidesFilterListProps {
  allRides:    Ride[];
  series:      Series[];
  brandLogos?: BrandLogos | null;
}

type TypeFilter      = RideType  | "all";
type StatusFilter    = "upcoming" | "completed" | "all";

const TYPE_OPTS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  ...RIDE_TYPES.map((t) => ({ value: t.value as TypeFilter, label: t.label })),
];

const STATUS_OPTS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "upcoming",  label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

function FilterChip<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
            value === opt.value
              ? "bg-hd-ember-600 text-white"
              : "bg-hd-ink-800 border border-hd-ink-700 text-hd-ink-400 hover:text-hd-ink-100 hover:border-hd-ink-500"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function RidesFilterList({ allRides, series, brandLogos }: RidesFilterListProps) {
  const { mode: dateMode, toggle: toggleDateMode } = useDateMode();
  const [search,     setSearch]     = useState("");
  const [type,       setType]       = useState<TypeFilter>("all");
  const [status,     setStatus]     = useState<StatusFilter>("all");
  const [seriesId,   setSeriesId]   = useState<string>("all");

  const SERIES_OPTS = [
    { value: "all", label: "All series" },
    ...series.map((s) => ({ value: s.id, label: s.name })),
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRides.filter((r) => {
      if (type !== "all" && r.rideType !== type) return false;
      if (seriesId !== "all" && r.series?.id !== seriesId) return false;
      if (status === "upcoming"  && !rideIsUpcoming(r.startDate)) return false;
      if (status === "completed" && r.status !== "completed")     return false;
      if (q && !r.title.toLowerCase().includes(q) &&
               !r.location.toLowerCase().includes(q) &&
               !(r.shortDescription ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRides, search, type, status]);

  const upcoming   = allRides.filter((r) => rideIsUpcoming(r.startDate)).length;
  const completed  = allRides.filter((r) => r.status === "completed").length;

  return (
    <>
      {/* Header */}
      <AnimateIn className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="block w-6 h-px bg-hd-ember-600 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
            Ride Catalogue
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-hd-ink-50 mb-2">
          All Rides
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-hd-ink-400 mt-2">
          <span><strong className="text-hd-ink-200">{allRides.length}</strong> total rides</span>
          <span><strong className="text-emerald-400">{upcoming}</strong> upcoming</span>
          <span><strong className="text-hd-ink-400">{completed}</strong> completed</span>
        </div>
      </AnimateIn>

      {/* Filters */}
      <AnimateIn
        className="mb-8 p-4 rounded-xl gradient-card border border-hd-ink-700/60 space-y-3"
        delay={0.05}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
            <SlidersHorizontal className="size-3.5" />
            Filters
          </div>
          <DateModeToggle mode={dateMode} toggle={toggleDateMode} size="xs" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-hd-ink-500" />
          <input
            type="text"
            placeholder="Search rides, locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full h-9 pl-9 pr-3 rounded-lg text-sm",
              "bg-hd-ink-800 border border-hd-ink-700",
              "text-hd-ink-100 placeholder:text-hd-ink-600",
              "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40 transition-colors"
            )}
          />
        </div>

        <div className="flex flex-wrap gap-y-2 gap-x-4">
          <div>
            <p className="text-[10px] text-hd-ink-600 mb-1.5 uppercase tracking-wide">Type</p>
            <FilterChip options={TYPE_OPTS} value={type} onChange={setType} />
          </div>
          {series.length > 0 && (
            <div>
              <p className="text-[10px] text-hd-ink-600 mb-1.5 uppercase tracking-wide">Series</p>
              <FilterChip options={SERIES_OPTS} value={seriesId} onChange={setSeriesId} />
            </div>
          )}
          <div>
            <p className="text-[10px] text-hd-ink-600 mb-1.5 uppercase tracking-wide">Status</p>
            <FilterChip options={STATUS_OPTS} value={status} onChange={setStatus} />
          </div>
        </div>
      </AnimateIn>

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-hd-ink-500">
          {filtered.length === allRides.length
            ? `${filtered.length} rides`
            : `${filtered.length} of ${allRides.length} rides`}
        </p>
        {(search || type !== "all" || status !== "all") && (
          <button
            onClick={() => { setSearch(""); setType("all"); setStatus("all"); setSeriesId("all"); }}
            className="text-xs text-hd-ember-400 hover:text-hd-ember-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-hd-ink-600 text-sm space-y-2">
          <p className="text-2xl">🏍️</p>
          <p>No rides match your filters.</p>
          <button
            onClick={() => { setSearch(""); setType("all"); setStatus("all"); setSeriesId("all"); }}
            className="text-hd-ember-400 hover:text-hd-ember-300 text-xs underline underline-offset-2 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ride) => (
            <RideCard key={ride.id} ride={ride} variant="default" className="h-full" brandLogos={brandLogos} dateMode={dateMode} />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <AnimateIn className="mt-10 text-center" delay={0.1}>
        <Link
          href={ROUTES.calendar}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-300 hover:text-hd-ink-50 font-semibold text-sm transition-all duration-200"
        >
          View as Calendar
          <ArrowRight className="size-4" />
        </Link>
      </AnimateIn>
    </>
  );
}
