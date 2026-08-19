// =============================================================================
// Payments export
//
// One question this file exists to answer: what money came in this year, from
// whom, and were they a member at the time.
//
// The rows are deliberately flat and mixed. Ride fees and shop orders are two
// tables in the database but they are one column in a ledger, and splitting
// them across sheets would mean adding up two numbers to answer "what did we
// take in March". A Type column costs one filter click instead.
//
// The year is the year the money arrived — the registration or order date —
// not the year of the ride it was for. A deposit taken in December for a
// January ride belongs in December's books, which is the whole reason anyone
// downloads this.
// =============================================================================

import ExcelJS from "exceljs";
import { APP_META, MONTHS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Row shape
// ---------------------------------------------------------------------------

/**
 * Three answers, not two. "Member: no" would lump together somebody the club
 * turned down, somebody still waiting to be approved, and a guest who never
 * asked — and those are three different conversations to have about a payment.
 */
export type MembershipStanding = "Member" | "Pending" | "Rejected" | "Guest";

export interface PaymentRow {
  /** ISO timestamp the payment was recorded. */
  date:        string;
  type:        "Ride" | "Shop";
  /** Access code — what the payer quotes and what the club looks up. */
  reference:   string;
  /** Ride title, or a summary of what was ordered. */
  what:        string;
  fullName:    string;
  standing:    MembershipStanding;
  /** Their tier at the time, if the club runs tiers. */
  tier:        string | null;
  phone:       string;
  email:       string | null;
  amount:      number;
  /** The transaction id the payer quoted, if any. */
  paymentRef:  string | null;
  /** True when a screenshot was attached — the club's proof of payment. */
  hasProof:    boolean;
  status:      string;
  approvedAt:  string | null;
}

// ---------------------------------------------------------------------------
// Colour helpers — ARGB (alpha + 6 hex, no #), same palette as the rides export
// ---------------------------------------------------------------------------

const C = {
  charcoal:    "FF1C1917",
  white:       "FFFFFFFF",
  ember:       "FFF09020",
  lightGray:   "FFF5F5F4",
  lighterGray: "FFFAFAF9",
} as const;

const STANDING_COLOURS: Record<MembershipStanding, string> = {
  Member:   "FF059669",
  Pending:  "FFD97706",
  Rejected: "FFDC2626",
  Guest:    "FF6B7280",
};

const STATUS_COLOURS: Record<string, string> = {
  approved:  "FF059669",
  pending:   "FFD97706",
  rejected:  "FFDC2626",
  fulfilled: "FF1D4ED8",
  cancelled: "FF7F1D1D",
};

const fill = (argb: string): ExcelJS.Fill =>
  ({ type: "pattern", pattern: "solid", fgColor: { argb } });

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.fill      = fill(C.charcoal);
    cell.font      = { bold: true, color: { argb: C.white }, size: 10, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border    = { bottom: { style: "thin", color: { argb: C.ember } } };
  });
}

/** dd Mmm yyyy from an ISO timestamp; blank rather than "Invalid Date". */
const fmtDate = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export async function buildPaymentsExcel(
  rows: PaymentRow[],
  year: number,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = APP_META.name;
  wb.created  = new Date();

  // Oldest first: a ledger reads forwards.
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));

  // ── Sheet 1 — Payments ────────────────────────────────────────────────────
  const sheet = wb.addWorksheet("Payments", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Date",        key: "date",       width: 13 },
    { header: "Type",        key: "type",       width: 8  },
    { header: "Reference",   key: "reference",  width: 14 },
    { header: "For",         key: "what",       width: 34 },
    { header: "Name",        key: "fullName",   width: 24 },
    { header: "Membership",  key: "standing",   width: 12 },
    { header: "Tier",        key: "tier",       width: 14 },
    { header: "Phone",       key: "phone",      width: 16 },
    { header: "Email",       key: "email",      width: 26 },
    { header: "Amount",      key: "amount",     width: 12 },
    { header: "Txn ref",     key: "paymentRef", width: 18 },
    { header: "Proof",       key: "hasProof",   width: 8  },
    { header: "Status",      key: "status",     width: 11 },
    { header: "Approved on", key: "approvedAt", width: 13 },
  ];

  styleHeaderRow(sheet.getRow(1));

  for (const r of sorted) {
    const row = sheet.addRow({
      date:       fmtDate(r.date),
      type:       r.type,
      reference:  r.reference,
      what:       r.what,
      fullName:   r.fullName,
      standing:   r.standing,
      tier:       r.tier ?? "",
      phone:      r.phone,
      email:      r.email ?? "",
      amount:     r.amount,
      paymentRef: r.paymentRef ?? "",
      hasProof:   r.hasProof ? "Yes" : "—",
      status:     r.status,
      approvedAt: fmtDate(r.approvedAt),
    });

    row.getCell("amount").numFmt    = '"Rs "#,##0.00';
    row.getCell("amount").alignment = { horizontal: "right" };

    const standingCell = row.getCell("standing");
    standingCell.font      = { bold: true, size: 10, color: { argb: STANDING_COLOURS[r.standing] } };
    standingCell.alignment = { horizontal: "center" };

    const statusCell = row.getCell("status");
    statusCell.font      = { bold: true, size: 10, color: { argb: STATUS_COLOURS[r.status] ?? C.charcoal } };
    statusCell.alignment = { horizontal: "center" };

    row.getCell("type").alignment     = { horizontal: "center" };
    row.getCell("hasProof").alignment = { horizontal: "center" };
    row.getCell("reference").font     = { name: "Consolas", size: 10 };
  }

  // Banding, applied after the fact so it does not fight the coloured cells.
  sheet.eachRow((row, i) => {
    if (i > 1 && i % 2 === 0) {
      row.eachCell((cell) => { if (!cell.fill) cell.fill = fill(C.lighterGray); });
    }
  });

  sheet.autoFilter = { from: "A1", to: { row: 1, column: sheet.columns.length } };

  // A total that only counts money actually taken. Pending and rejected rows
  // stay visible above — they are the follow-up list — but adding them into
  // the total would report income the club has not received.
  const collected = sorted
    .filter((r) => r.status === "approved" || r.status === "fulfilled")
    .reduce((sum, r) => sum + r.amount, 0);

  sheet.addRow([]);
  const totalRow = sheet.addRow({ email: "Collected (approved only)", amount: collected });
  totalRow.getCell("email").font      = { bold: true, size: 11 };
  totalRow.getCell("email").alignment = { horizontal: "right" };
  totalRow.getCell("amount").numFmt   = '"Rs "#,##0.00';
  totalRow.getCell("amount").font     = { bold: true, size: 11 };
  totalRow.getCell("amount").fill     = fill(C.lightGray);

  // ── Sheet 2 — Summary ─────────────────────────────────────────────────────
  const summary = wb.addWorksheet("Summary");

  summary.columns = [
    { header: "Month",     key: "month",     width: 14 },
    { header: "Payments",  key: "count",     width: 11 },
    { header: "Rides",     key: "rides",     width: 12 },
    { header: "Shop",      key: "shop",      width: 12 },
    { header: "Collected", key: "collected", width: 14 },
    { header: "Awaiting",  key: "awaiting",  width: 14 },
  ];
  styleHeaderRow(summary.getRow(1));

  const isCollected = (r: PaymentRow) => r.status === "approved" || r.status === "fulfilled";
  const isAwaiting  = (r: PaymentRow) => r.status === "pending";

  MONTHS.forEach((name, i) => {
    const inMonth = sorted.filter((r) => new Date(r.date).getMonth() === i);
    const row = summary.addRow({
      month:     name,
      count:     inMonth.length,
      rides:     inMonth.filter((r) => r.type === "Ride").reduce((s, r) => s + (isCollected(r) ? r.amount : 0), 0),
      shop:      inMonth.filter((r) => r.type === "Shop").reduce((s, r) => s + (isCollected(r) ? r.amount : 0), 0),
      collected: inMonth.filter(isCollected).reduce((s, r) => s + r.amount, 0),
      awaiting:  inMonth.filter(isAwaiting).reduce((s, r) => s + r.amount, 0),
    });
    for (const key of ["rides", "shop", "collected", "awaiting"]) {
      row.getCell(key).numFmt = '"Rs "#,##0.00';
    }
    row.getCell("count").alignment = { horizontal: "center" };
  });

  const totals = summary.addRow({
    month:     "Total",
    count:     sorted.length,
    rides:     sorted.filter((r) => r.type === "Ride" && isCollected(r)).reduce((s, r) => s + r.amount, 0),
    shop:      sorted.filter((r) => r.type === "Shop" && isCollected(r)).reduce((s, r) => s + r.amount, 0),
    collected,
    awaiting:  sorted.filter(isAwaiting).reduce((s, r) => s + r.amount, 0),
  });
  totals.height = 22;
  totals.eachCell((cell) => {
    cell.font   = { bold: true, size: 11 };
    cell.fill   = fill(C.lightGray);
    cell.border = { top: { style: "thin", color: { argb: C.ember } } };
  });
  for (const key of ["rides", "shop", "collected", "awaiting"]) {
    totals.getCell(key).numFmt = '"Rs "#,##0.00';
  }

  // Who the money came from. The reason "member or not" is on every row is
  // that this breakdown is the question behind the request.
  summary.addRow([]);
  const bandHeader = summary.addRow({ month: "Standing", count: "Payments", rides: "Collected" });
  styleHeaderRow(bandHeader);

  for (const standing of ["Member", "Pending", "Rejected", "Guest"] as MembershipStanding[]) {
    const band = sorted.filter((r) => r.standing === standing);
    if (!band.length) continue;
    const row = summary.addRow({
      month: standing,
      count: band.length,
      rides: band.filter(isCollected).reduce((s, r) => s + r.amount, 0),
    });
    row.getCell("month").font      = { bold: true, color: { argb: STANDING_COLOURS[standing] } };
    row.getCell("count").alignment = { horizontal: "center" };
    row.getCell("rides").numFmt    = '"Rs "#,##0.00';
  }

  summary.addRow([]);
  const note = summary.addRow({
    month: `${year} — dated by when the payment was recorded, not by ride date.`,
  });
  note.getCell("month").font = { italic: true, size: 9, color: { argb: "FF6B7280" } };

  const out = await wb.xlsx.writeBuffer();
  return out as unknown as Buffer;
}
