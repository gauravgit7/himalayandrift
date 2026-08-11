// =============================================================================
// Admin Dashboard - Phase 6 · Supabase data
// =============================================================================

import type { Metadata }  from "next";
import { getRides, getAllMarshals, getBrandLogos } from "@/lib/supabase/queries";
import { computeRideStats, sortRidesByDate } from "@/utils/ride";
import { rideIsUpcoming } from "@/utils/date";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { APP_META } from "@/lib/constants";

export const metadata: Metadata = { title: `Dashboard | ${APP_META.name} Admin` };

export default async function AdminDashboardPage() {
  const [rides, marshals, brandLogos] = await Promise.all([
    getRides(),
    getAllMarshals(),
    getBrandLogos(),
  ]);

  const stats         = computeRideStats(rides);
  const upcomingRides = sortRidesByDate(rides.filter((r) => rideIsUpcoming(r.startDate)));
  const recentRides   = sortRidesByDate(rides).slice(-8).reverse();
  const activeMarshals = marshals.filter((m) => m.isActive).length;

  return (
    <AdminDashboard
      stats={stats}
      recentRides={recentRides}
      upcomingRides={upcomingRides}
      activeMarshals={activeMarshals}
      brandLogos={brandLogos}
    />
  );
}
