// =============================================================================
// RideWeatherCard — destination weather, streamed
//
// This used to be an `await fetchRideWeather(...)` in the body of the ride
// page. Everything on the page — title, dates, route, the Register button —
// waited behind a third-party API call to OpenWeather, which is why moving
// from /rides to a ride took as long as it did. A weather widget in the
// sidebar is the last thing a rider is there for and the slowest thing to
// fetch, which is exactly the shape Suspense exists for.
//
// Rendered inside <Suspense>, so the page ships immediately and this fills in.
// =============================================================================

import Image from "next/image";
import {
  fetchRideWeather, getRideCoords, CONDITION_META, owIconUrl,
} from "@/lib/weather/openweather";
import { cn }       from "@/utils/cn";
import type { Ride } from "@/types";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="print:hidden p-4 rounded-xl gradient-card border border-hd-ink-700/60">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🌤️</span>
        <h3 className="text-sm font-bold text-hd-ink-50">Destination Weather</h3>
      </div>
      {children}
    </div>
  );
}

/** Same height and shape as the real card, so nothing jumps when it arrives. */
export function RideWeatherSkeleton() {
  return (
    <Shell>
      <div className="animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-2.5 w-24 rounded bg-hd-ink-800" />
            <div className="h-8 w-16 rounded bg-hd-ink-800" />
            <div className="h-2.5 w-20 rounded bg-hd-ink-800" />
          </div>
          <div className="size-14 rounded-full bg-hd-ink-800" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-lg bg-hd-ink-800/60" />
          ))}
        </div>
        <div className="h-14 rounded bg-hd-ink-800/40" />
      </div>
    </Shell>
  );
}

export async function RideWeatherCard({ ride }: { ride: Ride }) {
  const { coordinates, label } = getRideCoords(ride);
  const weather = await fetchRideWeather(
    ride.id,
    coordinates[1], // lat
    coordinates[0], // lng
    `${label}, Nepal`,
  );

  if (!weather) {
    return (
      <Shell>
        <p className="text-xs text-hd-ink-500 py-2">
          Set OPENWEATHER_API_KEY for live conditions
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
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
        ].map(({ label: statLabel, value }) => (
          <div key={statLabel} className="p-2 rounded-lg bg-hd-ink-800/60 border border-hd-ink-700/40">
            <p className="text-[9px] text-hd-ink-600 uppercase tracking-wide">{statLabel}</p>
            <p className={cn(
              "text-xs font-semibold mt-0.5",
              statLabel === "Riding"
                ? CONDITION_META[weather.ridingCondition].color
                : "text-hd-ink-200",
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
    </Shell>
  );
}
