// =============================================================================
// WeatherWidget - Phase 7 · Real OpenWeather data
// Server component - receives weather data fetched by the page component.
// Falls back gracefully when OPENWEATHER_API_KEY is not set.
// Phase 9 · AnimateIn for header, StaggerContainer for weather cards
// =============================================================================

import Image        from "next/image";
import { cn }       from "@/utils/cn";
import { formatRideDate } from "@/utils/date";
import { CONDITION_META, owIconUrl } from "@/lib/weather/openweather";
import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/AnimateIn";
import type { Ride, RideWeather } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeatherItem {
  ride:    Ride;
  weather: RideWeather | null;
}

interface WeatherWidgetProps {
  items: WeatherItem[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WeatherCard({ ride, weather }: WeatherItem) {
  const cond = weather ? CONDITION_META[weather.ridingCondition] : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 rounded-xl border",
        cond ? cond.bg : "bg-tvs-charcoal-800/40 border-tvs-charcoal-700/40"
      )}
    >
      {/* Ride meta */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-tvs-charcoal-100 truncate">{ride.title}</p>
          <p className="text-xs text-tvs-charcoal-500 mt-0.5">{formatRideDate(ride.startDate)}</p>
        </div>
        {/* OW weather icon */}
        {weather?.conditions[0]?.icon ? (
          <Image
            src={owIconUrl(weather.conditions[0].icon)}
            alt={weather.conditions[0].description}
            width={40}
            height={40}
            className="shrink-0 -mt-1 -mr-1"
            unoptimized
          />
        ) : (
          <span className="text-2xl shrink-0">{cond?.icon ?? "🌡️"}</span>
        )}
      </div>

      {/* Weather stats */}
      {weather ? (
        <>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-tvs-charcoal-50 leading-none">
              {weather.temperatureCelsius}°
            </span>
            <div className="text-xs text-tvs-charcoal-400 space-y-0.5">
              <p>Feels {weather.feelsLikeCelsius}°C</p>
              <p>💨 {weather.windSpeedKmh} km/h · 💧 {weather.humidity}%</p>
            </div>
          </div>

          {/* Condition badge */}
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-bold", cond?.color)}>{cond?.label}</span>
            <span className="text-xs text-tvs-charcoal-500 capitalize">
              {weather.conditions[0]?.description}
            </span>
          </div>

          {/* Mini forecast */}
          {weather.forecast.length > 0 && (
            <div className="flex gap-2 pt-1 border-t border-white/5">
              {weather.forecast.slice(0, 3).map((day) => {
                const dc = CONDITION_META[day.ridingCondition];
                return (
                  <div
                    key={day.date}
                    className="flex-1 text-center"
                  >
                    <p className="text-[10px] text-tvs-charcoal-500">
                      {new Date(day.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" })}
                    </p>
                    <Image
                      src={owIconUrl(day.conditions[0]?.icon ?? "01d")}
                      alt={day.conditions[0]?.description ?? ""}
                      width={28}
                      height={28}
                      className="mx-auto"
                      unoptimized
                    />
                    <p className="text-[10px] text-tvs-charcoal-50 font-medium">
                      {day.maxTempCelsius}°
                      <span className="text-tvs-charcoal-600">/{day.minTempCelsius}°</span>
                    </p>
                    <span className={cn("text-[9px] font-bold", dc.color)}>{dc.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Fallback when API not configured */
        <div className="space-y-1">
          <p className="text-sm font-semibold text-tvs-charcoal-200">{ride.location}</p>
          <p className="text-xs text-tvs-charcoal-600">
            Set OPENWEATHER_API_KEY for live conditions
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WeatherWidget({ items }: WeatherWidgetProps) {
  if (!items.length) return null;

  const hasRealData = items.some((i) => i.weather !== null);

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-tvs-charcoal-700/50 gradient-card">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-tvs-steel-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <AnimateIn className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">🌤️</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-tvs-steel-400">
                  Ride Weather
                </span>
              </div>
              <h3 className="text-xl font-black text-tvs-charcoal-50">
                Conditions for Upcoming Destinations
              </h3>
              <p className="text-sm text-tvs-charcoal-400 mt-1">
                {hasRealData
                  ? "Live conditions via OpenWeather · Updated every 30 minutes"
                  : "Add OPENWEATHER_API_KEY to .env.local for live forecasts"}
              </p>
            </div>
            {hasRealData && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-emerald-900/40 text-emerald-400 border border-emerald-800/30">
                Live
              </span>
            )}
          </AnimateIn>

          {/* Cards */}
          <StaggerContainer className="grid sm:grid-cols-3 gap-3" delayStart={0.08}>
            {items.map(({ ride, weather }) => (
              <StaggerItem key={ride.id}>
                <WeatherCard ride={ride} weather={weather} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {hasRealData && (
            <p className="mt-4 text-[10px] text-tvs-charcoal-600 text-center">
              Powered by OpenWeather · Coordinates from each ride&apos;s route start
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
