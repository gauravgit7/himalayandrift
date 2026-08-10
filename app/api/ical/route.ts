// =============================================================================
// GET /api/ical?ride={slug}
// Returns a .ics calendar file for any ride — works with Google Calendar,
// Apple Calendar, and Outlook.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRide }           from "@/lib/supabase/queries";
import { formatBsDateRange } from "@/utils/nepali-date";

// ---------------------------------------------------------------------------
// iCal helpers
// ---------------------------------------------------------------------------

/** "2026-04-18" → "20260418" */
function toIcalDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** iCal DTEND for all-day events is exclusive — one day after the last day */
function exclusiveEnd(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

/** Escape special characters per RFC 5545 */
function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g,  "\\;")
    .replace(/,/g,  "\\,")
    .replace(/\n/g, "\\n");
}

/** Fold long lines at 75 octets per RFC 5545 §3.1 */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let pos = 0;
  while (pos < line.length) {
    chunks.push(line.slice(pos, pos + (pos === 0 ? 75 : 74)));
    pos += pos === 0 ? 75 : 74;
  }
  return chunks.join("\r\n ");
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("ride");
  if (!slug) {
    return NextResponse.json({ error: "Missing ?ride= param" }, { status: 400 });
  }

  const ride = await getRide(slug);
  if (!ride) {
    return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tvs-nepal.com";
  const pageUrl = `${siteUrl}/rides/${ride.slug}`;

  // Build description
  const descLines: string[] = [];
  if (ride.shortDescription) descLines.push(ride.shortDescription);
  descLines.push(`BS Date: ${formatBsDateRange(ride.startDate, ride.endDate)}`);
  descLines.push(`Chapter: ${ride.location}, Nepal`);
  descLines.push(`Type: ${ride.rideType}`);
  if (ride.registrationLink) descLines.push(`Register: ${ride.registrationLink}`);
  descLines.push(`Full details: ${pageUrl}`);

  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TVS Nepal//Ride Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:TVS Nepal Rides",
    "X-WR-TIMEZONE:Asia/Kathmandu",
    "BEGIN:VEVENT",
    fold(`UID:ride-${ride.id}@tvs-nepal.com`),
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${toIcalDate(ride.startDate)}`,
    `DTEND;VALUE=DATE:${exclusiveEnd(ride.endDate)}`,
    fold(`SUMMARY:${esc(ride.title)}`),
    fold(`DESCRIPTION:${esc(descLines.join("\\n"))}`),
    fold(`LOCATION:${esc(`${ride.location}, Nepal`)}`),
    fold(`URL:${pageUrl}`),
    `STATUS:${ride.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
    "CLASS:PUBLIC",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ride.slug}.ics"`,
      "Cache-Control":       "public, max-age=3600, stale-while-revalidate=7200",
    },
  });
}
