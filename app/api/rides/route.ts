// =============================================================================
// GET /api/rides?year=YYYY
// Returns all rides for the requested calendar year as JSON.
// Public - no auth required. Used by CalendarShell for client-side year nav.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRidesForYear }            from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const year      = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const rides = await getRidesForYear(year);
    return NextResponse.json(rides, {
      headers: {
        // Cache at CDN for 5 min; ISR revalidation will bust it on mutations
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[api/rides]", err);
    return NextResponse.json({ error: "Failed to fetch rides" }, { status: 500 });
  }
}
