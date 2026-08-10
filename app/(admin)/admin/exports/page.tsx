// =============================================================================
// Admin - Exports  (Phase 8)
// 'use client' - year picker and download-with-progress buttons.
// =============================================================================

"use client";

import { useState } from "react";
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Year range
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// ---------------------------------------------------------------------------
// Download helper - fetches from API and triggers browser save dialog
// ---------------------------------------------------------------------------

async function triggerDownload(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);

  const blob    = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor  = document.createElement("a");
  anchor.href     = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}

// ---------------------------------------------------------------------------
// Export card
// ---------------------------------------------------------------------------

interface ExportCardProps {
  icon:        React.ReactNode;
  title:       string;
  badge:       string;
  badgeColor:  string;
  description: string;
  bullets:     string[];
  filename:    (year: number) => string;
  apiPath:     string;
  buttonLabel: string;
  accentColor: string;
}

function ExportCard({
  icon, title, badge, badgeColor, description, bullets,
  filename, apiPath, buttonLabel, accentColor, year,
}: ExportCardProps & { year: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleDownload = async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      await triggerDownload(
        `${apiPath}?year=${year}`,
        filename(year),
      );
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      console.error(err);
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <div className="gradient-card rounded-2xl border border-tvs-charcoal-700/50 p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="size-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
        >
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-tvs-charcoal-50">{title}</h3>
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${badgeColor}20`,
                color:            badgeColor,
                border:           `1px solid ${badgeColor}30`,
              }}
            >
              {badge}
            </span>
          </div>
          <p className="text-sm text-tvs-charcoal-400">{description}</p>
        </div>
      </div>

      {/* Contents list */}
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-tvs-charcoal-400">
            <span className="mt-1.5 size-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
            {b}
          </li>
        ))}
      </ul>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={state === "loading"}
        className={cn(
          "mt-auto flex items-center justify-center gap-2.5 rounded-xl py-3 px-5",
          "text-sm font-semibold transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-60",
          state === "done"  && "bg-emerald-600/20 border border-emerald-700/40 text-emerald-400",
          state === "error" && "bg-red-900/20 border border-red-800/40 text-red-400",
          state === "loading" && "bg-tvs-charcoal-800/50 border border-tvs-charcoal-700/40 text-tvs-charcoal-400",
          state === "idle"  && "text-white border",
        )}
        style={state === "idle" ? {
          backgroundColor: `${accentColor}18`,
          borderColor:      `${accentColor}40`,
          color:            accentColor,
        } : undefined}
      >
        {state === "loading" && <Loader2 className="size-4 animate-spin" />}
        {state === "done"    && <Check className="size-4" />}
        {state === "error"   && <span className="text-xs">Error - try again</span>}
        {state === "idle"    && <FileDown className="size-4" />}

        {state === "loading" && "Generating…"}
        {state === "done"    && "Downloaded!"}
        {state === "idle"    && buttonLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExportsPage() {
  const [year, setYear] = useState(CURRENT_YEAR);

  return (
    <div className="p-6 sm:p-8 max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileDown className="size-5 text-tvs-red-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-tvs-red-500">
            Exports
          </span>
        </div>
        <h1 className="text-2xl font-black text-tvs-charcoal-50">Download Reports</h1>
        <p className="text-sm text-tvs-charcoal-400 mt-1">
          Generate branded PDF calendars and operational Excel spreadsheets for any year.
        </p>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-tvs-charcoal-700/50 gradient-card w-fit">
        <span className="text-sm font-semibold text-tvs-charcoal-300">Calendar Year</span>
        <div className="relative">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={cn(
              "appearance-none pl-4 pr-9 py-2 rounded-lg text-sm font-bold text-tvs-charcoal-50 cursor-pointer",
              "bg-tvs-charcoal-800 border border-tvs-charcoal-600/60",
              "hover:border-tvs-red-700/60 transition-colors",
              "focus:outline-none focus:ring-1 focus:ring-tvs-red-600/40",
            )}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-tvs-charcoal-400 pointer-events-none" />
        </div>
      </div>

      {/* Export cards */}
      <div className="grid sm:grid-cols-2 gap-5">
        <ExportCard
          year={year}
          icon={<FileText className="size-6" />}
          title="Branded PDF Calendar"
          badge="PDF"
          badgeColor="#DC2626"
          accentColor="#DC2626"
          description={`A4 document with cover page and monthly ride tables for ${year}.`}
          bullets={[
            "Cover page with Himalayan Drift branding and year stats",
            "12 monthly sections - all rides in a clean table",
            "Color-coded by ride type",
            "Status and marshal details per ride",
            "Page headers and auto page numbers",
          ]}
          apiPath="/api/export/pdf"
          filename={(y) => `tvs-nepal-calendar-${y}.pdf`}
          buttonLabel={`Download ${year} Calendar PDF`}
        />

        <ExportCard
          year={year}
          icon={<FileSpreadsheet className="size-6" />}
          title="Operational Spreadsheet"
          badge="XLSX"
          badgeColor="#059669"
          accentColor="#059669"
          description={`Fully formatted Excel workbook with all ${year} ride data across 3 sheets.`}
          bullets={[
            "Sheet 1 - All Rides: sortable, auto-filter, 12 columns",
            "Sheet 2 - Monthly Summary: counts by community and type",
            "Sheet 3 - Chapter Summary: per-chapter breakdown",
            "Color-coded community and status columns",
            "Registration hyperlinks preserved",
          ]}
          apiPath="/api/export/excel"
          filename={(y) => `tvs-nepal-rides-${y}.xlsx`}
          buttonLabel={`Download ${year} Rides Spreadsheet`}
        />
      </div>

      {/* Info note */}
      <p className="text-xs text-tvs-charcoal-600 text-center">
        Exports pull live data from Supabase at the moment of download - always up to date.
      </p>
    </div>
  );
}
