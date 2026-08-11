// =============================================================================
// GET /api/cron/ride-reminders
// Vercel Cron — runs daily at 08:00 NPT (02:15 UTC)
// Checks for three push triggers:
//   1. Rides starting in exactly 3 days → reminder notification
//   2. New rides posted (status just became Confirmed) → announcement  ← via actions.ts
//   3. Registration opens (status → Confirmed)                         ← via actions.ts
// This route handles only the time-based (3-day) reminder.
// =============================================================================

import { NextResponse }       from "next/server";
import { createAdminClient }  from "@/lib/supabase/admin";

// Guard: Vercel sets Authorization: Bearer <CRON_SECRET> on cron calls
function isAuthorized(req: Request): boolean {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  return auth === `Bearer ${secret}` || process.env.NODE_ENV !== "production";
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Find rides starting in 3 days (NPT offset = UTC+5:45, close enough with UTC+6)
    const today      = new Date();
    const threeDays  = new Date(today);
    threeDays.setDate(today.getDate() + 3);
    const target     = threeDays.toISOString().slice(0, 10); // YYYY-MM-DD

    const { data: rides, error } = await supabase
      .from("rides")
      .select("id, title, slug, start_date, location")
      .eq("start_date", target)
      .in("status", ["confirmed", "tentative"]);

    if (error) throw error;
    if (!rides || rides.length === 0) {
      return NextResponse.json({ sent: 0, message: "No rides in 3 days" });
    }

    // Send one notification per ride
    const results = await Promise.allSettled(
      rides.map(async (ride) => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`,
          {
            method:  "POST",
            headers: {
              "Content-Type":   "application/json",
              "x-cron-secret":  process.env.CRON_SECRET ?? "",
            },
            body: JSON.stringify({
              title: `🏍️ Ride in 3 days — ${ride.title}`,
              body:  `Rolling out from ${ride.location} on ${ride.start_date}. Gear up!`,
              url:   `/rides/${ride.slug}`,
            }),
          }
        );
        return res.json();
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent, total: rides.length });
  } catch (err) {
    console.error("[cron/ride-reminders]", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
