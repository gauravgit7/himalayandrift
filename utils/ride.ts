// =============================================================================
// Ride utility functions - status colors, filtering helpers, stats
// =============================================================================

import type { Ride, CalendarFilters, RideStatus, RidePriority, RideType } from "@/types";
import { RIDE_STATUSES, RIDE_PRIORITIES } from "@/lib/constants";
import { rideIsActive, rideIsUpcoming, rideIsPast } from "@/utils/date";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export function getStatusConfig(status: RideStatus) {
  return RIDE_STATUSES.find((s) => s.value === status) ?? RIDE_STATUSES[0];
}

export function getPriorityConfig(priority: RidePriority) {
  return RIDE_PRIORITIES.find((p) => p.value === priority) ?? RIDE_PRIORITIES[0];
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export function applyCalendarFilters(rides: Ride[], filters: CalendarFilters): Ride[] {
  return rides.filter((ride) => {
    if (filters.chapter   !== "all" && ride.chapter   !== filters.chapter)   return false;
    if (filters.rideType  !== "all" && ride.rideType  !== filters.rideType)  return false;
    if (filters.status    !== "all" && ride.status    !== filters.status)     return false;
    if (filters.priority  !== "all" && ride.priority  !== filters.priority)   return false;

    if (filters.dateRange.start && ride.endDate < filters.dateRange.start)   return false;
    if (filters.dateRange.end   && ride.startDate > filters.dateRange.end)   return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (
        !ride.title.toLowerCase().includes(q) &&
        !ride.chapter.toLowerCase().includes(q)
      ) return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/** Sort rides by start date ascending */
export function sortRidesByDate(rides: Ride[]): Ride[] {
  return [...rides].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Sort rides for display: active first, then upcoming, then past */
export function sortRidesForDisplay(rides: Ride[]): Ride[] {
  const active   = rides.filter((r) => rideIsActive(r.startDate, r.endDate));
  const upcoming = rides.filter((r) => rideIsUpcoming(r.startDate));
  const past     = rides.filter((r) => rideIsPast(r.endDate));
  return [
    ...sortRidesByDate(active),
    ...sortRidesByDate(upcoming),
    ...sortRidesByDate(past).reverse(),
  ];
}

// ---------------------------------------------------------------------------
// Grouping helpers
// ---------------------------------------------------------------------------

/** Group rides by month ("YYYY-MM") */
export function groupRidesByMonth(rides: Ride[]): Record<string, Ride[]> {
  return rides.reduce<Record<string, Ride[]>>((acc, ride) => {
    const key = ride.startDate.slice(0, 7); // "YYYY-MM"
    if (!acc[key]) acc[key] = [];
    acc[key].push(ride);
    return acc;
  }, {});
}

/** Get rides that fall within a specific calendar date */
export function getRidesForDate(rides: Ride[], dateStr: string): Ride[] {
  return rides.filter(
    (r) => r.startDate <= dateStr && r.endDate >= dateStr
  );
}

/** Get rides for a specific year */
export function getRidesForYear(rides: Ride[], year: number): Ride[] {
  const y = String(year);
  return rides.filter(
    (r) => r.startDate.startsWith(y) || r.endDate.startsWith(y)
  );
}

// ---------------------------------------------------------------------------
// Statistics helpers
// ---------------------------------------------------------------------------

export interface RideStats {
  total: number;
  byStatus: Record<RideStatus, number>;
  byType: Record<RideType, number>;
  completed: number;
  upcoming: number;
  marqueeCount: number;
}

export function computeRideStats(rides: Ride[]): RideStats {
  const stats: RideStats = {
    total: rides.length,
    byStatus: {
      planned: 0, tentative: 0, confirmed: 0,
      postponed: 0, cancelled: 0, completed: 0,
    },
    byType: { day: 0, overnight: 0, multiday: 0, marquee: 0 },
    completed: 0,
    upcoming: 0,
    marqueeCount: 0,
  };

  rides.forEach((r) => {
    stats.byStatus[r.status]++;
    if (r.rideType in stats.byType) stats.byType[r.rideType]++;
    if (r.status === "completed") stats.completed++;
    if (rideIsUpcoming(r.startDate)) stats.upcoming++;
    if (r.rideType === "marquee") stats.marqueeCount++;
  });

  return stats;
}
