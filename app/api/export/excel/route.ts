// =============================================================================
// GET /api/export/excel?year=YYYY
// Streams a branded .xlsx workbook for the requested calendar year.
// Requires an authenticated admin session (reads from Supabase via service key).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRidesForYear }           from "@/lib/supabase/queries";
import { buildRidesExcel }           from "@/lib/exports/excel";

export const dynamic    = "force-dynamic";
export const maxDuration = 30; // Excel generation for a full year can be slow

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const year      = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const rides  = await getRidesForYear(year);
    const buffer = await buildRidesExcel(rides, year);

    // Node.js Buffer is always backed by a real ArrayBuffer (never SharedArrayBuffer).
    // The TS generic mismatch (ArrayBufferLike vs ArrayBuffer) is a false positive here.
    const body = buffer as unknown as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="HimalayanDrift-rides-${year}.xlsx"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    console.error("[export/excel]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
