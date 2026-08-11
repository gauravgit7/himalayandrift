// GET /api/members/status?code=HD-XXXXXX
// Returns the member card for a given access code.
// Uses the service-role (admin) client so RLS policy gaps never block a
// legitimate lookup — the access code itself is the security gate.

import { NextRequest, NextResponse }              from "next/server";
import { createAdminClient }                      from "@/lib/supabase/admin";
import { mapMemberCard, type DbMemberCard }       from "@/lib/supabase/mappers";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("member_cards")
    .select("*")
    .eq("access_code", code)
    .maybeSingle();

  if (error) {
    console.error("[members/status]", error.message);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "No application found for this code." }, { status: 404 });
  }

  const card = mapMemberCard(data as DbMemberCard);

  // Strip fields that should never leave the server
  const { licenseNumber: _lic, adminNotes: _notes, ...safe } = card;
  return NextResponse.json({ card: safe });
}
