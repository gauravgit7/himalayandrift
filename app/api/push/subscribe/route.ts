// =============================================================================
// POST /api/push/subscribe
// Saves a Web Push subscription to Supabase
// =============================================================================

import { NextResponse }       from "next/server";
import { createAdminClient }  from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { endpoint, keys } = await req.json() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
    }

    const supabase   = createAdminClient();
    const userAgent  = req.headers.get("user-agent") ?? null;

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: userAgent },
        { onConflict: "endpoint" },
      );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe]", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
