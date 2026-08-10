// =============================================================================
// CardRenderer — Digital membership ID card
// Renders front + back in the TVS Nepal dark design language.
// Single brand palette across front and back
// mode "screen" = side-by-side preview
// mode "print"  = full-screen dark A4 layout for window.print()
// =============================================================================

"use client";

import { useEffect, useState }         from "react";
import { QRCodeCanvas }                from "qrcode.react";
import { Heart, Phone, Star, ShieldCheck, Calendar, ScanLine } from "lucide-react";
import { cn }                          from "@/utils/cn";
import { APP_META }                    from "@/lib/constants";
import type { MemberCard, CardSettings, BrandLogos } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtMonth(iso: string) {
  const dateStr = iso.includes("T") ? iso : iso + "T12:00:00";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "long", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Card theme tokens - single community, single palette
// ---------------------------------------------------------------------------

const t = {
  accent:     "#dc2626",
  accentDark: "#7f1d1d",
  accentMid:  "#991b1b",
  accentFade: "rgba(220,38,38,0.15)",
  stripe:     "#1e3a8a",
} as const;

// ---------------------------------------------------------------------------
// FRONT
// ---------------------------------------------------------------------------

function CardFront({
  card, settings, brandLogos, origin,
}: {
  card: MemberCard; settings: CardSettings;
  brandLogos?: BrandLogos | null; origin: string;
}) {
  const qrUrl = card.cardNumber
    ? `${origin}/validate/${card.cardNumber}`
    : `${origin}/membership`;

  return (
    <div
      className="relative w-[300px] h-[472px] rounded-2xl overflow-hidden flex flex-col select-none"
      style={{ background: "linear-gradient(160deg,#0b0f1e 0%,#0e1528 100%)" }}
    >
      {/* ── Background radial glow ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 10%, ${t.accent}22 0%, transparent 55%)` }} />

      {/* ── Bottom-left diagonal sweep ── */}
      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none"
        style={{ background: `linear-gradient(148deg, transparent 58%, ${t.accentDark}cc 58%, ${t.accentDark}88 75%, ${t.accentDark}44 100%)` }} />
      <div className="absolute bottom-0 left-0 pointer-events-none"
        style={{ width: "50%", height: "38%", background: t.accentMid, clipPath: "polygon(0 50%,100% 100%,0 100%)", opacity: 0.55 }} />

      {/* ── Right edge stripes ── */}
      <div className="absolute right-0 top-0 bottom-0 flex pointer-events-none">
        <div style={{ width: 6, background: t.stripe }} />
        <div style={{ width: 4, background: t.accent, opacity: 0.85 }} />
      </div>

      {/* ── Vertical identity text ── */}
      <div className="absolute left-0 top-0 bottom-0 w-[18px] flex items-center justify-center pointer-events-none z-10">
        <span
          className="text-[6px] font-semibold tracking-[0.35em] uppercase whitespace-nowrap"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", color: "rgba(255,255,255,0.18)" }}
        >
          OFFICIAL COMMUNITY MEMBER
        </span>
      </div>

      {/* ── Main content (padded past vertical strip) ── */}
      <div className="flex flex-col flex-1 pl-[22px] pr-4 pt-4 relative z-10">

        {/* Top logo */}
        <div className="flex items-center justify-between mb-2">
          {brandLogos?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogos.logoUrl} alt={APP_META.name} className="h-6 w-auto object-contain" />
          ) : (
            <span className="text-sm font-black text-white tracking-tight">
              HIMALAYAN <span style={{ color: t.accent }}>DRIFT</span>
            </span>
          )}
          <span className="text-xs font-bold text-white border border-white/20 px-2 py-0.5 rounded">
            {APP_META.shortName}
          </span>
        </div>

        {/* Circular photo */}
        <div className="flex justify-center mt-2 mb-3">
          <div
            className="rounded-full overflow-hidden shrink-0"
            style={{
              width: 118, height: 118,
              padding: 3,
              background: `conic-gradient(${t.accent} 0deg, ${t.accentDark} 180deg, ${t.accent} 360deg)`,
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0e1528]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.photoUrl}
                alt={card.fullName}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>

        {/* Name */}
        <h2 className="text-center text-[17px] font-black text-white tracking-wide uppercase leading-tight mb-0.5">
          {card.fullName}
        </h2>

        {/* Card number */}
        {card.cardNumber && (
          <p className="text-center text-[11px] font-bold tracking-widest mb-0.5"
            style={{ color: t.accent }}>
            {card.cardNumber}
          </p>
        )}

        {/* Chapter */}
        {settings.showChapter && (
          <p className="text-center text-[9px] font-bold tracking-[0.2em] uppercase mb-3"
            style={{ color: `${t.accent}cc` }}>
            {card.chapter} Chapter
          </p>
        )}

        {/* Blood group + Member Since — fills the gap between chapter and QR */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {card.bloodGroup && (
            <div
              className="flex items-center px-2.5 py-1 rounded-full border shrink-0"
              style={{ borderColor: `${t.accent}55`, background: `${t.accent}18` }}
            >
              <span className="text-[9px] font-bold text-white">{card.bloodGroup}</span>
            </div>
          )}
          <span className="text-[8px] font-medium tracking-widest whitespace-nowrap"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            Member Since{" "}
            {new Date(card.approvedAt ?? card.createdAt).getFullYear()}
          </span>
        </div>

        {/* QR code */}
        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-2">
            <QRCodeCanvas
              value={qrUrl}
              size={84}
              bgColor="#ffffff"
              fgColor="#0b0f1e"
              level="H"
              imageSettings={brandLogos?.logoUrl ? {
                src: brandLogos.logoUrl,
                height: 18,
                width: 18,
                excavate: true,
              } : undefined}
            />
          </div>
        </div>

        {/* Tagline */}
        <div className="flex items-center gap-2 mt-auto pb-3 pt-2">
          <div className="flex-1 h-px" style={{ background: `${t.accent}80` }} />
          <span className="text-[7px] tracking-[0.28em] font-semibold whitespace-nowrap"
            style={{ color: "rgba(255,255,255,0.7)" }}>
            {settings.tagline}
          </span>
          <div className="flex-1 h-px" style={{ background: `${t.accent}80` }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BACK
// ---------------------------------------------------------------------------

function CardBack({
  card, settings, brandLogos,
}: {
  card: MemberCard; settings: CardSettings; brandLogos?: BrandLogos | null;
}) {
  return (
    <div
      className="relative w-[300px] h-[472px] rounded-2xl overflow-hidden flex flex-col select-none"
      style={{ background: "linear-gradient(160deg,#0b0f1e 0%,#0e1528 100%)" }}
    >
      {/* ── Background radial glow ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 20% 90%, ${t.accent}22 0%, transparent 55%)` }} />

      {/* ── Bottom-right diagonal sweep ── */}
      <div className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width: "62%", height: "42%", background: t.accentDark, clipPath: "polygon(100% 40%,100% 100%,0 100%)", opacity: 0.9 }} />
      <div className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width: "42%", height: "32%", background: t.accentMid, clipPath: "polygon(100% 45%,100% 100%,0 100%)", opacity: 0.5 }} />

      {/* ── Left edge stripes ── */}
      <div className="absolute left-0 top-0 bottom-0 flex pointer-events-none">
        <div style={{ width: 4, background: t.accent, opacity: 0.85 }} />
        <div style={{ width: 6, background: t.stripe }} />
      </div>

      {/* ── Brand logo watermark ── */}
      {brandLogos?.logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogos.logoUrl} alt="" className="w-48 h-auto object-contain opacity-[0.055]" />
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 px-5 pt-5 relative z-10">

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px" style={{ background: `${t.accent}55` }} />
          <span className="text-[9px] tracking-[0.28em] text-white/50 font-semibold">MEMBERSHIP CARD</span>
          <div className="flex-1 h-px" style={{ background: `${t.accent}55` }} />
        </div>

        {/* Info rows */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {settings.showBloodGroup && (
            <InfoRow
              icon={<Heart className="size-3.5" style={{ color: t.accent }} />}
              label="Blood Group"
              value={card.bloodGroup}
              borderBottom
            />
          )}
          {settings.showEmergencyPhone && (
            <InfoRow
              icon={<Phone className="size-3.5" style={{ color: t.accent }} />}
              label="Emergency"
              value={card.emergencyPhone}
              borderBottom={settings.showDob}
            />
          )}
          {settings.showDob && (
            <InfoRow
              icon={<Calendar className="size-3.5" style={{ color: t.accent }} />}
              label="Date of Birth"
              value={fmtDate(card.dateOfBirth)}
            />
          )}
        </div>

        {/* Proud member badge */}
        <div
          className="mt-4 rounded-xl border p-3 flex items-center gap-3"
          style={{ borderColor: `${t.accent}40`, background: `${t.accentDark}30` }}
        >
          <Star className="size-5 shrink-0 fill-current" style={{ color: t.accent }} />
          <div>
            <p className="text-[7px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              PROUD MEMBER OF
            </p>
            <p className="text-xs font-black text-white leading-tight">TVS NEPAL COMMUNITY</p>
          </div>
        </div>

        {/* Scan instruction */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <ScanLine className="size-3 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
          <span className="text-[7px] tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
            Scan QR on front to verify this card
          </span>
        </div>

        {/* Issued + Valid Through — two-column layout */}
        {(card.approvedAt || card.validUntil) && (
          <div className="mt-2 flex items-start justify-between px-1">
            {card.approvedAt && (
              <div>
                <p className="text-[6px] uppercase tracking-widest mb-0.5"
                  style={{ color: "rgba(255,255,255,0.25)" }}>Issued</p>
                <p className="text-[9px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.6)" }}>
                  {fmtMonth(card.approvedAt)}
                </p>
              </div>
            )}
            {card.validUntil && (
              <div className="text-right">
                <p className="text-[6px] uppercase tracking-widest mb-0.5 text-right"
                  style={{ color: "rgba(255,255,255,0.25)" }}>Valid Through</p>
                <p className="text-[9px] font-semibold text-right"
                  style={{ color: "rgba(255,255,255,0.6)" }}>
                  {fmtMonth(card.validUntil)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer — increased contrast */}
        <div className="mt-auto pb-4 flex items-start gap-2">
          <ShieldCheck className="size-3.5 shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }} />
          <p className="text-[7px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            {settings.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon, label, value, borderBottom = false,
}: {
  icon: React.ReactNode; label: string; value: string; borderBottom?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center gap-3 px-4 py-2.5", borderBottom && "border-b")}
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[8px] font-semibold uppercase tracking-wider w-20 shrink-0"
        style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </span>
      <span className="text-sm font-bold text-white truncate">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardRenderer — public export
// ---------------------------------------------------------------------------

interface CardRendererProps {
  card:        MemberCard;
  settings:    CardSettings;
  brandLogos?: BrandLogos | null;
  /**
   * "screen"  — side-by-side on sm+, stacked on mobile (public card view)
   * "print"   — full-screen dark A4 layout for window.print()
   * "compact" — always side-by-side (no sm: breakpoint), for embedding in modals/previews
   */
  mode?:       "screen" | "print" | "compact";
}

export function CardRenderer({ card, settings, brandLogos, mode = "screen" }: CardRendererProps) {
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const front = <CardFront card={card} settings={settings} brandLogos={brandLogos} origin={origin} />;
  const back  = <CardBack  card={card} settings={settings} brandLogos={brandLogos} />;

  if (mode === "print") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-8 py-12"
        style={{ background: "#0b0f1e" }}
      >
        <div className="text-center mb-2">
          <p className="text-[9px] tracking-[0.3em] uppercase font-semibold"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            TVS Nepal · Membership Card
          </p>
        </div>
        {front}
        {back}
        <p className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>
          Cut along card edges · Keep in your wallet
        </p>
      </div>
    );
  }

  // "compact" forces row layout regardless of viewport — used inside modals/drawers
  // "screen" uses responsive sm:flex-row for the public card page
  const rowClass = mode === "compact"
    ? "flex flex-row gap-4 items-start"
    : "flex flex-col sm:flex-row gap-6 items-center justify-center";

  return (
    <div className={rowClass}>
      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] tracking-widest uppercase font-semibold text-tvs-charcoal-500">
          Front
        </span>
        {front}
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] tracking-widest uppercase font-semibold text-tvs-charcoal-500">
          Back
        </span>
        {back}
      </div>
    </div>
  );
}
