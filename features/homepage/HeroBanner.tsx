// =============================================================================
// HeroBanner - Phase 3 · Full-viewport cinematic hero
// Phase 10 · Admin-configured background image + overlay opacity
//            Dynamic brand logo support (TVS Nepal logo from Supabase Storage)
// 'use client' - Framer Motion entrance animations
// =============================================================================

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, ArrowRight, MapPin, Users } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatRideDateRange } from "@/utils/date";
import { CommunityBadge } from "@/components/shared/CommunityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { RideQrCodeInline } from "@/components/shared/RideQrCode";
import { RideCountdown }    from "@/features/homepage/RideCountdown";
import { ROUTES } from "@/lib/constants";
import type { Ride, HomepageContent, BrandLogos } from "@/types";

interface HeroBannerStats {
  totalRides:    number;
  totalChapters: number;
  totalRiders:   number;
  marqueeCount:  number;
  year:          number;
}

interface HeroBannerProps {
  heroContent:  HomepageContent["heroBanner"];
  featuredRide: Ride | null;
  brandLogos?:  BrandLogos;
  stats?:       HeroBannerStats;
  nextRide?:    Ride | null;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0 },
};

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeroBanner({ heroContent, featuredRide, brandLogos, stats, nextRide }: HeroBannerProps) {
  const hasPhoto = !!heroContent.backgroundImageUrl;

  return (
    <section className="dark-surface relative min-h-dvh flex flex-col justify-center overflow-hidden">

      {/* ── Background layer 1: base colour (always present) ──────────── */}
      <div className="absolute inset-0 bg-tvs-charcoal-950" />

      {hasPhoto ? (
        /* ── Photo mode: layered cinematic overlays ───────────────────── */
        <>
          {/* Layer 2: full-bleed background photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroContent.backgroundImageUrl!}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            decoding="async"
          />

          {/* Layer 3: configurable darkness overlay */}
          <div
            className="absolute inset-0"
            style={{ background: `rgba(0,0,0,${heroContent.overlayOpacity})` }}
          />

          {/* Layer 4a: left vignette - deepens the text column */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none" />

          {/* Layer 4b: bottom gradient - keeps text readable at the fold */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

          {/* Layer 4c: radial vignette - softens frame edges */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)",
            }}
          />

          {/* Layer 4d: brand red tint - bottom-right glow for identity */}
          <div className="absolute -bottom-24 -right-24 w-[480px] h-[480px] rounded-full bg-tvs-red-900/20 blur-[100px] pointer-events-none" />
        </>
      ) : (
        /* ── Ambient mode: generative dark aesthetic (no photo) ───────── */
        <>
          {/* Ambient red glow - top-right */}
          <div className="absolute -top-48 -right-48 w-[640px] h-[640px] rounded-full bg-tvs-red-900/25 blur-[128px] pointer-events-none" />
          {/* Crimson glow - bottom-left */}
          <div className="absolute -bottom-48 -left-32 w-[520px] h-[520px] rounded-full bg-tvs-crimson-900/20 blur-[100px] pointer-events-none" />
          {/* Subtle dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #dc2626 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </>
      )}

      {/* ── Layer 5 (always): bottom fade into the next section ──────── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-tvs-charcoal-950 to-transparent pointer-events-none" />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-24 pb-20">
        <div className="grid lg:grid-cols-[1fr_430px] gap-10 xl:gap-16 items-center">

          {/* ── Left: headline + CTAs ── */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-7"
          >
            {/* Community tags */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-wrap gap-2"
            >
              <CommunityBadge community="AOG"      size="sm" brandLogos={brandLogos} />
              <CommunityBadge community="CULT"     size="sm" brandLogos={brandLogos} />
              <CommunityBadge community="AOGxCULT" size="sm" brandLogos={brandLogos} />
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-tvs-charcoal-800/80 border border-tvs-charcoal-700 text-tvs-charcoal-400">
                9 Chapters · All Nepal
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-black text-white leading-[1.03] tracking-tight">
                {heroContent.title}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-tvs-charcoal-400 max-w-md leading-relaxed">
                {heroContent.subtitle}
              </p>
            </motion.div>

            {/* Season label */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <span className="block w-6 h-px bg-tvs-red-600 rounded-full" />
              <span className="text-sm font-semibold text-tvs-red-400">
                {stats?.year} Annual Ride Season
              </span>
              <span className="block w-6 h-px bg-tvs-red-600 rounded-full" />
            </motion.div>

            {/* Countdown pill */}
            {nextRide && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <RideCountdown nextRide={nextRide} />
              </motion.div>
            )}

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href={heroContent.primaryCTALink}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-tvs-red-600 hover:bg-tvs-red-500 text-white font-semibold text-sm transition-all duration-200 hover:shadow-glow-red"
              >
                <Calendar className="size-4 shrink-0" />
                {heroContent.primaryCTALabel}
                <ArrowRight className="size-4 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              {heroContent.secondaryCTALabel && (
                <Link
                  href={heroContent.secondaryCTALink ?? ROUTES.calendar}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-tvs-charcoal-700 hover:border-violet-700/70 hover:bg-violet-950/30 text-tvs-charcoal-200 hover:text-white font-semibold text-sm transition-all duration-200"
                >
                  <span className="text-yellow-400">★</span>
                  {heroContent.secondaryCTALabel}
                  <ArrowRight className="size-4 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                </Link>
              )}
            </motion.div>

            {/* Quick stats strip - live from DB */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-wrap gap-x-7 gap-y-3 pt-3 border-t border-tvs-charcoal-800/70"
            >
              {[
                {
                  value: stats ? String(stats.totalRides) : "-",
                  label: stats?.year ? `Rides in ${stats.year}` : "Total Rides",
                },
                {
                  value: stats ? String(stats.totalChapters) : "-",
                  label: "Active Chapters",
                },
                {
                  value: stats ? `${stats.totalRiders}+` : "-",
                  label: "Community Riders",
                },
                {
                  value: stats ? String(stats.marqueeCount) : "-",
                  label: "Marquee Expeditions",
                },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-tvs-charcoal-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: featured ride card ── */}
          {featuredRide && (
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full"
            >
              <HeroRideCard ride={featuredRide} brandLogos={brandLogos} />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <span className="text-[9px] uppercase tracking-[0.2em] text-tvs-charcoal-600">
          Scroll
        </span>
        <motion.div
          className="w-px h-6 bg-gradient-to-b from-tvs-charcoal-600 to-transparent"
          animate={{ scaleY: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: featured ride card inside the hero
// ---------------------------------------------------------------------------

function HeroRideCard({ ride, brandLogos }: { ride: Ride; brandLogos?: BrandLogos | null }) {
  const dateLabel  = formatRideDateRange(ride.startDate, ride.endDate);
  const isMarquee  = ride.rideType === "marquee";
  const waypoints  = ride.routeData?.waypoints ?? [];

  return (
    <Link
      href={ROUTES.ride(ride.slug)}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-cinematic",
        isMarquee
          ? "border-violet-700/50 hover:border-violet-500/60"
          : "border-tvs-charcoal-700 hover:border-tvs-red-700/50"
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0",
          isMarquee ? "gradient-marquee" : ride.community === "CULT" ? "gradient-cult" : "gradient-aog"
        )}
      />
      {/* Overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Top accent stripe */}
      <div
        className={cn(
          "relative h-0.5 w-full shrink-0",
          isMarquee ? "bg-gradient-to-r from-violet-500 to-tvs-red-500" : "bg-tvs-red-600"
        )}
      />

      <div className="relative flex flex-col gap-4 p-6 pt-5">
        {/* Top badges row */}
        <div className="flex items-start gap-2 flex-wrap">
          <CommunityBadge community={ride.community} size="sm" brandLogos={brandLogos} />
          {isMarquee && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400 border border-yellow-700/40">
              ★ MARQUEE
            </span>
          )}
          <div className="ml-auto">
            <StatusBadge status={ride.status} size="xs" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-black text-white leading-tight group-hover:text-tvs-red-100 transition-colors duration-200">
            {ride.title}
          </h3>
          {ride.shortDescription && (
            <p className="mt-1.5 text-sm text-tvs-charcoal-300/90 line-clamp-2 leading-snug">
              {ride.shortDescription}
            </p>
          )}
        </div>

        {/* Meta + QR */}
        <div className="flex items-start gap-3">
          {/* Left: ride meta */}
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2 text-xs text-tvs-charcoal-300">
              <Calendar className="size-3.5 text-tvs-red-500 shrink-0" />
              <span>{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-tvs-charcoal-300">
              <MapPin className="size-3.5 text-tvs-red-500 shrink-0" />
              <span>{ride.chapter} Chapter</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-tvs-charcoal-300">
              <Users className="size-3.5 text-tvs-red-500 shrink-0" />
              <span>{ride.expectedRiders} riders expected</span>
            </div>
          </div>

          {/* Right: QR code (only when registration link exists) */}
          {ride.registrationLink && (
            <RideQrCodeInline
              url={ride.registrationLink}
              label="Scan to Register"
              size={96}
            />
          )}
        </div>

        {/* Route waypoints (marquee only) */}
        {waypoints.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-[9px] uppercase tracking-widest text-tvs-charcoal-500 mb-2">
              Route
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              {waypoints.map((wp, i) => (
                <span key={wp.name} className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-tvs-charcoal-200">
                    {wp.name}
                  </span>
                  {i < waypoints.length - 1 && (
                    <span className="text-tvs-charcoal-600 text-xs">›</span>
                  )}
                </span>
              ))}
            </div>
            {ride.routeData?.totalDistanceKm && (
              <p className="text-[10px] text-tvs-charcoal-500 mt-1">
                {ride.routeData.totalDistanceKm} km total
              </p>
            )}
          </div>
        )}

        {/* Bottom: register + view details */}
        <div className="flex items-center justify-between mt-1">
          {ride.registrationLink ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(ride.registrationLink!, "_blank", "noopener,noreferrer");
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-tvs-red-600 hover:bg-tvs-red-500 text-white transition-colors duration-150"
            >
              Register →
            </button>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-xs text-tvs-charcoal-400 group-hover:text-tvs-charcoal-200 transition-colors duration-200">
            View details
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </div>
      </div>
    </Link>
  );
}
