// =============================================================================
// Excel Export Builder - Phase 8
// Generates a branded .xlsx workbook with 3 sheets:
//   1. All Rides  - full operational table, auto-filter, frozen header
//   2. Monthly Summary - rides × type by month + totals row
//   3. Chapter Summary - rides × type per chapter
// =============================================================================

import ExcelJS from "exceljs";
import type { Ride } from "@/types";
import { MONTHS, CHAPTERS } from "@/lib/constants";
import { formatRideDateRange } from "@/utils/date";

// ---------------------------------------------------------------------------
// Color helpers - ARGB format (Alpha + 6-char hex, no #)
// ---------------------------------------------------------------------------

type ArgbColor = { argb: string };

const C = {
  charcoal:   (): ArgbColor => ({ argb: "FF1C1917" }),
  charcoal2:  (): ArgbColor => ({ argb: "FF292524" }),
  white:      (): ArgbColor => ({ argb: "FFFFFFFF" }),
  red:        (): ArgbColor => ({ argb: "FFDC2626" }),
  lightGray:  (): ArgbColor => ({ argb: "FFF5F5F4" }),
  lighterGray:(): ArgbColor => ({ argb: "FFFAFAF9" }),
} as const;

const RIDE_TYPE_COLORS: Record<string, string> = {
  day:       "FF57534E",
  overnight: "FF2563EB",
  multiday:  "FFD97706",
  marquee:   "FF7C3AED",
};

const STATUS_COLORS: Record<string, string> = {
  planned:   "FF6B7280",
  tentative: "FFD97706",
  confirmed: "FF059669",
  postponed: "FFDC2626",
  cancelled: "FF7F1D1D",
  completed: "FF1D4ED8",
};

// ---------------------------------------------------------------------------
// Shared header-row styler
// ---------------------------------------------------------------------------

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: C.charcoal() };
    cell.font   = { bold: true, color: C.white(), size: 10, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
    cell.border = { bottom: { style: "thin", color: C.red() } };
  });
}

function styleTotalsRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: C.charcoal() };
    cell.font   = { bold: true, color: C.white(), size: 10, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { top: { style: "thin", color: C.red() } };
  });
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export async function buildRidesExcel(rides: Ride[], year: number): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator   = "TVS Nepal Ride Operations";
  wb.created   = new Date();
  wb.modified  = new Date();

  // =========================================================================
  // Sheet 1 - All Rides
  // =========================================================================

  const ws1 = wb.addWorksheet("All Rides", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
    pageSetup: {
      orientation: "landscape",
      fitToPage:   true,
      fitToWidth:  1,
      fitToHeight: 0,
      paperSize:   9, // A4
    },
  });

  ws1.columns = [
    { header: "#",             key: "no",           width:  5 },
    { header: "Date",          key: "date",          width: 22 },
    { header: "Title",         key: "title",         width: 36 },
    { header: "Type",          key: "type",          width: 12 },
    { header: "Chapter",       key: "chapter",       width: 12 },
    { header: "Status",        key: "status",        width: 12 },
    { header: "Priority",      key: "priority",      width: 10 },
    { header: "Exp. Riders",   key: "riders",        width: 12 },
    { header: "Marshal",       key: "marshal",       width: 22 },
    { header: "Distance (km)", key: "distance",      width: 14 },
    { header: "Registration",  key: "registration",  width: 35 },
  ];

  styleHeaderRow(ws1.getRow(1));

  rides.forEach((ride, idx) => {
    const row = ws1.addRow({
      no:           idx + 1,
      date:         formatRideDateRange(ride.startDate, ride.endDate),
      title:        ride.title,
      type:         cap(ride.rideType),
      chapter:      ride.location,
      status:       cap(ride.status),
      priority:     cap(ride.priority),
      riders:       ride.expectedRiders,
      marshal:      ride.marshal?.name ?? "-",
      distance:     ride.routeData?.totalDistanceKm ?? "",
      registration: ride.registrationLink ?? "",
    });

    row.height = 18;
    const bg = idx % 2 === 0 ? C.lighterGray() : C.lightGray();

    row.eachCell((cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: bg };
      cell.font      = { size: 9.5, name: "Calibri" };
      cell.alignment = { vertical: "middle" };
    });

    // Ride type - colored bold
    const typeColor = RIDE_TYPE_COLORS[ride.rideType];
    if (typeColor) {
      row.getCell("type").font = {
        bold: true, color: { argb: typeColor }, size: 9.5, name: "Calibri",
      };
    }

    // Status - colored bold
    const statColor = STATUS_COLORS[ride.status];
    if (statColor) {
      row.getCell("status").font = {
        bold: true, color: { argb: statColor }, size: 9.5, name: "Calibri",
      };
    }

    // Registration - hyperlink
    if (ride.registrationLink) {
      const regCell = row.getCell("registration");
      regCell.value = { text: ride.registrationLink, hyperlink: ride.registrationLink };
      regCell.font  = {
        color: { argb: "FF2563EB" }, size: 9.5, name: "Calibri", underline: true,
      };
    }
  });

  ws1.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 12 } };

  // =========================================================================
  // Sheet 2 - Monthly Summary
  // =========================================================================

  const ws2 = wb.addWorksheet("Monthly Summary", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  ws2.columns = [
    { header: "Month",     key: "month",    width: 14 },
    { header: "Day",       key: "day",      width:  9 },
    { header: "Overnight", key: "overnight",width: 12 },
    { header: "Multi-Day", key: "multiday", width: 12 },
    { header: "Marquee",   key: "marquee",  width: 11 },
    { header: "Total",     key: "total",    width:  9 },
  ];

  styleHeaderRow(ws2.getRow(1));

  MONTHS.forEach((monthName, mIdx) => {
    const prefix  = `${year}-${String(mIdx + 1).padStart(2, "0")}`;
    const mr      = rides.filter((r) => r.startDate.startsWith(prefix));

    const row = ws2.addRow({
      month:    monthName,
      day:      mr.filter((r) => r.rideType === "day").length,
      overnight:mr.filter((r) => r.rideType === "overnight").length,
      multiday: mr.filter((r) => r.rideType === "multiday").length,
      marquee:  mr.filter((r) => r.rideType === "marquee").length,
      total:    mr.length,
    });

    row.height = 18;
    const bg = mIdx % 2 === 0 ? C.lighterGray() : C.lightGray();

    row.eachCell((cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: bg };
      cell.font      = { size: 9.5, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    row.getCell("month").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("total").font = { bold: true, size: 9.5, name: "Calibri" };

    // Highlight marquee months in red
    const mqCell = row.getCell("marquee");
    if (mr.some((r) => r.rideType === "marquee")) {
      mqCell.font = { bold: true, color: C.red(), size: 9.5, name: "Calibri" };
    }
  });

  // Totals row
  const totRow2 = ws2.addRow({
    month:    "TOTAL",
    day:      rides.filter((r) => r.rideType === "day").length,
    overnight:rides.filter((r) => r.rideType === "overnight").length,
    multiday: rides.filter((r) => r.rideType === "multiday").length,
    marquee:  rides.filter((r) => r.rideType === "marquee").length,
    total:    rides.length,
  });
  styleTotalsRow(totRow2);
  totRow2.getCell("month").alignment = { vertical: "middle", horizontal: "left" };

  // =========================================================================
  // Sheet 3 - Chapter Summary
  // =========================================================================

  const ws3 = wb.addWorksheet("Chapter Summary", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  ws3.columns = [
    { header: "Chapter",   key: "chapter",   width: 14 },
    { header: "Region",    key: "region",    width: 26 },
    { header: "Priority",  key: "priority",  width: 11 },
    { header: "Day",       key: "day",       width:  9 },
    { header: "Overnight", key: "overnight", width: 12 },
    { header: "Multi-Day", key: "multiday",  width: 12 },
    { header: "Marquee",   key: "marquee",   width: 11 },
    { header: "Total",     key: "total",     width:  9 },
  ];

  styleHeaderRow(ws3.getRow(1));

  CHAPTERS.forEach((ch, idx) => {
    const cr = rides.filter((r) => r.location === ch.name);

    const row = ws3.addRow({
      chapter:   ch.name,
      region:    ch.region,
      priority:  ch.isPriority ? "Priority" : "Standard",
      day:       cr.filter((r) => r.rideType === "day").length,
      overnight: cr.filter((r) => r.rideType === "overnight").length,
      multiday:  cr.filter((r) => r.rideType === "multiday").length,
      marquee:   cr.filter((r) => r.rideType === "marquee").length,
      total:     cr.length,
    });

    row.height = 18;
    const bg = idx % 2 === 0 ? C.lighterGray() : C.lightGray();

    row.eachCell((cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: bg };
      cell.font      = { size: 9.5, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    row.getCell("chapter").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("region").alignment  = { vertical: "middle", horizontal: "left" };
    row.getCell("total").font        = { bold: true, size: 9.5, name: "Calibri" };

    if (ch.isPriority) {
      row.getCell("priority").font = {
        bold: true, color: C.red(), size: 9.5, name: "Calibri",
      };
    }
  });

  // Totals row
  const totRow3 = ws3.addRow({
    chapter:   "ALL CHAPTERS",
    region:    "",
    priority:  "",
    day:       rides.filter((r) => r.rideType === "day").length,
    overnight: rides.filter((r) => r.rideType === "overnight").length,
    multiday:  rides.filter((r) => r.rideType === "multiday").length,
    marquee:   rides.filter((r) => r.rideType === "marquee").length,
    total:     rides.length,
  });
  styleTotalsRow(totRow3);
  totRow3.getCell("chapter").alignment = { vertical: "middle", horizontal: "left" };

  // =========================================================================
  // Return Buffer
  // =========================================================================

  // exceljs writeBuffer returns a legacy Buffer type; cast needed for TS generics
  const buf = await wb.xlsx.writeBuffer();
  return buf as unknown as Buffer;
}
