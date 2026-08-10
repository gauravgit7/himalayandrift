// =============================================================================
// RideSharePanel — WhatsApp / copy-link / print share row
// Client component: uses browser APIs (clipboard, navigator.share, print)
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Link2, Printer, Check, Share2 } from "lucide-react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Props (all pre-formatted by the server component)
// ---------------------------------------------------------------------------

export interface RideSharePanelProps {
  rideTitle:        string;
  adDateLabel:      string;   // e.g. "Apr 18–25, 2026"
  bsDateLabel:      string;   // e.g. "2083 Baisakh 5–12"
  chapter:          string;
  shortDescription?: string | null;
  registrationLink?: string | null;
  slug:             string;
}

// ---------------------------------------------------------------------------
// Helper: build WhatsApp share text
// ---------------------------------------------------------------------------

function buildWhatsAppText(props: RideSharePanelProps, pageUrl: string): string {
  const { rideTitle, adDateLabel, bsDateLabel, chapter, shortDescription, registrationLink } = props;
  const lines: string[] = [];
  lines.push(`🏍️ *${rideTitle}*`);
  lines.push(`📅 ${adDateLabel}`);
  lines.push(`   ${bsDateLabel}`);
  lines.push(`📍 ${chapter}`);
  if (shortDescription) {
    lines.push("");
    lines.push(shortDescription);
  }
  lines.push("");
  if (registrationLink) {
    lines.push(`✅ *Register:* ${registrationLink}`);
  }
  lines.push(`🔗 Details: ${pageUrl}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RideSharePanel(props: RideSharePanelProps) {
  const [copied, setCopied] = useState(false);

  const getPageUrl = useCallback(() => {
    return `${window.location.origin}/rides/${props.slug}`;
  }, [props.slug]);

  // WhatsApp direct link
  const handleWhatsApp = useCallback(() => {
    const text = buildWhatsAppText(props, getPageUrl());
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }, [props, getPageUrl]);

  // Copy page URL to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getPageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a temp input
      const input = document.createElement("input");
      input.value = getPageUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getPageUrl]);

  // Native Web Share API (mobile) — falls back to WhatsApp on desktop
  const handleNativeShare = useCallback(async () => {
    const url = getPageUrl();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: props.rideTitle,
          text: buildWhatsAppText(props, url),
          url,
        });
        return;
      } catch {
        // User cancelled or API unavailable — fall through
      }
    }
    handleWhatsApp();
  }, [props, getPageUrl, handleWhatsApp]);

  // Print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const btnBase =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150";

  return (
    <div className="print:hidden flex flex-wrap items-center gap-2 mt-5">
      <span className="text-xs text-tvs-charcoal-600 font-medium uppercase tracking-wide mr-1">
        Share
      </span>

      {/* WhatsApp / Native Share */}
      <button
        onClick={handleNativeShare}
        className={cn(
          btnBase,
          "bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20"
        )}
        title="Share via WhatsApp"
      >
        <MessageCircle className="size-3.5" />
        WhatsApp
      </button>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className={cn(
          btnBase,
          copied
            ? "bg-emerald-900/40 border border-emerald-700/40 text-emerald-400"
            : "bg-tvs-charcoal-800/60 border border-tvs-charcoal-700/40 text-tvs-charcoal-300 hover:bg-tvs-charcoal-700/60 hover:text-tvs-charcoal-100"
        )}
        title="Copy link"
      >
        {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
        {copied ? "Copied!" : "Copy link"}
      </button>

      {/* Native share (mobile) — only visible when API is not used as primary */}
      <button
        onClick={handleNativeShare}
        className={cn(
          btnBase,
          "sm:hidden bg-tvs-charcoal-800/60 border border-tvs-charcoal-700/40 text-tvs-charcoal-300 hover:bg-tvs-charcoal-700/60"
        )}
        title="Share"
      >
        <Share2 className="size-3.5" />
        Share
      </button>

      {/* Print */}
      <button
        onClick={handlePrint}
        className={cn(
          btnBase,
          "bg-tvs-charcoal-800/60 border border-tvs-charcoal-700/40 text-tvs-charcoal-300 hover:bg-tvs-charcoal-700/60 hover:text-tvs-charcoal-100"
        )}
        title="Print ride details"
      >
        <Printer className="size-3.5" />
        Print
      </button>
    </div>
  );
}
