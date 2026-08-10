// =============================================================================
// POST /api/push/unsubscribe
// Removes a Web Push subscription from Supabase
// =============================================================================

import { NextResponse }       from "next/server";
import { createAdminClient }  from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json() as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/unsubscribe]", err);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
