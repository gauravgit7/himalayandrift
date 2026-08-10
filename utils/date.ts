// =============================================================================
// Date utility functions for ride scheduling
// =============================================================================

import {
  format,
  parseISO,
  isAfter,
  isBefore,
  isSameDay,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  startOfWeek,
  endOfWeek,
  isToday,
  isPast,
  isFuture,
} from "date-fns";

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** "15 Jan 2026" */
export function formatRideDate(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM yyyy");
}

/** "15–17 Jan 2026" or "15 Jan – 2 Feb 2026" */
export function formatRideDateRange(startStr: string, endStr: string): string {
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  if (isSameDay(start, end)) return format(start, "d MMM yyyy");
  if (format(start, "MMM yyyy") === format(end, "MMM yyyy")) {
    return `${format(start, "d")}–${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
}

/** "Jan 2026" */
export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month, 1), "MMM yyyy");
}

/** "Saturday, 15 January" */
export function formatFullDate(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE, d MMMM");
}

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

/** Returns number of ride days (inclusive) */
export function getRideDurationDays(startStr: string, endStr: string): number {
  return differenceInDays(parseISO(endStr), parseISO(startStr)) + 1;
}

// ---------------------------------------------------------------------------
// Calendar grid helpers
// ---------------------------------------------------------------------------

/** Returns all calendar cells for a month view (including padding days) */
export function getMonthCalendarDays(year: number, month: number): Date[] {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart); // pad to Sunday
  const calEnd = endOfWeek(monthEnd);       // pad to Saturday
  return eachDayOfInterval({ start: calStart, end: calEnd });
}

/** Day-of-week index for a date (0 = Sun) */
export function getDayOfWeek(dateStr: string): number {
  return getDay(parseISO(dateStr));
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export function rideIsUpcoming(startStr: string): boolean {
  return isFuture(parseISO(startStr));
}

export function rideIsActive(startStr: string, endStr: string): boolean {
  const now = new Date();
  return (
    (isAfter(now, parseISO(startStr)) || isSameDay(now, parseISO(startStr))) &&
    (isBefore(now, parseISO(endStr))  || isSameDay(now, parseISO(endStr)))
  );
}

export function rideIsPast(endStr: string): boolean {
  return isPast(parseISO(endStr)) && !isToday(parseISO(endStr));
}

// ---------------------------------------------------------------------------
// Ride-date-range overlap check (used for conflict detection)
// ---------------------------------------------------------------------------

export function ridesOverlap(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string }
): boolean {
  const aStart = parseISO(a.startDate);
  const aEnd   = parseISO(a.endDate);
  const bStart = parseISO(b.startDate);
  const bEnd   = parseISO(b.endDate);
  return isBefore(aStart, bEnd) && isAfter(aEnd, bStart);
}

// ---------------------------------------------------------------------------
// Re-exports from date-fns (avoids scattered imports in the app)
// ---------------------------------------------------------------------------

export { format, parseISO, isSameDay, addDays, isToday, isPast, isFuture };
