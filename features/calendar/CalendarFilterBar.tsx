// =============================================================================
// CalendarFilterBar - Phase 4 · Horizontal filter controls
// Ride-type pills + dropdowns for chapter, status + search
// =============================================================================

"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import {
  CHAPTERS,
  RIDE_TYPES,
  RIDE_STATUSES,
} from "@/lib/constants";
import type { CalendarFilters, ChapterName, RideType, RideStatus } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarFilterBarProps {
  filters:    CalendarFilters;
  onUpdate:   <K extends keyof CalendarFilters>(key: K, val: CalendarFilters[K]) => void;
  onClear:    () => void;
  isFiltered: boolean;
}

// ---------------------------------------------------------------------------
// Ride-type pill colors
// ---------------------------------------------------------------------------

const PILL_IDLE   = "border-tvs-charcoal-700 text-tvs-charcoal-300 hover:border-tvs-charcoal-500";
const PILL_ACTIVE = "bg-tvs-charcoal-700 border-tvs-charcoal-600 text-tvs-charcoal-50";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarFilterBar({
  filters,
  onUpdate,
  onClear,
  isFiltered,
}: CalendarFilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = [
    filters.chapter   !== "all",
    filters.rideType  !== "all",
    filters.status    !== "all",
    !!filters.searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-3 border-t border-tvs-charcoal-800/40">
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
              ? "bg-tvs-charcoal-700 border-tvs-charcoal-600 text-tvs-charcoal-50"
              : "border-tvs-charcoal-700 text-tvs-charcoal-400 hover:text-tvs-charcoal-50 hover:border-tvs-charcoal-500"
          )}
        >
          <SlidersHorizontal className="size-3" />
          Filters
          {activeCount > 1 && (
            <span className="ml-0.5 size-4 flex items-center justify-center rounded-full bg-tvs-red-600 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {/* Search (always visible) */}
        <div className="flex-1 min-w-[140px] max-w-xs relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-tvs-charcoal-500 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onUpdate("searchQuery", e.target.value)}
            placeholder="Search rides…"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-tvs-charcoal-900 border border-tvs-charcoal-800 text-xs text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600 focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/50 transition-colors"
          />
        </div>

        {/* Clear */}
        {isFiltered && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-tvs-charcoal-500 hover:text-tvs-red-400 transition-colors"
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </div>

      {/* ── Expanded filter row ── */}
      {expanded && (
        <div className="flex flex-wrap gap-2 pt-3">
          {/* Chapter */}
          <Select
            label="Chapter"
            value={filters.chapter as string}
            onChange={(v) => onUpdate("chapter", v === "all" ? "all" : (v as ChapterName))}
            options={[
              { value: "all", label: "All Chapters" },
              ...CHAPTERS.map((c) => ({ value: c.name, label: c.name + (c.isPriority ? " ★" : "") })),
            ]}
          />

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
          "appearance-none h-8 pl-3 pr-7 rounded-lg border text-xs font-medium cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-tvs-red-600/50",
          isActive
            ? "bg-tvs-red-950/60 border-tvs-red-800/60 text-tvs-red-200 focus:border-tvs-red-600"
            : "bg-tvs-charcoal-900 border-tvs-charcoal-800 text-tvs-charcoal-300 hover:border-tvs-charcoal-600 focus:border-tvs-charcoal-600"
        )}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-tvs-charcoal-900 text-tvs-charcoal-100">
            {o.label}
          </option>
        ))}
      </select>
      {/* Custom chevron */}
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-tvs-charcoal-500 text-[10px]">
        ▾
      </span>
    </div>
  );
}
