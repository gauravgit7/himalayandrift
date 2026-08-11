// =============================================================================
// PDF Calendar Builder - Phase 8 · @react-pdf/renderer
// Generates a branded A4 PDF with cover page + 12 monthly ride tables.
// Server-side only - import exclusively from API routes or Server Actions.
// =============================================================================

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Ride, BrandLogos } from "@/types";
import { MONTHS, APP_META } from "@/lib/constants";
import { computeRideStats } from "@/utils/ride";
import { formatRideDateRange } from "@/utils/date";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const P = {
  dark:    "#1C1917",   // charcoal 950
  dark2:   "#292524",   // charcoal 900
  dark3:   "#44403C",   // charcoal 700
  ember:   "#F09020",
  gray:    "#78716C",   // charcoal 500
  border:  "#E7E5E4",   // charcoal 200
  lgray:   "#F5F5F4",   // charcoal 100
  lgray2:  "#FAFAF9",   // charcoal 50
  white:   "#FFFFFF",
} as const;

const STATUS_COLORS: Record<string, string> = {
  planned:   "#6B7280",
  tentative: "#D97706",
  confirmed: "#059669",
  postponed: "#DC2626",
  cancelled: "#7F1D1D",
  completed: "#1D4ED8",
};

// ---------------------------------------------------------------------------
// Column widths (A4 = 595pt; margins 40pt each side → 515pt content)
// ---------------------------------------------------------------------------

const COL = {
  date:      100,
  title:     175,
  type:       58,
  location:   76,
  status:     50,
} as const;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = StyleSheet.create({
  // ── Pages ────────────────────────────────────────────────────────────────
  coverPage: {
    backgroundColor: P.dark,
    padding: 0,
  },
  contentPage: {
    backgroundColor: P.white,
    paddingTop: 56,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: "Helvetica",
  },

  // ── Cover layout ─────────────────────────────────────────────────────────
  coverWrap: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 48,
  },
  coverTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coverDot: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: P.ember,
    marginRight: 10,
  },
  coverBrand: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: P.white,
    letterSpacing: 2,
  },
  coverYear: {
    fontSize: 100,
    fontFamily: "Helvetica-Bold",
    color: P.ember,
    lineHeight: 1,
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: P.white,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  coverSubtitle: {
    fontSize: 11,
    color: P.gray,
    marginTop: 6,
  },
  coverRule: {
    height: 2,
    width: 56,
    backgroundColor: P.ember,
    marginTop: 28,
    marginBottom: 28,
  },
  coverStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  coverStatBox: {
    marginRight: 36,
    marginBottom: 8,
  },
  coverStatNum: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: P.white,
    lineHeight: 1,
  },
  coverStatLabel: {
    fontSize: 8,
    color: P.gray,
    marginTop: 3,
    letterSpacing: 1.5,
  },
  coverBadgesRow: {
    flexDirection: "row",
    marginTop: 28,
  },
  coverBadge: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 4,
    marginRight: 8,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: P.white,
    letterSpacing: 0.8,
  },
  coverFooter: {
    fontSize: 7.5,
    color: P.gray,
    letterSpacing: 1.5,
  },

  // ── Fixed page header (appears on every content page) ────────────────────
  pageHeaderWrap: {
    position: "absolute",
    top: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 0.75,
    borderBottomColor: P.ember,
  },
  pageHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  pageHeaderDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: P.ember,
    marginRight: 6,
  },
  pageHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: P.dark,
    letterSpacing: 1,
  },
  pageNum: {
    fontSize: 7.5,
    color: P.gray,
  },
  pageHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Brand logo in page header (left side) — slightly larger for visibility
  headerTvsLogo: {
    height: 22,
    width: 66,
    objectFit: "contain",
    marginRight: 6,
  },
  // Legacy alias used in cover page
  headerLogo: {
    height: 18,
    width: 54,
    objectFit: "contain",
  },
  coverLogo: {
    height: 44,
    width: 100,
    objectFit: "contain",
    marginRight: 10,
  },

  // ── Month section ─────────────────────────────────────────────────────────
  monthBlock: {
    marginBottom: 18,
  },
  monthHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: P.dark,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4,
    marginBottom: 0,
  },
  monthTitle: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: P.white,
  },
  monthCountText: {
    fontSize: 8.5,
    color: P.dark3,
  },
  emptyMonthText: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    fontSize: 8,
    color: P.gray,
    fontFamily: "Helvetica-Oblique",
    borderBottomWidth: 0.5,
    borderBottomColor: P.border,
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: P.lgray,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 4,
    paddingRight: 4,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  tableHeaderCell: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: P.gray,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 4,
    paddingRight: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: P.border,
  },
  tableRowAlt: {
    backgroundColor: P.lgray2,
  },
  cell: {
    fontSize: 8.5,
    color: P.dark,
  },
  cellGray: {
    fontSize: 8.5,
    color: P.gray,
  },
  cellBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },

  // Column widths
  colDate:      { width: COL.date      },
  colTitle:     { width: COL.title     },
  colType:      { width: COL.type      },
  colLocation:  { width: COL.location  },
  colStatus:    { width: COL.status    },
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CoverPage({
  year, total, day, multiday, marquee, overnight, brandLogos,
}: {
  year: number;
  total: number;
  day: number;
  multiday: number;
  marquee: number;
  overnight: number;
  brandLogos?: BrandLogos | null;
}) {
  return (
    <View style={S.coverWrap}>
      {/* Brand row */}
      <View style={S.coverTopRow}>
        {brandLogos?.logoUrl ? (
          <Image src={brandLogos.logoUrl} style={S.coverLogo} />
        ) : (
          <View style={S.coverDot} />
        )}
        <Text style={S.coverBrand}>{APP_META.name.toUpperCase()}</Text>
      </View>

      {/* Hero block */}
      <View>
        <Text style={S.coverYear}>{year}</Text>
        <Text style={S.coverTitle}>Annual Ride Operations Calendar</Text>
        <Text style={S.coverSubtitle}>{APP_META.name} · Nepal</Text>

        <View style={S.coverRule} />

        {/* Stats */}
        <View style={S.coverStatsRow}>
          <View style={S.coverStatBox}>
            <Text style={S.coverStatNum}>{total}</Text>
            <Text style={S.coverStatLabel}>TOTAL RIDES</Text>
          </View>
          <View style={S.coverStatBox}>
            <Text style={S.coverStatNum}>{day}</Text>
            <Text style={S.coverStatLabel}>DAY RIDES</Text>
          </View>
          <View style={S.coverStatBox}>
            <Text style={S.coverStatNum}>{overnight}</Text>
            <Text style={S.coverStatLabel}>OVERNIGHT</Text>
          </View>
          <View style={S.coverStatBox}>
            <Text style={S.coverStatNum}>{multiday}</Text>
            <Text style={S.coverStatLabel}>MULTI-DAY</Text>
          </View>
          <View style={S.coverStatBox}>
            <Text style={S.coverStatNum}>{marquee}</Text>
            <Text style={S.coverStatLabel}>MARQUEE</Text>
          </View>
        </View>

        {/* Brand badge */}
        <View style={S.coverBadgesRow}>
          <Text style={[S.coverBadge, { backgroundColor: P.ember, alignSelf: "center" }]}>
            {APP_META.shortName}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={S.coverFooter}>
        {APP_META.name.toUpperCase()} · CONFIDENTIAL · OPERATIONS DOCUMENT · {year}
      </Text>
    </View>
  );
}

function PageHeader({ year, brandLogos }: { year: number; brandLogos?: BrandLogos | null }) {
  return (
    <View style={S.pageHeaderWrap} fixed>
      {/* Left: brand logo + title */}
      <View style={S.pageHeaderLeft}>
        {brandLogos?.logoUrl ? (
          <Image src={brandLogos.logoUrl} style={S.headerTvsLogo} />
        ) : (
          <View style={S.pageHeaderDot} />
        )}
        <Text style={S.pageHeaderText}>
          {APP_META.name.toUpperCase()} · {year} RIDE CALENDAR
        </Text>
      </View>

      {/* Right: page number */}
      <View style={S.pageHeaderRight}>
        <Text
          style={S.pageNum}
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </View>
    </View>
  );
}

function TableHeaderRow() {
  return (
    <View style={S.tableHeaderRow}>
      <Text style={[S.tableHeaderCell, S.colDate]}>DATE</Text>
      <Text style={[S.tableHeaderCell, S.colTitle]}>TITLE</Text>
      <Text style={[S.tableHeaderCell, S.colType]}>TYPE</Text>
      <Text style={[S.tableHeaderCell, S.colLocation]}>LOCATION</Text>
      <Text style={[S.tableHeaderCell, S.colStatus]}>STATUS</Text>
    </View>
  );
}

function RideRow({ ride, idx }: { ride: Ride; idx: number }) {
  const statusColor = STATUS_COLORS[ride.status] ?? P.gray;

  return (
    <View style={[S.tableRow, idx % 2 === 1 ? S.tableRowAlt : {}]}>
      <Text style={[S.cellGray, S.colDate]}>
        {formatRideDateRange(ride.startDate, ride.endDate)}
      </Text>
      <Text style={[S.cell, S.colTitle]}>
        {ride.title}
      </Text>
      <Text style={[S.cellGray, S.colType]}>
        {ride.rideType.charAt(0).toUpperCase() + ride.rideType.slice(1)}
      </Text>
      <Text style={[S.cellGray, S.colLocation]}>
        {ride.location}
      </Text>
      <Text style={[S.cellBold, S.colStatus, { color: statusColor }]}>
        {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
      </Text>
    </View>
  );
}

function MonthSection({
  monthName, rides,
}: {
  monthName: string;
  rides: Ride[];
}) {
  return (
    <View style={S.monthBlock}>
      {/*
        Wrap the header + col headers + first ride together so the
        month title never appears orphaned at the bottom of a page.
      */}
      <View wrap={false}>
        <View style={S.monthHeaderBar}>
          <Text style={S.monthTitle}>{monthName.toUpperCase()}</Text>
          <Text style={S.monthCountText}>
            {rides.length === 0
              ? "No rides"
              : `${rides.length} ride${rides.length === 1 ? "" : "s"}`}
          </Text>
        </View>
        {rides.length === 0 ? (
          <Text style={S.emptyMonthText}>No rides scheduled this month.</Text>
        ) : (
          <>
            <TableHeaderRow />
            <RideRow ride={rides[0]} idx={0} />
          </>
        )}
      </View>

      {/* Remaining rows flow across page boundaries naturally */}
      {rides.slice(1).map((ride, i) => (
        <RideRow key={ride.id} ride={ride} idx={i + 1} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

function CalendarDocument({ rides, year, brandLogos }: { rides: Ride[]; year: number; brandLogos?: BrandLogos | null }) {
  const stats = computeRideStats(rides);

  return (
    <Document
      title={`${APP_META.name} Ride Calendar ${year}`}
      author={APP_META.name}
      subject="Annual Ride Operations Calendar"
      creator={`${APP_META.name} Ride Operations Platform`}
      keywords={`${APP_META.name} rides calendar Nepal`}
    >
      {/* ── Cover page ── */}
      <Page size="A4" style={S.coverPage}>
        <CoverPage
          year={year}
          total={stats.total}
          day={stats.byType.day}
          multiday={stats.byType.multiday}
          marquee={stats.byType.marquee}
          overnight={stats.byType.overnight}
          brandLogos={brandLogos}
        />
      </Page>

      {/* ── Calendar content (auto-paginates) ── */}
      <Page size="A4" style={S.contentPage}>
        <PageHeader year={year} brandLogos={brandLogos} />

        {MONTHS.map((monthName, mIdx) => {
          const prefix     = `${year}-${String(mIdx + 1).padStart(2, "0")}`;
          const monthRides = rides.filter((r) => r.startDate.startsWith(prefix));
          return (
            <MonthSection key={mIdx} monthName={monthName} rides={monthRides} />
          );
        })}
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

export async function buildCalendarPdf(
  rides: Ride[],
  year: number,
  brandLogos?: BrandLogos | null,
): Promise<Buffer> {
  return renderToBuffer(
    <CalendarDocument rides={rides} year={year} brandLogos={brandLogos} />
  );
}
