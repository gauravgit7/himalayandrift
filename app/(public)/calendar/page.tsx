// =============================================================================
// Calendar Page - Phase 6 · Supabase data
// Phase 10 · ISR: regenerate every hour; saveRide/deleteRide call
//            revalidatePath("/calendar") to flush immediately on mutations.
// Phase 11 · Multi-year: initial load uses DEFAULT_CALENDAR_YEAR;
//            client navigates to other years via /api/rides?year=YYYY.
// =============================================================================

export const revalidate = 3600; // 1 hour

import type { Metadata }          from "next";
import { APP_META, DEFAULT_CALENDAR_YEAR } from "@/lib/constants";
import { getRidesForYear }         from "@/lib/supabase/queries";
import { CalendarShell }           from "@/features/calendar/CalendarShell";

export const metadata: Metadata = {
  title:       `${DEFAULT_CALENDAR_YEAR} Ride Calendar | ${APP_META.shortName}`,
  description: `Full annual ride calendar for ${APP_META.name} · ${DEFAULT_CALENDAR_YEAR} season.`,
};

export default async function CalendarPage() {
  const rides = await getRidesForYear(DEFAULT_CALENDAR_YEAR);
  return <CalendarShell allRides={rides} initialYear={DEFAULT_CALENDAR_YEAR} />;
}
