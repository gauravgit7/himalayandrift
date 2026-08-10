// =============================================================================
// AdminDashboard - Phase 5 · Overview stats + recent rides + quick actions
// 'use client' - for interactive elements
// =============================================================================

"use client";

import Link from "next/link";
import {
  Flag, CheckCircle, Clock, AlertTriangle,
  Plus, Globe, Calendar, ArrowRight, Users, Map,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatRideDateRange } from "@/utils/date";
import { ROUTES, APP_META, RIDE_TYPE_STYLES, RIDE_TYPE_STYLE_FALLBACK } from "@/lib/constants";
import type { BrandLogos } from "@/types";
import { StatusBadge }    from "@/components/shared/StatusBadge";
import type { Ride, Chapter } from "@/types";
import type { RideStats }  from "@/utils/ride";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminDashboardProps {
  stats:         RideStats;
  recentRides:   Ride[];
  upcomingRides: Ride[];
  chapters:      Chapter[];
  totalRiders:   number;
  brandLogos?:   BrandLogos | null;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon:    React.ReactNode;
  label:   string;
  value:   string | number;
  sub?:    string;
  accent:  string;
}) {
  return (
    <div className={cn(
      "relative flex flex-col gap-3 p-5 rounded-xl border overflow-hidden",
      "gradient-card",
      accent
    )}>
      <div className="flex items-start justify-between">
        <span className="text-tvs-charcoal-400">{icon}</span>
        {sub && <span className="text-xs text-tvs-charcoal-500">{sub}</span>}
      </div>
      <div>
        <p className="text-3xl font-black text-tvs-charcoal-50 tabular-nums">{value}</p>
        <p className="text-xs text-tvs-charcoal-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick action button
// ---------------------------------------------------------------------------

function QuickAction({
  href,
  icon,
  label,
  description,
  accent = false,
}: {
  href:        string;
  icon:        React.ReactNode;
  label:       string;
  description: string;
  accent?:     boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5",
        accent
          ? "bg-tvs-red-600/10 border-tvs-red-800/50 hover:border-tvs-red-600/70 hover:bg-tvs-red-600/20"
          : "gradient-card border-tvs-charcoal-700 hover:border-tvs-charcoal-500"
      )}
    >
      <span className={cn("p-2 rounded-lg", accent ? "bg-tvs-red-600/20 text-tvs-red-400" : "bg-tvs-charcoal-800 text-tvs-charcoal-300")}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-tvs-charcoal-50">{label}</p>
        <p className="text-xs text-tvs-charcoal-500 truncate">{description}</p>
      </div>
      <ArrowRight className="size-4 text-tvs-charcoal-600 group-hover:text-tvs-charcoal-300 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdminDashboard({
  stats,
  recentRides,
  upcomingRides,
  chapters,
  totalRiders,
  brandLogos,
}: AdminDashboardProps) {
  const pendingReview = stats.byStatus.tentative + stats.byStatus.planned;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-black text-tvs-charcoal-50">Dashboard</h1>
        <p className="text-sm text-tvs-charcoal-400 mt-0.5">
          {APP_META.name} · {new Date().getFullYear()} Season
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Flag className="size-5" />}
          label="Total Rides"
          value={stats.total}
          sub="2026"
          accent="border-tvs-charcoal-700"
        />
        <StatCard
          icon={<CheckCircle className="size-5" />}
          label="Confirmed / Done"
          value={stats.byStatus.confirmed + stats.completed}
          sub={`${stats.completed} completed`}
          accent="border-emerald-900/40"
        />
        <StatCard
          icon={<Clock className="size-5" />}
          label="Upcoming"
          value={stats.upcoming}
          sub="to be ridden"
          accent="border-tvs-steel-900/40"
        />
        <StatCard
          icon={<AlertTriangle className="size-5" />}
          label="Needs Review"
          value={pendingReview}
          sub="planned or tentative"
          accent={pendingReview > 5 ? "border-amber-900/40" : "border-tvs-charcoal-700"}
        />
      </div>

      {/* ── Secondary stats ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={<Map className="size-4" />}
          label="Active Chapters"
          value={chapters.filter((c) => c.isActive).length}
          accent="border-tvs-charcoal-700"
        />
        <StatCard
          icon={<Users className="size-4" />}
          label="Total Riders"
          value={`${totalRiders}+`}
          accent="border-tvs-charcoal-700"
        />
        <StatCard
          icon={<Flag className="size-4" />}
          label="Marquee Rides"
          value={stats.marqueeCount}
          sub="flagship"
          accent="border-violet-900/40"
        />
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-bold text-tvs-charcoal-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            href={ROUTES.adminRides + "/new"}
            icon={<Plus className="size-4" />}
            label="Add New Ride"
            description="Create a ride for any chapter"
            accent
          />
          <QuickAction
            href={ROUTES.adminCalendar}
            icon={<Calendar className="size-4" />}
            label="Drag-Drop Calendar"
            description="Reschedule rides visually"
          />
          <QuickAction
            href={ROUTES.adminHomepage}
            icon={<Globe className="size-4" />}
            label="Edit Homepage"
            description="Update hero, featured rides"
          />
          <QuickAction
            href={ROUTES.adminRides}
            icon={<Flag className="size-4" />}
            label="All Rides"
            description="Manage the full schedule"
          />
        </div>
      </div>

      {/* ── Main content: upcoming + recent ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Upcoming rides */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-tvs-charcoal-400 uppercase tracking-wider">
              Next Upcoming
            </h2>
            <Link
              href={ROUTES.adminRides}
              className="text-xs text-tvs-charcoal-500 hover:text-tvs-red-400 transition-colors flex items-center gap-1"
            >
              See all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingRides.slice(0, 6).map((ride) => (
              <RideRow key={ride.id} ride={ride} brandLogos={brandLogos} />
            ))}
          </div>
        </div>

        {/* Chapter overview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-tvs-charcoal-400 uppercase tracking-wider">
              Chapter Activity
            </h2>
            <Link
              href={ROUTES.adminChapters}
              className="text-xs text-tvs-charcoal-500 hover:text-tvs-red-400 transition-colors flex items-center gap-1"
            >
              Manage <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {[...chapters]
              .sort((a, b) => b.totalRidesThisYear - a.totalRidesThisYear)
              .map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center gap-3 p-3 rounded-lg gradient-card border border-tvs-charcoal-700/60"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-tvs-charcoal-100">
                        {chapter.name}
                      </span>
                      {chapter.isPriority && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-tvs-red-900/50 text-tvs-red-400 border border-tvs-red-800/40">
                          ★
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-tvs-charcoal-500">{chapter.region}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-tvs-charcoal-50">{chapter.totalRidesThisYear}</p>
                    <p className="text-[10px] text-tvs-charcoal-500">rides</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-tvs-charcoal-50">{chapter.memberCount}</p>
                    <p className="text-[10px] text-tvs-charcoal-500">riders</p>
                  </div>
                  <div
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      chapter.isActive ? "bg-emerald-500" : "bg-tvs-charcoal-600"
                    )}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact ride row (used in dashboard lists)
// ---------------------------------------------------------------------------

function RideRow({ ride, brandLogos }: { ride: Ride; brandLogos?: BrandLogos | null }) {
  return (
    <Link
      href={`${ROUTES.adminRides}/${ride.id}`}
      className="group flex items-center gap-3 p-3 rounded-lg gradient-card border border-tvs-charcoal-700/60 hover:border-tvs-charcoal-500 transition-all duration-150"
    >
      <div
        className={cn(
          "w-1 self-stretch rounded-full shrink-0",
          (RIDE_TYPE_STYLES[ride.rideType] ?? RIDE_TYPE_STYLE_FALLBACK).dot
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-tvs-charcoal-100 truncate group-hover:text-tvs-charcoal-50 transition-colors">
          {ride.title}
        </p>
        <p className="text-xs text-tvs-charcoal-500 mt-0.5">
          {formatRideDateRange(ride.startDate, ride.endDate)} · {ride.location}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={ride.status} size="xs" />
      </div>
    </Link>
  );
}
