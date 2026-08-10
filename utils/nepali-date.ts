// =============================================================================
// Nepali Date (Bikram Sambat) conversion utilities
// Uses nepali-date-converter (pure JS, no API key required)
// =============================================================================

import NepaliDate from "nepali-date-converter";
import { dateConfigMap } from "nepali-date-converter";

// ---------------------------------------------------------------------------
// BS month names (0-indexed, matching nepali-date-converter's getMonth())
// Note: keys in dateConfigMap use "Asar"/"Aswin"; we display friendlier names.
// ---------------------------------------------------------------------------

export const BS_MONTHS = [
  "Baisakh",  // 0 - mid Apr → mid May
  "Jestha",   // 1 - mid May → mid Jun
  "Ashadh",   // 2 - mid Jun → mid Jul
  "Shrawan",  // 3 - mid Jul → mid Aug
  "Bhadra",   // 4 - mid Aug → mid Sep
  "Ashwin",   // 5 - mid Sep → mid Oct
  "Kartik",   // 6 - mid Oct → mid Nov
  "Mangsir",  // 7 - mid Nov → mid Dec
  "Poush",    // 8 - mid Dec → mid Jan
  "Magh",     // 9 - mid Jan → mid Feb
  "Falgun",   // 10 - mid Feb → mid Mar
  "Chaitra",  // 11 - mid Mar → mid Apr
] as const;

export const SHORT_BS_MONTHS = [
  "Bai", "Jes", "Ash", "Shr", "Bha", "Ash",
  "Kar", "Man", "Pou", "Mag", "Fal", "Cha",
] as const;

// Internal keys used by dateConfigMap (must match exactly)
const DATE_CONFIG_KEYS = [
  "Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Aswin",
  "Kartik",  "Mangsir", "Poush", "Magh",  "Falgun", "Chaitra",
] as const;

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

export interface BsDate {
  year:       number;
  month:      number;   // 0-indexed
  day:        number;
  monthName:  string;
}

/** Convert an ISO date string ("YYYY-MM-DD") to Bikram Sambat components. */
export function adToBs(isoDate: string): BsDate {
  const ad    = new Date(isoDate + "T00:00:00");
  const bs    = new NepaliDate(ad);
  const month = bs.getMonth(); // 0-11
  return {
    year:      bs.getYear(),
    month,
    day:       bs.getDate(),
    monthName: BS_MONTHS[month] ?? "",
  };
}

/**
 * Format an ISO date as a short BS string.
 * e.g. "2026-04-14"  →  "2083 Baisakh 1"
 */
export function formatBsDate(isoDate: string): string {
  const { year, monthName, day } = adToBs(isoDate);
  return `${year} ${monthName} ${day}`;
}

/**
 * Format a date range in BS.
 * Same month: "2083 Baisakh 1–4"
 * Same year:  "2083 Baisakh 30 – Jestha 2"
 * Cross-year: "2082 Chaitra 30 – 2083 Baisakh 2"
 */
export function formatBsDateRange(startIso: string, endIso: string): string {
  const s = adToBs(startIso);
  const e = adToBs(endIso);

  if (s.year === e.year && s.month === e.month) {
    if (s.day === e.day) return `${s.year} ${s.monthName} ${s.day}`;
    return `${s.year} ${s.monthName} ${s.day}–${e.day}`;
  }
  if (s.year === e.year) {
    return `${s.year} ${s.monthName} ${s.day} – ${e.monthName} ${e.day}`;
  }
  return `${s.year} ${s.monthName} ${s.day} – ${e.year} ${e.monthName} ${e.day}`;
}

// ---------------------------------------------------------------------------
// BS calendar grid utilities
// ---------------------------------------------------------------------------

/**
 * Given an AD year, return the BS year whose Baisakh 1 falls in that AD year.
 * e.g. 2026 → 2083  (because 2083 Baisakh 1 = Apr 14, 2026)
 */
export function adYearToBsYear(adYear: number): number {
  // April 14 always falls within the new BS year (Baisakh starts ~Apr 13-15)
  const nd = new NepaliDate(new Date(adYear, 3, 14));
  return nd.getYear();
}

/** How many days are in a given BS month. */
export function getBsMonthDays(bsYear: number, bsMonth: number): number {
  const yearData = (dateConfigMap as Record<number, Record<string, number>>)[bsYear];
  if (!yearData) return 30; // fallback for years outside the library's range
  return yearData[DATE_CONFIG_KEYS[bsMonth] ?? ""] ?? 30;
}

/** Produce a "YYYY-MM-DD" string from a JS Date (local time, no tz shift). */
function adDateToIso(d: Date): string {
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
}

export interface BsCalendarDay {
  bsDay:          number;   // day number within the BS month
  bsYear:         number;
  bsMonth:        number;   // 0-indexed
  adDateStr:      string;   // "YYYY-MM-DD"  ← use for ride lookup
  isCurrentMonth: boolean;
}

/**
 * Build the full calendar grid for a BS month (padded to full weeks).
 * Week starts Sunday. Cells outside the month have isCurrentMonth = false.
 */
export function getBsMonthCalendarDays(bsYear: number, bsMonth: number): BsCalendarDay[] {
  const daysInMonth = getBsMonthDays(bsYear, bsMonth);

  // AD date of the 1st day → tells us which weekday column to start on
  const firstAdDate    = new NepaliDate(bsYear, bsMonth, 1).toJsDate();
  const startDayOfWeek = firstAdDate.getDay(); // 0 = Sun

  const result: BsCalendarDay[] = [];

  // ── Prefix padding (days from the previous BS month) ──────────────────────
  const prevBsMonth = bsMonth === 0 ? 11 : bsMonth - 1;
  const prevBsYear  = bsMonth === 0 ? bsYear - 1 : bsYear;
  const daysInPrev  = getBsMonthDays(prevBsYear, prevBsMonth);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const bsDay  = daysInPrev - i;
    const adDate = new NepaliDate(prevBsYear, prevBsMonth, bsDay).toJsDate();
    result.push({ bsDay, bsYear: prevBsYear, bsMonth: prevBsMonth, adDateStr: adDateToIso(adDate), isCurrentMonth: false });
  }

  // ── Current BS month ───────────────────────────────────────────────────────
  for (let d = 1; d <= daysInMonth; d++) {
    const adDate = new NepaliDate(bsYear, bsMonth, d).toJsDate();
    result.push({ bsDay: d, bsYear, bsMonth, adDateStr: adDateToIso(adDate), isCurrentMonth: true });
  }

  // ── Suffix padding (days from the next BS month) ──────────────────────────
  const nextBsMonth = bsMonth === 11 ? 0 : bsMonth + 1;
  const nextBsYear  = bsMonth === 11 ? bsYear + 1 : bsYear;
  let nextDay = 1;
  while (result.length % 7 !== 0) {
    const adDate = new NepaliDate(nextBsYear, nextBsMonth, nextDay).toJsDate();
    result.push({ bsDay: nextDay, bsYear: nextBsYear, bsMonth: nextBsMonth, adDateStr: adDateToIso(adDate), isCurrentMonth: false });
    nextDay++;
  }

  return result;
}

/**
 * The AD date range covered by a full BS year.
 * Returns ISO strings for the first and last day.
 */
export function getBsYearAdRange(bsYear: number): { startIso: string; endIso: string } {
  const startAd = new NepaliDate(bsYear, 0, 1).toJsDate();
  const lastMonth = 11;
  const lastDay   = getBsMonthDays(bsYear, lastMonth);
  const endAd     = new NepaliDate(bsYear, lastMonth, lastDay).toJsDate();
  return { startIso: adDateToIso(startAd), endIso: adDateToIso(endAd) };
}
