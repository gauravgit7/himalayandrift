// =============================================================================
// /api/rides/interest
// POST { rideId } — increment interest_count   (user marks interest)
// DELETE { rideId } — decrement interest_count  (user cancels interest)
// Both calls are atomic RPCs and return the updated count.
// Uses service role key — server-side only.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Shared helper — parse + validate body
// ---------------------------------------------------------------------------

async function parseRideId(request: NextRequest): Promise<string | null> {
  try {
    const body = await request.json();
    return typeof body.rideId === "string" && body.rideId ? body.rideId : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST — increment (user adds interest)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rideId = await parseRideId(request);
  if (!rideId) {
    return NextResponse.json({ error: "Missing rideId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("increment_ride_interest", {
    ride_id: rideId,
  });

  if (error) {
    console.error("[interest] increment rpc error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data as number });
}

// ---------------------------------------------------------------------------
// DELETE — decrement (user removes interest)
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const rideId = await parseRideId(request);
  if (!rideId) {
    return NextResponse.json({ error: "Missing rideId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("decrement_ride_interest", {
    ride_id: rideId,
  });

  if (error) {
    console.error("[interest] decrement rpc error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data as number });
}
