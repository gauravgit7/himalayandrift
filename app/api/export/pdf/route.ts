// =============================================================================
// GET /api/export/pdf?year=YYYY
// Streams a branded A4 PDF calendar for the requested calendar year.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRidesForYear, getHomepageContent } from "@/lib/supabase/queries";
import { buildCalendarPdf }          from "@/lib/exports/pdf";

export const dynamic    = "force-dynamic";
export const maxDuration = 30; // PDF generation for a full year can be slow

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const year      = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const [rides, homepage] = await Promise.all([
      getRidesForYear(year),
      getHomepageContent(),
    ]);
    const buffer = await buildCalendarPdf(rides, year, homepage.brandLogos);

    // Node.js Buffer is always backed by a real ArrayBuffer (never SharedArrayBuffer).
    // The TS generic mismatch (ArrayBufferLike vs ArrayBuffer) is a false positive here.
    const body = buffer as unknown as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="tvs-nepal-calendar-${year}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    console.error("[export/pdf]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
