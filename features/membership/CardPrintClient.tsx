// =============================================================================
// CardPrintClient — print / download page shell
// White page background (ink-saving), minimal top bar, two action buttons.
// =============================================================================

"use client";

import Link           from "next/link";
import { ArrowLeft, Printer, FileDown } from "lucide-react";
import { CardRenderer } from "@/features/membership/CardRenderer";
import { ROUTES }       from "@/lib/constants";
import type { MemberCard, CardSettings, BrandLogos } from "@/types";

interface Props {
  card:        MemberCard;
  settings:    CardSettings;
  brandLogos?: BrandLogos | null;
}

export function CardPrintClient({ card, settings, brandLogos }: Props) {
  return (
    <>
      {/* Print CSS — white page, hide UI chrome, preserve card colors */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { background: #ffffff !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">

        {/* Back link */}
        <Link
          href={ROUTES.home}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>

        {/* Label */}
        <p className="hidden sm:block text-xs font-semibold tracking-widest uppercase text-gray-400">
          Himalayan Drift · Membership Card
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
          >
            <Printer className="size-4" />
            Print
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-colors"
          >
            <FileDown className="size-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Card content — white page, cards centred ── */}
      <div className="pt-16 min-h-screen bg-white flex flex-col items-center justify-center gap-8 py-12 px-4">
        <CardRenderer
          card={card}
          settings={settings}
          brandLogos={brandLogos}
          mode="screen"
          // This page exists to put the card on paper, so both sides, always,
          // and no view switch to leave in a state that prints half a card.
          defaultLayout="both"
          showControls={false}
        />

        {/* Hint for PDF export */}
        <p className="no-print text-xs text-gray-400 text-center max-w-xs leading-relaxed">
          To save as PDF, click <strong className="text-gray-600">Download PDF</strong> and
          choose <em>Save as PDF</em> as the destination in the print dialog.
        </p>
      </div>
    </>
  );
}
