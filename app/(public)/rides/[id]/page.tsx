// =============================================================================
// Ride Detail Page - Phase 7
// /rides/[id]  - id may be a UUID or slug (getRide handles both)
// Server Component: data from Supabase, weather from OpenWeather, map client-only
// Phase 10 · ISR: revalidate every hour; on-demand flush via revalidatePath in actions
// =============================================================================

export const revalidate = 3600; // 1 hour

import type { Metadata }   from "next";
import Link                from "next/link";
import { notFound }        from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Users, Flag, Clock,
  ExternalLink, Navigation, Star, ChevronRight,
} from "lucide-react";

import { getRide, getBrandLogos } from "@/lib/supabase/queries";
import {
  fetchRideWeather,
  getRideCoords,
  CONDITION_META,
  owIconUrl,
} from "@/lib/weather/openweather";
import { ROUTES }             from "@/lib/constants";
import { cn }                 from "@/utils/cn";
import {
  formatRideDateRange,
  formatRideDate,
  getRideDurationDays,
  rideIsUpcoming,
} from "@/utils/date";
import { formatBsDateRange } from "@/utils/nepali-date";
import { StatusBadge }        from "@/components/shared/StatusBadge";
import { SeriesBadge }        from "@/components/shared/SeriesBadge";
import { RideSharePanel }       from "@/components/shared/RideSharePanel";
import { RideQrCode, RideQrCodePrint } from "@/components/shared/RideQrCode";
import { RideInterestButton }  from "@/components/shared/RideInterestButton";
import Image                  from "next/image";

// Map is client-only - imported via a 'use client' wrapper that holds ssr:false
import RideRouteMap from "@/components/maps/RideRouteMapClient";

// ---------------------------------------------------------------------------
// Hero gradient config — marquee rides get the premium treatment
// ---------------------------------------------------------------------------

const HERO_GRADIENT = {
  marquee:  "from-violet-950 via-hd-ink-950 to-hd-ink-950",
  standard: "from-hd-ember-950 via-hd-ink-950 to-hd-ink-950",
} as const;

const HERO_ACCENT = {
  marquee:  "border-violet-800/40",
  standard: "border-hd-ember-800/40",
} as const;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const ride   = await getRide(id);
  if (!ride) return { title: "Ride Not Found" };
  return {
    title:       ride.title,
    description: ride.shortDescription ?? ride.description ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function RideDetailPage({ params }: PageProps) {
  const { id }   = await params;
  const [ride, brandLogos] = await Promise.all([getRide(id), getBrandLogos()]);
  if (!ride) notFound();

  const durationDays    = getRideDurationDays(ride.startDate, ride.endDate);
  const isMultiDay      = durationDays > 1;
  const isUpcoming      = rideIsUpcoming(ride.startDate);
  const hasRoute        = !!(ride.routeData?.waypoints?.length);
  const hasItinerary    = ride.itinerary.length > 0;
  const hasRegistration = !!(ride.registrationLink &&
    (ride.status === "confirmed" || ride.status === "planned" || ride.status === "tentative"));

  // Pre-format labels for share panel
  const adDateLabel = formatRideDateRange(ride.startDate, ride.endDate);
  const bsDateLabel = formatBsDateRange(ride.startDate, ride.endDate);

  // QR code URL: registration link if available, otherwise the ride detail page (relative → resolved client-side)
  const qrUrl   = ride.registrationLink ?? `/rides/${ride.slug}`;
  const qrLabel = ride.registrationLink ? "Scan to Register" : "Scan to View Details";

  // Live weather for upcoming rides
  let weather = null;
  if (isUpcoming) {
    const { coordinates, label } = getRideCoords(ride);
    weather = await fetchRideWeather(
      ride.id,
      coordinates[1], // lat
      coordinates[0], // lng
      `${label}, Nepal`,
    );
  }

  const heroKey       = ride.rideType === "marquee" ? "marquee" : "standard";
  const heroGradient  = HERO_GRADIENT[heroKey];
  const accentBorder  = HERO_ACCENT[heroKey];

  return (
    <>
    {/* ── Print styles ── */}
    <style>{`
      @media print {
        @page { margin: 1.5cm; size: A4; }

        /* Colour accuracy */
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

        /* White canvas */
        html, body { background-color: white !important; }

        /* Force ALL backgrounds to white (dark theme uses charcoal/gradient everywhere) */
        * { background-color: white !important; background-image: none !important; box-shadow: none !important; }

        /* Force all text to near-black */
        * { color: #111827 !important; }
        a { color: #1d4ed8 !important; text-decoration: underline !important; }

        /* Light borders */
        * { border-color: #e5e7eb !important; }

        /* Hero: remove the pt-24 that was only for the fixed navbar */
        .ride-hero-section { padding-top: 1rem !important; padding-bottom: 1rem !important; }

        /* Collapse 2-col grid to single column */
        .ride-main-grid { display: block !important; }
        .ride-sidebar   { margin-top: 1.5rem !important; }
      }
    `}</style>

    <div className="min-h-dvh pb-20">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className={`ride-hero-section dark-surface relative bg-gradient-to-b ${heroGradient} pt-24 pb-10 px-4`}>
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none print:hidden"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Back link — hidden on print */}
          <Link
            href={ROUTES.calendar}
            className="print:hidden inline-flex items-center gap-1.5 text-sm text-hd-ink-400 hover:text-hd-ink-100 transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to Calendar
          </Link>

          {/* Print-only header: Himalayan Drift branding */}
          <div className="hidden print:flex items-center justify-between mb-4 pb-2 border-b border-gray-300">
            <span className="text-base font-black tracking-tight text-gray-900">Himalayan Drift</span>
            <span className="text-xs text-gray-500">Ride Operations Platform</span>
          </div>

          {/* Badges — hidden on print */}
          <div className="print:hidden flex flex-wrap items-center gap-2 mb-4">
            {ride.series && (
              <SeriesBadge series={ride.series} volume={ride.volume} asLink />
            )}
            <StatusBadge    status={ride.status} />
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-hd-ink-700 bg-hd-ink-800/60 text-hd-ink-400">
              {ride.rideType}
            </span>
            {ride.rideType === "marquee" && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-yellow-800/40 bg-yellow-900/30 text-yellow-400">
                <Star className="size-2.5" />
                Flagship
              </span>
            )}
          </div>

          {/* Print-only compact badges */}
          <div className="hidden print:flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600">
            <span className="capitalize">{ride.status}</span>
            <span>·</span>
            <span className="capitalize">{ride.rideType}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white print:text-gray-900 leading-tight mb-4 max-w-3xl">
            {ride.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-hd-ink-400 print:text-gray-700">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              <span className="flex flex-col leading-tight">
                <span>{adDateLabel}</span>
                <span className="text-xs text-hd-ink-600 print:text-gray-500">
                  {bsDateLabel}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              {ride.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" />
              {ride.expectedRiders} expected riders
            </span>
            {isMultiDay && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {durationDays} days
              </span>
            )}
          </div>

          {/* Registration CTA + Interest + iCal — hidden on print */}
          <div className="print:hidden mt-6 flex flex-wrap items-center gap-3">
            {hasRegistration && (
              <a
                href={ride.registrationLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white font-bold text-sm shadow-glow-ember transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Flag className="size-4" />
                Register for this Ride
                <ExternalLink className="size-3.5 opacity-70" />
              </a>
            )}

            {/* "I'm joining" soft-RSVP */}
            <RideInterestButton
              rideId={ride.id}
              initialCount={ride.interestCount}
            />

            {/* Add to calendar */}
            <a
              href={`/api/ical?ride=${ride.slug}`}
              download={`${ride.slug}.ics`}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-hd-ink-800/80 border border-hd-ink-700 text-hd-ink-300 hover:text-white hover:bg-hd-ink-700 hover:border-hd-ink-500 text-xs font-semibold transition-all"
              title="Add to Google Calendar, Apple Calendar, or Outlook"
            >
              <Calendar className="size-3.5" />
              Add to Calendar
            </a>
          </div>

          {/* Print-only: registration link as plain text */}
          {hasRegistration && (
            <div className="hidden print:block mt-3">
              <p className="text-xs text-gray-600">
                Register: <a href={ride.registrationLink!} className="text-blue-700 underline">{ride.registrationLink}</a>
              </p>
            </div>
          )}

          {/* Print-only: compact QR top-right in hero */}
          <div className="hidden print:flex items-center gap-6 mt-4 pt-3 border-t border-gray-200">
            <RideQrCodePrint url={qrUrl} label={qrLabel} size={88} />
            <p className="text-xs text-gray-500 max-w-[220px] leading-relaxed">
              {ride.registrationLink
                ? "Scan with your phone to register for this ride."
                : "Scan to view full ride details and updates online."}
            </p>
          </div>

          {/* Share panel (WhatsApp, copy, print) — hidden on print */}
          <RideSharePanel
            rideTitle={ride.title}
            adDateLabel={adDateLabel}
            bsDateLabel={bsDateLabel}
            location={ride.location}
            shortDescription={ride.shortDescription}
            registrationLink={ride.registrationLink}
            slug={ride.slug}
          />
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="print:hidden border-b border-hd-ink-800/60 bg-hd-ink-950/80">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Duration",
                value: durationDays === 1 ? "Day ride" : `${durationDays} days`,
                icon: <Clock className="size-4" />,
              },
              {
                label: "Distance",
                value: ride.routeData?.totalDistanceKm
                  ? `${ride.routeData.totalDistanceKm} km`
                  : "TBC",
                icon: <Navigation className="size-4" />,
              },
              {
                label: "Expected",
                value: `${ride.expectedRiders} riders`,
                icon: <Users className="size-4" />,
              },
              {
                label: "Priority",
                value: ride.priority.charAt(0).toUpperCase() + ride.priority.slice(1),
                icon: <Flag className="size-4" />,
              },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800/60"
              >
                <span className="text-hd-ink-500 shrink-0">{icon}</span>
                <div>
                  <p className="text-[10px] text-hd-ink-600 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-hd-ink-50">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="ride-main-grid grid lg:grid-cols-[1fr_340px] gap-8">

          {/* Left column */}
          <div className="space-y-8">

            {/* Description */}
            {ride.description && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-hd-ink-500 mb-3">
                  About this Ride
                </h2>
                <p className="text-hd-ink-300 leading-relaxed text-[15px]">
                  {ride.description}
                </p>
              </div>
            )}

            {/* Itinerary */}
            {hasItinerary && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-hd-ink-500 mb-4">
                  Day-by-Day Itinerary
                </h2>
                <div className="space-y-3">
                  {ride.itinerary.map((day, idx) => (
                    <div
                      key={day.day}
                      className={cn(
                        "flex gap-4 p-4 rounded-xl border gradient-card",
                        accentBorder.replace("border-", "border-l-4 border-l-").split(" ")[0],
                        "border border-hd-ink-700/60"
                      )}
                    >
                      {/* Day badge */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="size-8 rounded-full bg-hd-ink-800 border border-hd-ink-700 flex items-center justify-center text-xs font-bold text-hd-ink-300">
                          {day.day}
                        </div>
                        {idx < ride.itinerary.length - 1 && (
                          <div className="w-px flex-1 bg-hd-ink-800 mt-1.5" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-2">
                        <p className="font-semibold text-hd-ink-50 text-sm">{day.title}</p>
                        {(day.startLocation || day.endLocation) && (
                          <p className="flex items-center gap-1 text-xs text-hd-ink-400 mt-0.5">
                            <span>{day.startLocation}</span>
                            <ChevronRight className="size-3 shrink-0" />
                            <span>{day.endLocation}</span>
                            {day.estimatedKm != null && day.estimatedKm > 0 && (
                              <span className="ml-1 text-hd-ink-600">
                                · {day.estimatedKm} km
                              </span>
                            )}
                          </p>
                        )}
                        {day.description && (
                          <p className="text-xs text-hd-ink-400 mt-1.5 leading-relaxed">
                            {day.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {ride.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ride.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-hd-ink-800/60 border border-hd-ink-700/40 text-hd-ink-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right column (sidebar) */}
          <div className="ride-sidebar space-y-5">

            {/* QR code card — always shown (registration link or ride page URL) */}
            <RideQrCode
              url={qrUrl}
              label={qrLabel}
              rideTitle={ride.title}
            />

            {/* Registration card */}
            {hasRegistration && (
              <div className={cn("print:hidden p-5 rounded-xl gradient-card border", accentBorder)}>
                <h3 className="text-sm font-bold text-hd-ink-50 mb-3">Register Now</h3>
                <p className="text-xs text-hd-ink-400 mb-4">
                  {formatRideDate(ride.startDate)} · {ride.location}
                </p>
                <a
                  href={ride.registrationLink!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white font-bold text-sm transition-all hover:shadow-glow-ember"
                >
                  <Flag className="size-4" />
                  Register
                  <ExternalLink className="size-3.5 opacity-70" />
                </a>
              </div>
            )}

            {/* Route Map — hidden on print (Leaflet doesn't print well) */}
            {hasRoute && (
              <div className="print:hidden p-4 rounded-xl gradient-card border border-hd-ink-700/60">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="size-4 text-hd-ink-400" />
                  <h3 className="text-sm font-bold text-hd-ink-50">Route Map</h3>
                  <span className="ml-auto text-xs text-hd-ink-500">
                    {ride.routeData!.waypoints.length} stops
                  </span>
                </div>
                <RideRouteMap
                  waypoints={ride.routeData!.waypoints}
                  totalDistanceKm={ride.routeData!.totalDistanceKm}
                  className="h-64"
                />
                {/* Waypoint list */}
                <ol className="mt-3 space-y-1.5">
                  {ride.routeData!.waypoints.map((wp, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-hd-ink-400">
                      <span className="size-5 rounded-full bg-hd-ink-800 border border-hd-ink-700 flex items-center justify-center text-[9px] font-bold text-hd-ink-300 shrink-0">
                        {i + 1}
                      </span>
                      <span className={i === 0 || i === ride.routeData!.waypoints.length - 1
                        ? "font-semibold text-hd-ink-200"
                        : ""}
                      >
                        {wp.name}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Weather card — hidden on print */}
            {isUpcoming && (
              <div className="print:hidden p-4 rounded-xl gradient-card border border-hd-ink-700/60">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🌤️</span>
                  <h3 className="text-sm font-bold text-hd-ink-50">
                    Destination Weather
                  </h3>
                </div>

                {weather ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-hd-ink-500">{ride.location}, Nepal</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-3xl font-black text-hd-ink-50">
                            {weather.temperatureCelsius}°
                          </span>
                          <span className="text-sm text-hd-ink-400">C</span>
                        </div>
                        <p className="text-xs text-hd-ink-400 capitalize mt-0.5">
                          {weather.conditions[0]?.description}
                        </p>
                      </div>
                      {weather.conditions[0]?.icon && (
                        <Image
                          src={owIconUrl(weather.conditions[0].icon)}
                          alt={weather.conditions[0].description}
                          width={56}
                          height={56}
                          unoptimized
                        />
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { label: "Feels like", value: `${weather.feelsLikeCelsius}°C` },
                        { label: "Humidity",   value: `${weather.humidity}%` },
                        { label: "Wind",       value: `${weather.windSpeedKmh} km/h` },
                        { label: "Riding",     value: CONDITION_META[weather.ridingCondition].label },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-2 rounded-lg bg-hd-ink-800/60 border border-hd-ink-700/40">
                          <p className="text-[9px] text-hd-ink-600 uppercase tracking-wide">{label}</p>
                          <p className={cn(
                            "text-xs font-semibold mt-0.5",
                            label === "Riding"
                              ? CONDITION_META[weather.ridingCondition].color
                              : "text-hd-ink-200"
                          )}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* 3-day forecast */}
                    {weather.forecast.length > 0 && (
                      <div className="flex gap-1 pt-2 border-t border-hd-ink-800/60">
                        {weather.forecast.map((day) => (
                          <div key={day.date} className="flex-1 text-center py-1">
                            <p className="text-[9px] text-hd-ink-500">
                              {new Date(day.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" })}
                            </p>
                            <Image
                              src={owIconUrl(day.conditions[0]?.icon ?? "01d")}
                              alt=""
                              width={28}
                              height={28}
                              className="mx-auto"
                              unoptimized
                            />
                            <p className="text-[10px] text-hd-ink-50 font-medium">
                              {day.maxTempCelsius}°
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-hd-ink-500 py-2">
                    Set OPENWEATHER_API_KEY for live conditions
                  </p>
                )}
              </div>
            )}

            {/* Marshal */}
            {ride.marshal && (
              <div className="p-4 rounded-xl gradient-card border border-hd-ink-700/60">
                <p className="text-[10px] font-bold uppercase tracking-wide text-hd-ink-500 mb-2">
                  Lead Marshal
                </p>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-hd-ink-800 border border-hd-ink-700 flex items-center justify-center text-sm font-bold text-hd-ink-300 shrink-0">
                    {ride.marshal.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-hd-ink-50">{ride.marshal.name}</p>
                    {ride.marshal.phone && (
                      <p className="text-xs text-hd-ink-500">{ride.marshal.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sponsors — hidden on print */}
            {ride.sponsors.length > 0 && (
              <div className="print:hidden p-4 rounded-xl gradient-card border border-hd-ink-700/60">
                <p className="text-[10px] font-bold uppercase tracking-wide text-hd-ink-500 mb-3">
                  Supported by
                </p>
                <div className="flex flex-wrap gap-2">
                  {ride.sponsors.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-hd-ink-800/60 border border-hd-ink-700/40"
                    >
                      <div className="size-4 rounded bg-hd-ink-700 flex items-center justify-center text-[8px] font-bold text-hd-ink-400">
                        {s.name.charAt(0)}
                      </div>
                      <span className="text-xs text-hd-ink-300">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
