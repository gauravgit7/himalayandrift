// =============================================================================
// CalendarFilterBar - Phase 4 · Horizontal filter controls
// Ride-type pills + a status dropdown + search
// =============================================================================

"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import {
  RIDE_TYPES,
  RIDE_STATUSES,
} from "@/lib/constants";
import type { CalendarFilters, RideType, RideStatus, Series } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarFilterBarProps {
  filters:    CalendarFilters;
  /** Series available to filter by. Empty until the owner creates one. */
  series:     Series[];
  onUpdate:   <K extends keyof CalendarFilters>(key: K, val: CalendarFilters[K]) => void;
  onClear:    () => void;
  isFiltered: boolean;
}

// ---------------------------------------------------------------------------
// Ride-type pill colors
// ---------------------------------------------------------------------------

const PILL_IDLE   = "border-hd-ink-700 text-hd-ink-300 hover:border-hd-ink-500";
const PILL_ACTIVE = "bg-hd-ink-700 border-hd-ink-600 text-hd-ink-50";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarFilterBar({
  filters,
  series,
  onUpdate,
  onClear,
  isFiltered,
}: CalendarFilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = [
    filters.rideType  !== "all",
    filters.series    !== "all",
    filters.status    !== "all",
    !!filters.searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-3 border-t border-hd-ink-800/40">
      {/* ── Top row: ride-type pills + expand button ── */}
      <div className="flex items-center gap-2 pt-3 flex-wrap">
        {/* Ride-type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* All pill */}
          <button
            onClick={() => onUpdate("rideType", "all")}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150",
              filters.rideType === "all" ? PILL_ACTIVE : PILL_IDLE
            )}
          >
            All
          </button>
          {/* Type-specific pills */}
          {RIDE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() =>
                onUpdate(
                  "rideType",
                  filters.rideType === t.value ? "all" : (t.value as RideType)
                )
              }
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150",
                filters.rideType === t.value ? PILL_ACTIVE : PILL_IDLE
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Expand filters button */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "ml-1 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150",
            expanded || activeCount > 1
              ? "bg-hd-ink-700 border-hd-ink-600 text-hd-ink-50"
              : "border-hd-ink-700 text-hd-ink-400 hover:text-hd-ink-50 hover:border-hd-ink-500"
          )}
        >
          <SlidersHorizontal className="size-3" />
          Filters
          {activeCount > 1 && (
            <span className="ml-0.5 size-4 flex items-center justify-center rounded-full bg-hd-ember-600 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {/* Search (always visible) */}
        <div className="flex-1 min-w-[140px] max-w-xs relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-hd-ink-500 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onUpdate("searchQuery", e.target.value)}
            placeholder="Search rides…"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-hd-ink-900 border border-hd-ink-800 text-xs text-hd-ink-100 placeholder:text-hd-ink-600 focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/50 transition-colors"
          />
        </div>

        {/* Clear */}
        {isFiltered && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-hd-ink-500 hover:text-hd-ember-400 transition-colors"
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </div>

      {/* ── Expanded filter row ── */}
      {expanded && (
        <div className="flex flex-wrap gap-2 pt-3">
          {/* Series - only worth showing once a series exists */}
          {series.length > 0 && (
            <Select
              label="Series"
              value={filters.series}
              onChange={(v) => onUpdate("series", v)}
              options={[
                { value: "all", label: "All Series" },
                ...series.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          )}

          {/* Status */}
          <Select
            label="Status"
            value={filters.status as string}
            onChange={(v) => onUpdate("status", v === "all" ? "all" : (v as RideStatus))}
            options={[
              { value: "all", label: "All Statuses" },
              ...RIDE_STATUSES.map((s) => ({ value: s.value, label: s.label })),
            ]}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini select component
// ---------------------------------------------------------------------------

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label:    string;
  value:    string;
  onChange: (v: string) => void;
  options:  { value: string; label: string }[];
}) {
  const isActive = value !== "all";

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none h-8 pl-3 pr-7 rounded-lg border text-xs font-medium cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-hd-ember-600/50",
          isActive
            ? "bg-hd-ember-950/60 border-hd-ember-800/60 text-hd-ember-200 focus:border-hd-ember-600"
            : "bg-hd-ink-900 border-hd-ink-800 text-hd-ink-300 hover:border-hd-ink-600 focus:border-hd-ink-600"
        )}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-hd-ink-900 text-hd-ink-100">
            {o.label}
          </option>
        ))}
      </select>
      {/* Custom chevron */}
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-hd-ink-500 text-[10px]">
        ▾
      </span>
    </div>
  );
}
