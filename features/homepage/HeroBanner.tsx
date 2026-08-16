// =============================================================================
// HeroBanner - Phase 3 · Full-viewport cinematic hero
// Phase 10 · Admin-configured background image + overlay opacity
//            Dynamic brand logo support (Himalayan Drift logo from Supabase Storage)
// 'use client' - Framer Motion entrance animations
// =============================================================================

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ArrowRight, MapPin, Users, Thermometer } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatRideDateRange } from "@/utils/date";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { RideQrCodeInline } from "@/components/shared/RideQrCode";
import { RouteSparkline }   from "@/components/shared/RouteSparkline";
import { RideCountdown }    from "@/features/homepage/RideCountdown";
import { AnthemPlayer }     from "@/features/homepage/AnthemPlayer";
import { ROUTES, RIDE_TYPES, APP_META } from "@/lib/constants";
import { CONDITION_META }     from "@/lib/weather/openweather";
import type { Ride, HomepageContent, BrandLogos, RideWeather, AnthemSettings } from "@/types";

interface HeroBannerStats {
  totalRides:    number;
  upcomingRides: number;
  marqueeCount:  number;
  year:          number;
}

interface HeroBannerProps {
  heroContent:  HomepageContent["heroBanner"];
  featuredRide: Ride | null;
  brandLogos?:  BrandLogos;
  stats?:       HeroBannerStats;
  nextRide?:    Ride | null;
  /** Weather for the featured ride, when it falls inside the forecast window. */
  featuredWeather?: RideWeather | null;
  anthem?:          AnthemSettings | null;
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

export function HeroBanner({ heroContent, featuredRide, brandLogos, stats, nextRide, featuredWeather, anthem }: HeroBannerProps) {
  const hasPhoto = !!heroContent.backgroundImageUrl;

  return (
    <section className="dark-surface relative min-h-dvh flex flex-col justify-center overflow-hidden">

      {/* ── Background layer 1: base colour (always present) ──────────── */}
      <div className="absolute inset-0 bg-hd-ink-950" />

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
          <div className="absolute -bottom-24 -right-24 w-[480px] h-[480px] rounded-full bg-hd-ember-900/20 blur-[100px] pointer-events-none" />
        </>
      ) : (
        /* ── Ambient mode: generative dark aesthetic (no photo) ───────── */
        <>
          {/* Ambient red glow - top-right */}
          <div className="absolute -top-48 -right-48 w-[640px] h-[640px] rounded-full bg-hd-ember-900/25 blur-[128px] pointer-events-none" />
          {/* Crimson glow - bottom-left */}
          <div className="absolute -bottom-48 -left-32 w-[520px] h-[520px] rounded-full bg-hd-clay-900/20 blur-[100px] pointer-events-none" />
          {/* Subtle dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #f09020 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </>
      )}

      {/* ── Layer 5 (always): bottom fade into the next section ──────── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-hd-ink-950 to-transparent pointer-events-none" />

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
            {/* Ride type tags */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-wrap gap-2"
            >
              {RIDE_TYPES.map((t) => (
                <span
                  key={t.value}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-hd-ink-800/80 border border-hd-ink-700 text-hd-ink-400"
                >
                  {t.icon} {t.label}
                </span>
              ))}
            </motion.div>

            {/* Main headline */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-black text-white leading-[1.03] tracking-tight">
                {heroContent.title}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-hd-ink-400 max-w-md leading-relaxed">
                {heroContent.subtitle}
              </p>
            </motion.div>

            {/* Season label */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <span className="block w-6 h-px bg-hd-ember-600 rounded-full" />
              <span className="text-sm font-semibold text-hd-ember-400">
                {stats?.year} Annual Ride Season
              </span>
              <span className="block w-6 h-px bg-hd-ember-600 rounded-full" />
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
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white font-semibold text-sm transition-all duration-200 hover:shadow-glow-ember"
              >
                <Calendar className="size-4 shrink-0" />
                {heroContent.primaryCTALabel}
                <ArrowRight className="size-4 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              {heroContent.secondaryCTALabel && (
                <Link
                  href={heroContent.secondaryCTALink ?? ROUTES.calendar}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-hd-ink-700 hover:border-violet-700/70 hover:bg-violet-950/30 text-hd-ink-200 hover:text-white font-semibold text-sm transition-all duration-200"
                >
                  <span className="text-yellow-400">★</span>
                  {heroContent.secondaryCTALabel}
                  <ArrowRight className="size-4 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                </Link>
              )}
            </motion.div>

            {/* Anthem — sits under the CTAs, quiet by design. Renders nothing
                until an anthem is uploaded and switched on in Settings. */}
            {anthem && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <AnthemPlayer anthem={anthem} />
              </motion.div>
            )}

            {/* Quick stats strip - live from DB */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-wrap gap-x-7 gap-y-3 pt-3 border-t border-hd-ink-800/70"
            >
              {[
                {
                  value: stats ? String(stats.totalRides) : "-",
                  label: stats?.year ? `Rides in ${stats.year}` : "Total Rides",
                },
                {
                  value: stats ? String(stats.upcomingRides) : "-",
                  label: "Upcoming Rides",
                },
                {
                  value: stats ? String(stats.marqueeCount) : "-",
                  label: "Marquee Expeditions",
                },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-hd-ink-500 mt-0.5">{s.label}</p>
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
              <HeroRideCard ride={featuredRide} brandLogos={brandLogos} weather={featuredWeather} />
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
        <span className="text-[9px] uppercase tracking-[0.2em] text-hd-ink-600">
          Scroll
        </span>
        <motion.div
          className="w-px h-6 bg-gradient-to-b from-hd-ink-600 to-transparent"
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

function HeroRideCard({
  ride,
  brandLogos,
  weather,
}: {
  ride: Ride;
  brandLogos?: BrandLogos | null;
  weather?: RideWeather | null;
}) {
  const router     = useRouter();
  const dateLabel  = formatRideDateRange(ride.startDate, ride.endDate);
  const isMarquee  = ride.rideType === "marquee";
  const waypoints  = ride.routeData?.waypoints ?? [];

  // Built-in registration wins over the external link, matching the ride page.
  // "Full" is not checked here - that needs a seat count, and the register page
  // already explains itself when a rider lands on a full ride.
  const useBuiltIn   = ride.registrationOpen && ride.status !== "cancelled";
  const registerHref = useBuiltIn ? ROUTES.rideRegister(ride.slug || ride.id) : null;
  const qrTarget     = registerHref ?? ride.registrationLink;

  const conditionMeta = weather ? CONDITION_META[weather.ridingCondition] : null;

  return (
    <Link
      href={ROUTES.ride(ride.slug)}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-cinematic",
        isMarquee
          ? "border-violet-700/50 hover:border-violet-500/60"
          : "border-hd-ink-700 hover:border-hd-ember-700/50"
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0",
          isMarquee ? "gradient-marquee" : "gradient-brand"
        )}
      />
      {/* Overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Top accent stripe */}
      <div
        className={cn(
          "relative h-0.5 w-full shrink-0",
          isMarquee ? "bg-gradient-to-r from-violet-500 to-hd-ember-500" : "bg-hd-ember-600"
        )}
      />

      <div className="relative flex flex-col gap-4 p-6 pt-5">
        {/* Top badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Brand mark — the card gets screenshotted and shared, so it should
              carry the community's name off-site. */}
          <BrandLogo
            logoUrl={brandLogos?.logoUrl}
            alt={APP_META.name}
            className="h-6 w-auto max-w-[26px] object-contain shrink-0 opacity-90"
            fallback={
              <span className="inline-flex items-center justify-center size-6 rounded-md bg-hd-ember-600 shrink-0">
                <span className="text-[9px] font-black text-white leading-none">
                  {APP_META.shortName}
                </span>
              </span>
            }
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            {APP_META.name}
          </span>

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
          <h3 className="text-lg font-black text-white leading-tight group-hover:text-hd-ember-100 transition-colors duration-200">
            {ride.title}
          </h3>
          {/* Only worth showing when it says something the title does not. */}
          {ride.shortDescription &&
           ride.shortDescription.trim().toLowerCase() !== ride.title.trim().toLowerCase() && (
            <p className="mt-1.5 text-sm text-hd-ink-300/90 line-clamp-2 leading-snug">
              {ride.shortDescription}
            </p>
          )}
        </div>

        {/* Meta + QR */}
        <div className="flex items-start gap-3">
          {/* Left: ride meta */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-hd-ink-300">
              <Calendar className="size-3.5 text-hd-ember-500 shrink-0" />
              <span>{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-hd-ink-300">
              <MapPin className="size-3.5 text-hd-ember-500 shrink-0" />
              <span className="truncate">{ride.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-hd-ink-300">
              <Users className="size-3.5 text-hd-ember-500 shrink-0" />
              <span>{ride.expectedRiders} riders expected</span>
            </div>

            {/* Weather — only when the ride is inside the forecast window. */}
            {weather && conditionMeta && (
              <div className="flex items-center gap-2 text-xs text-hd-ink-300">
                <Thermometer className="size-3.5 text-hd-ember-500 shrink-0" />
                <span className="truncate">
                  {Math.round(weather.temperatureCelsius)}°C
                  <span className="text-hd-ink-500"> · </span>
                  {weather.conditions[0]?.description ?? conditionMeta.label}
                </span>
                <span
                  className={cn(
                    "shrink-0 px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide border",
                    conditionMeta.bg, conditionMeta.color,
                  )}
                >
                  {conditionMeta.label}
                </span>
              </div>
            )}
          </div>

          {/* Right: QR — to the built-in form when open, else the external link */}
          {qrTarget && (
            <RideQrCodeInline
              url={qrTarget}
              label="Scan to Register"
              size={96}
            />
          )}
        </div>

        {/* Route: the shape, then the names */}
        {waypoints.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <p className="text-[9px] uppercase tracking-widest text-hd-ink-500">
                Route
              </p>
              {ride.routeData?.totalDistanceKm && (
                <p className="text-[10px] text-hd-ink-400 font-medium">
                  {ride.routeData.totalDistanceKm} km
                </p>
              )}
            </div>

            <RouteSparkline
              waypoints={waypoints}
              tone={isMarquee ? "violet" : "ember"}
              className="mb-2 max-h-16"
            />

            <div className="flex items-center gap-1 flex-wrap">
              {waypoints.map((wp, i) => (
                <span key={`${wp.name}-${i}`} className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-hd-ink-200">
                    {wp.name}
                  </span>
                  {i < waypoints.length - 1 && (
                    <span className="text-hd-ink-600 text-xs">›</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom: register + view details */}
        <div className="flex items-center justify-between mt-1">
          {registerHref ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // The whole card is already a Link, so this cannot be a nested
                // anchor. Route client-side rather than reloading the page.
                router.push(registerHref);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white transition-colors duration-150"
            >
              Register
              {ride.registrationFee
                ? <span className="px-1.5 py-px rounded bg-black/25 text-[10px]">
                    Rs {ride.registrationFee.toLocaleString()}
                  </span>
                : <span className="px-1.5 py-px rounded bg-black/25 text-[10px]">Free</span>}
            </button>
          ) : ride.registrationLink ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(ride.registrationLink!, "_blank", "noopener,noreferrer");
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white transition-colors duration-150"
            >
              Register →
            </button>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-xs text-hd-ink-400 group-hover:text-hd-ink-200 transition-colors duration-200">
            View details
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </div>
      </div>
    </Link>
  );
}
