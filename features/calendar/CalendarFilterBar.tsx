// =============================================================================
// CalendarFilterBar - Phase 4 · Horizontal filter controls
// Community pills + dropdowns for chapter, type, status + search
// =============================================================================

"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import {
  COMMUNITIES,
  CHAPTERS,
  RIDE_TYPES,
  RIDE_STATUSES,
} from "@/lib/constants";
import type { CalendarFilters, Community, ChapterName, RideType, RideStatus } from "@/types";

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
// Community pill colors
// ---------------------------------------------------------------------------

const COMMUNITY_PILL: Record<string, string> = {
  all:      "border-tvs-charcoal-700 text-tvs-charcoal-300 hover:border-tvs-charcoal-500",
  AOG:      "border-tvs-red-700/60   text-tvs-red-300   hover:border-tvs-red-500",
  CULT:     "border-tvs-steel-700/60 text-tvs-steel-300 hover:border-tvs-steel-500",
  AOGxCULT: "border-violet-700/60   text-violet-300   hover:border-violet-500",
};

const COMMUNITY_PILL_ACTIVE: Record<string, string> = {
  all:      "bg-tvs-charcoal-700 border-tvs-charcoal-600 text-tvs-charcoal-50",
  AOG:      "bg-tvs-red-700      border-tvs-red-600      text-white",
  CULT:     "bg-tvs-steel-700    border-tvs-steel-600    text-white",
  AOGxCULT: "bg-violet-700      border-violet-600      text-white",
};

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
    filters.community !== "all",
    filters.chapter   !== "all",
    filters.rideType  !== "all",
    filters.status    !== "all",
    !!filters.searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-3 border-t border-tvs-charcoal-800/40">
      {/* ── Top row: community pills + expand button ── */}
      <div className="flex items-center gap-2 pt-3 flex-wrap">
        {/* Community pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* All pill */}
          <button
            onClick={() => onUpdate("community", "all")}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150",
              filters.community === "all"
                ? COMMUNITY_PILL_ACTIVE.all
                : COMMUNITY_PILL.all
            )}
          >
            All
          </button>
          {/* Community-specific pills */}
          {COMMUNITIES.map((c) => (
            <button
              key={c.value}
              onClick={() =>
                onUpdate(
                  "community",
                  filters.community === c.value ? "all" : (c.value as Community)
                )
              }
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150",
                filters.community === c.value
                  ? COMMUNITY_PILL_ACTIVE[c.value]
                  : COMMUNITY_PILL[c.value]
              )}
            >
              {c.value === "AOGxCULT" ? "AOG×CULT" : c.value}
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

          {/* Ride type */}
          <Select
            label="Type"
            value={filters.rideType as string}
            onChange={(v) => onUpdate("rideType", v === "all" ? "all" : (v as RideType))}
            options={[
              { value: "all", label: "All Types" },
              ...RIDE_TYPES.map((t) => ({ value: t.value, label: t.label })),
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
