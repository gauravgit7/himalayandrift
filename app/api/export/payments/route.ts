// =============================================================================
// GET /api/export/payments?year=YYYY
// Streams the year's payment ledger as .xlsx — ride fees and shop orders in
// one sheet, with each payer's membership standing and contact details.
//
// Guarded. This one carries names, phone numbers and amounts together, which
// is a different thing from a public ride calendar.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin }              from "@/lib/supabase/guards";
import { getPaymentsForYear }        from "@/lib/supabase/queries";
import { buildPaymentsExcel }        from "@/lib/exports/payments";

export const dynamic     = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return NextResponse.json({ error: denied }, { status: 403 });

  const yearParam = request.nextUrl.searchParams.get("year");
  const year      = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const rows   = await getPaymentsForYear(year);
    const buffer = await buildPaymentsExcel(rows, year);

    const body = buffer as unknown as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="HimalayanDrift-payments-${year}.xlsx"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    console.error("[export/payments]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
