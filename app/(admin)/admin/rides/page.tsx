// =============================================================================
// Admin Rides List - Phase 6 · Supabase data
// =============================================================================

import type { Metadata }  from "next";
import { getRides, getBrandLogos } from "@/lib/supabase/queries";
import { sortRidesByDate } from "@/utils/ride";
import { RidesTable }     from "@/features/admin/RidesTable";

export const metadata: Metadata = { title: "Rides | Admin" };

export default async function AdminRidesPage() {
  const [rides, brandLogos] = await Promise.all([getRides().then(sortRidesByDate), getBrandLogos()]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">All Rides</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          2026 season · {rides.length} total rides
        </p>
      </div>
      <RidesTable initialRides={rides} brandLogos={brandLogos} />
    </div>
  );
}
