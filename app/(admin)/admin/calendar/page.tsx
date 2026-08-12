// =============================================================================
// Admin Calendar - Phase 6 · Supabase data
// =============================================================================

import type { Metadata }    from "next";
import { getRidesForYear }  from "@/lib/supabase/queries";
import { sortRidesByDate }  from "@/utils/ride";
import { AdminCalendarView } from "@/features/admin/AdminCalendarView";

export const metadata: Metadata = { title: "Calendar | Admin" };

export default async function AdminCalendarPage() {
  const rides = sortRidesByDate(await getRidesForYear(2026));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Drag-Drop Calendar</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          Drag ride chips to reschedule · 2026 season
        </p>
      </div>
      <AdminCalendarView initialRides={rides} />
    </div>
  );
}
