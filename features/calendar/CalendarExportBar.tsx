// =============================================================================
// CalendarExportBar - Public PDF download bar at the bottom of the calendar
// 'use client' — triggers a browser download from the public /api/export/pdf
// =============================================================================

"use client";

import { useState } from "react";
import { FileDown, FileText, Loader2, Check } from "lucide-react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Download helper
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
// Component
// ---------------------------------------------------------------------------

interface CalendarExportBarProps {
  year: number;
}

export function CalendarExportBar({ year }: CalendarExportBarProps) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleDownload = async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      await triggerDownload(
        `/api/export/pdf?year=${year}`,
        `tvs-nepal-calendar-${year}.pdf`,
      );
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <div className="border-t border-tvs-charcoal-800/60 bg-tvs-charcoal-950/80 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Info */}
        <div className="flex items-center gap-2.5 text-sm text-tvs-charcoal-400">
          <FileText className="size-4 text-tvs-charcoal-600 shrink-0" />
          <span>
            Download the full <span className="text-tvs-charcoal-200 font-semibold">{year}</span> ride calendar as a branded PDF
          </span>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={state === "loading"}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold",
            "border transition-all duration-200 whitespace-nowrap shrink-0",
            "disabled:cursor-not-allowed disabled:opacity-60",
            state === "done"  && "bg-emerald-600/15 border-emerald-700/40 text-emerald-400",
            state === "error" && "bg-red-900/20 border-red-800/40 text-red-400",
            state === "loading" && "bg-tvs-charcoal-800/50 border-tvs-charcoal-700/40 text-tvs-charcoal-400",
            state === "idle"  && "bg-tvs-red-600/10 border-tvs-red-700/40 text-tvs-red-400 hover:bg-tvs-red-600/20 hover:border-tvs-red-600/60",
          )}
        >
          {state === "loading" && <Loader2 className="size-3.5 animate-spin" />}
          {state === "done"    && <Check   className="size-3.5" />}
          {state === "idle"    && <FileDown className="size-3.5" />}

          {state === "loading" && "Generating PDF…"}
          {state === "done"    && "Downloaded!"}
          {state === "error"   && "Error — try again"}
          {state === "idle"    && `Download ${year} PDF`}
        </button>
      </div>
    </div>
  );
}
