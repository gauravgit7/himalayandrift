// =============================================================================
// RideQrCode — QR code card for registration link or ride page URL
// Client component: uses qrcode.react + canvas download
// Relative URLs (e.g. /rides/slug) are resolved to absolute using window.location.origin
// =============================================================================

"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { QRCodeCanvas }  from "qrcode.react";
import { Download, ExternalLink, QrCode } from "lucide-react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RideQrCodeProps {
  /** URL to encode — registration link (preferred) or ride page URL */
  url:         string;
  /** Short label shown below the QR: "Scan to Register" or "Scan to View" */
  label?:      string;
  /** Used for the download filename */
  rideTitle:   string;
  /** Extra className for the wrapper card */
  className?:  string;
  /** Size of the rendered QR (px). Default: 144 */
  size?:       number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RideQrCode({
  url,
  label = "Scan to Register",
  rideTitle,
  className,
  size = 144,
}: RideQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resolve relative URLs on the client (QR codes need absolute URLs)
  const [resolvedUrl, setResolvedUrl] = useState(url);
  useEffect(() => {
    if (url.startsWith("/")) {
      setResolvedUrl(`${window.location.origin}${url}`);
    } else {
      setResolvedUrl(url);
    }
  }, [url]);

  // Download QR as PNG
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a       = document.createElement("a");
    a.href        = dataUrl;
    a.download    = `${rideTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-qr.png`;
    a.click();
  }, [rideTitle]);

  // Truncate long URLs for the small display text
  const displayUrl = resolvedUrl.length > 48 ? resolvedUrl.slice(0, 45) + "…" : resolvedUrl;

  return (
    <div className={cn(
      "p-4 rounded-xl gradient-card border border-hd-ink-700/60 space-y-3",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <QrCode className="size-4 text-hd-ink-400 shrink-0" />
        <h3 className="text-sm font-bold text-hd-ink-50">{label}</h3>
      </div>

      {/* QR code — centred, white bg for contrast */}
      <div className="flex justify-center">
        <div className="p-2.5 bg-white rounded-lg shadow-sm inline-flex">
          <QRCodeCanvas
            ref={canvasRef}
            value={resolvedUrl}
            size={size}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      {/* URL hint */}
      <p
        className="text-[10px] text-hd-ink-600 text-center leading-tight break-all"
        title={resolvedUrl}
      >
        {displayUrl}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-hd-ink-800/60 border border-hd-ink-700/40 text-xs font-semibold text-hd-ink-300 hover:bg-hd-ink-700/60 hover:text-hd-ink-100 transition-colors"
          title="Download QR code as PNG"
        >
          <Download className="size-3.5" />
          Download PNG
        </button>
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-hd-ink-800/60 border border-hd-ink-700/40 text-xs font-semibold text-hd-ink-300 hover:bg-hd-ink-700/60 hover:text-hd-ink-100 transition-colors"
          title="Open link"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline QR — no interactive controls, safe inside a <Link> or any card
// Use inside the hero ride card (homepage) where clicking the card navigates
// ---------------------------------------------------------------------------

export function RideQrCodeInline({
  url,
  label = "Scan to Register",
  size  = 96,
}: {
  url:    string;
  label?: string;
  size?:  number;
}) {
  const [resolvedUrl, setResolvedUrl] = useState(url);
  useEffect(() => {
    if (url.startsWith("/")) {
      setResolvedUrl(`${window.location.origin}${url}`);
    } else {
      setResolvedUrl(url);
    }
  }, [url]);

  return (
    <div className="shrink-0 flex flex-col items-center gap-1">
      <div className="p-1.5 bg-white rounded-lg inline-flex shadow-sm">
        <QRCodeCanvas
          value={resolvedUrl}
          size={size}
          bgColor="#ffffff"
          fgColor="#111827"
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-[9px] text-hd-ink-500 leading-none">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact print-only QR (no card chrome, just the code + label)
// Shown only in @media print via className override
// ---------------------------------------------------------------------------

export function RideQrCodePrint({
  url,
  label = "Scan to Register",
  size  = 96,
}: Pick<RideQrCodeProps, "url" | "label" | "size">) {
  const [resolvedUrl, setResolvedUrl] = useState(url);
  useEffect(() => {
    if (url.startsWith("/")) {
      setResolvedUrl(`${window.location.origin}${url}`);
    } else {
      setResolvedUrl(url);
    }
  }, [url]);

  return (
    <div className="hidden print:flex flex-col items-center gap-1">
      <div className="p-1 bg-white border border-gray-300 rounded inline-flex">
        <QRCodeCanvas
          value={resolvedUrl}
          size={size}
          bgColor="#ffffff"
          fgColor="#111827"
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-[9px] text-gray-600 text-center mt-0.5">{label}</p>
    </div>
  );
}
