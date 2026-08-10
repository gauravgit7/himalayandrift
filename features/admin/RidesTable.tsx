// =============================================================================
// RidesTable - Phase 5 · Admin rides list with search/filter/actions
// 'use client' - local filter/sort state
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, Edit2, Trash2, Eye, ChevronUp, ChevronDown,
  ArrowUpDown, Filter,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatRideDateRange } from "@/utils/date";
import { ROUTES, COMMUNITIES, RIDE_STATUSES } from "@/lib/constants";
import { CommunityBadge } from "@/components/shared/CommunityBadge";
import { StatusBadge }    from "@/components/shared/StatusBadge";
import type { Ride, Community, RideStatus, BrandLogos } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RidesTableProps {
  initialRides: Ride[];
  brandLogos?:  BrandLogos | null;
}

type SortKey   = "startDate" | "title" | "chapter" | "status" | "community";
type SortOrder = "asc" | "desc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMMUNITY_FILTER_OPTS = [
  { value: "all", label: "All Communities" },
  ...COMMUNITIES.map((c) => ({
    value: c.value,
    label: c.value === "AOGxCULT" ? "AOG × CULT" : c.value,
  })),
];

const STATUS_FILTER_OPTS = [
  { value: "all", label: "All Statuses" },
  ...RIDE_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RidesTable({ initialRides, brandLogos }: RidesTableProps) {
  const [rides,  setRides]  = useState<Ride[]>(initialRides);
  const [query,  setQuery]  = useState("");
  const [community, setCommunity] = useState<Community | "all">("all");
  const [status, setStatus] = useState<RideStatus | "all">("all");
  const [sortKey,   setSortKey]   = useState<SortKey>("startDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [deleteId,  setDeleteId]  = useState<string | null>(null);

  // ── Filtered + sorted ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = rides.filter((r) => {
      if (community !== "all" && r.community !== community) return false;
      if (status    !== "all" && r.status    !== status)    return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.chapter.toLowerCase().includes(q) &&
          !r.community.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let aVal: string, bVal: string;
      switch (sortKey) {
        case "startDate": aVal = a.startDate;      bVal = b.startDate;      break;
        case "title":     aVal = a.title;           bVal = b.title;          break;
        case "chapter":   aVal = a.chapter;         bVal = b.chapter;        break;
        case "status":    aVal = a.status;          bVal = b.status;         break;
        case "community": aVal = a.community;       bVal = b.community;      break;
        default:          aVal = a.startDate;       bVal = b.startDate;
      }
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    return list;
  }, [rides, community, status, query, sortKey, sortOrder]);

  // ── Sort toggle ────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortOrder("asc"); }
  };

  // ── Delete (local-only for Phase 5) ────────────────────────────────────
  const confirmDelete = (id: string) => {
    setRides((prev) => prev.filter((r) => r.id !== id));
    setDeleteId(null);
    // Phase 6: await supabase.from('rides').delete().eq('id', id)
  };

  // ── Sorting icon ───────────────────────────────────────────────────────
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="size-3 text-tvs-charcoal-600" />;
    return sortOrder === "asc"
      ? <ChevronUp   className="size-3 text-tvs-red-400" />
      : <ChevronDown className="size-3 text-tvs-red-400" />;
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-tvs-charcoal-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rides…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-tvs-charcoal-900 border border-tvs-charcoal-800 text-sm text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600 focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40 transition-colors"
          />
        </div>

        {/* Community filter */}
        <select
          value={community}
          onChange={(e) => setCommunity(e.target.value as Community | "all")}
          className="h-9 px-3 rounded-lg bg-tvs-charcoal-900 border border-tvs-charcoal-800 text-sm text-tvs-charcoal-300 focus:outline-none focus:border-tvs-red-600 transition-colors appearance-none"
        >
          {COMMUNITY_FILTER_OPTS.map((o) => (
            <option key={o.value} value={o.value} className="bg-tvs-charcoal-900">
              {o.label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RideStatus | "all")}
          className="h-9 px-3 rounded-lg bg-tvs-charcoal-900 border border-tvs-charcoal-800 text-sm text-tvs-charcoal-300 focus:outline-none focus:border-tvs-red-600 transition-colors appearance-none"
        >
          {STATUS_FILTER_OPTS.map((o) => (
            <option key={o.value} value={o.value} className="bg-tvs-charcoal-900">
              {o.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-tvs-charcoal-500 ml-1 whitespace-nowrap">
          {filtered.length} / {rides.length}
        </span>

        {/* Add button */}
        <Link
          href={`${ROUTES.adminRides}/new`}
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-lg bg-tvs-red-600 hover:bg-tvs-red-500 text-white font-semibold text-sm transition-colors whitespace-nowrap"
        >
          <Plus className="size-4" />
          Add Ride
        </Link>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-tvs-charcoal-800/60 overflow-hidden">
        {/* Head */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-0 border-b border-tvs-charcoal-800/60 bg-tvs-charcoal-900/60">
          {(
            [
              { key: "title",     label: "Ride" },
              { key: "community", label: "Community" },
              { key: "chapter",   label: "Chapter" },
              { key: "startDate", label: "Date" },
              { key: "status",    label: "Status" },
            ] as { key: SortKey; label: string }[]
          ).map((col) => (
            <button
              key={col.key}
              onClick={() => toggleSort(col.key)}
              className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-tvs-charcoal-500 hover:text-tvs-charcoal-200 transition-colors text-left"
            >
              {col.label}
              <SortIcon k={col.key} />
            </button>
          ))}
          <div className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-tvs-charcoal-500">
            Actions
          </div>
        </div>

        {/* Body */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-tvs-charcoal-500 text-sm">
            No rides match your filters.
          </div>
        ) : (
          filtered.map((ride, i) => (
            <div
              key={ride.id}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-0 items-center border-b border-tvs-charcoal-800/30 hover:bg-tvs-charcoal-800/20 transition-colors group",
                i % 2 === 0 ? "bg-transparent" : "bg-tvs-charcoal-900/20"
              )}
            >
              {/* Title */}
              <div className="px-3 py-3 flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "w-0.5 h-6 rounded-full shrink-0",
                    ride.community === "AOGxCULT" ? "bg-violet-600" :
                    ride.community === "CULT"     ? "bg-tvs-steel-500" : "bg-tvs-red-600"
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-tvs-charcoal-100 truncate">
                    {ride.title}
                  </p>
                  {ride.rideType === "marquee" && (
                    <span className="text-[9px] font-bold text-yellow-400">★ MARQUEE</span>
                  )}
                </div>
              </div>
              {/* Community */}
              <div className="px-3 py-3">
                <CommunityBadge community={ride.community} size="xs" brandLogos={brandLogos} />
              </div>
              {/* Chapter */}
              <div className="px-3 py-3 text-xs text-tvs-charcoal-300">{ride.chapter}</div>
              {/* Date */}
              <div className="px-3 py-3 text-xs text-tvs-charcoal-400">
                {formatRideDateRange(ride.startDate, ride.endDate)}
              </div>
              {/* Status */}
              <div className="px-3 py-3">
                <StatusBadge status={ride.status} size="xs" />
              </div>
              {/* Actions */}
              <div className="px-3 py-3 flex items-center gap-1">
                <Link
                  href={ROUTES.ride(ride.slug)}
                  target="_blank"
                  title="View public page"
                  className="p-1.5 rounded-lg text-tvs-charcoal-500 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-800 transition-colors"
                >
                  <Eye className="size-3.5" />
                </Link>
                <Link
                  href={`${ROUTES.adminRides}/${ride.id}`}
                  title="Edit ride"
                  className="p-1.5 rounded-lg text-tvs-charcoal-500 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-800 transition-colors"
                >
                  <Edit2 className="size-3.5" />
                </Link>
                {deleteId === ride.id ? (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => confirmDelete(ride.id)}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-tvs-red-600 hover:bg-tvs-red-500 text-white transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteId(null)}
                      className="text-[10px] font-medium px-2 py-1 rounded bg-tvs-charcoal-700 hover:bg-tvs-charcoal-600 text-tvs-charcoal-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteId(ride.id)}
                    title="Delete ride"
                    className="p-1.5 rounded-lg text-tvs-charcoal-500 hover:text-tvs-red-400 hover:bg-tvs-red-950/40 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Phase note */}
      <p className="text-[10px] text-tvs-charcoal-700 text-center">
        Delete actions are local-only · Phase 6 wires persistence to Supabase
      </p>
    </div>
  );
}
