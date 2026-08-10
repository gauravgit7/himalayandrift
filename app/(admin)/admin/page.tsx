// =============================================================================
// Admin Dashboard - Phase 6 · Supabase data
// =============================================================================

import type { Metadata }  from "next";
import { getRides, getChapters, getBrandLogos } from "@/lib/supabase/queries";
import { computeRideStats, sortRidesByDate } from "@/utils/ride";
import { rideIsUpcoming } from "@/utils/date";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const metadata: Metadata = { title: "Dashboard | TVS Nepal Admin" };

export default async function AdminDashboardPage() {
  const [rides, chapters, brandLogos] = await Promise.all([getRides(), getChapters(), getBrandLogos()]);

  const stats        = computeRideStats(rides);
  const upcomingRides = sortRidesByDate(rides.filter((r) => rideIsUpcoming(r.startDate)));
  const recentRides   = sortRidesByDate(rides).slice(-8).reverse();
  const totalRiders   = chapters.reduce((s, c) => s + c.memberCount, 0);

  return (
    <AdminDashboard
      stats={stats}
      recentRides={recentRides}
      upcomingRides={upcomingRides}
      chapters={chapters}
      totalRiders={totalRiders}
      brandLogos={brandLogos}
    />
  );
}
