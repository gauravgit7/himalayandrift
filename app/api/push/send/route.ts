// =============================================================================
// POST /api/push/send
// Broadcasts a push notification to all subscribers.
// Called by: admin manual broadcast, ride events (new ride / status change)
// Body: { title, body, url? }
// Protected: requires CRON_SECRET or admin session
// =============================================================================

import { NextResponse }       from "next/server";
import webPush                from "web-push";
import { createAdminClient }  from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Payload type
// ---------------------------------------------------------------------------

export interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
  icon?: string;
  badge?: string;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // Guard: only allow from cron (secret header) or admin (TODO: session check)
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Configure VAPID here (runtime only — env vars not available at build time)
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    const payload = await req.json() as PushPayload;

    if (!payload.title || !payload.body) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscribers" });
    }

    const notification = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      icon:  payload.icon  ?? "/icons/icon-192.png",
      badge: payload.badge ?? "/icons/icon-192.png",
      url:   payload.url   ?? "/home",
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        ).catch(async (err: { statusCode?: number }) => {
          // 410 Gone = subscription expired, clean it up
          if (err.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          throw err;
        })
      )
    );

    const sent   = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return NextResponse.json({ sent, failed, total: subs.length });
  } catch (err) {
    console.error("[push/send]", err);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
