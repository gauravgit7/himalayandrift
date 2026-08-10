// =============================================================================
// OpenWeather API Integration - server-side only
// Uses the free 2.5 Current + Forecast endpoints.
// If OPENWEATHER_API_KEY is not set, all functions return null gracefully.
// Results are cached for 30 minutes via Next.js fetch caching.
// =============================================================================

import type { RideWeather, WeatherCondition, WeatherForecastDay } from "@/types";
import type { ChapterName } from "@/types";
import { CHAPTERS } from "@/lib/constants";

const BASE = "https://api.openweathermap.org/data/2.5";

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

/** Returns [lng, lat] for a chapter's HQ, or null if unknown */
export function getChapterCoords(chapter: ChapterName): [number, number] | null {
  return CHAPTERS.find((c) => c.name === chapter)?.coordinates ?? null;
}

// ---------------------------------------------------------------------------
// Riding-condition scoring
// ---------------------------------------------------------------------------

type RidingCondition = RideWeather["ridingCondition"];

/**
 * Maps OpenWeather condition codes + temp + wind speed to a riding-condition
 * rating used throughout the app.
 *
 * OW code ranges:
 *   2xx = thunderstorm   5xx = rain   6xx = snow   7xx = atmosphere
 *   800 = clear          80x = clouds
 */
export function scoreRidingCondition(
  weatherId:  number,
  tempCelsius: number,
  windKmh:    number,
): RidingCondition {
  // Absolute deal-breakers
  if (tempCelsius < 0 || tempCelsius > 42) return "poor";
  if (windKmh > 80)                         return "poor";
  if (weatherId >= 200 && weatherId < 300)  return "poor"; // thunderstorm
  if (weatherId >= 600 && weatherId < 700)  return "poor"; // snow
  if (weatherId === 511)                    return "poor"; // freezing rain
  if (weatherId >= 502 && weatherId <= 504) return "poor"; // heavy/violent rain

  // Caution territory
  if (tempCelsius < 5 || tempCelsius > 38) return "caution";
  if (windKmh > 50)                         return "caution";
  if (weatherId >= 300 && weatherId < 400)  return "caution"; // drizzle
  if (weatherId >= 500 && weatherId < 600)  return "caution"; // rain (non-heavy)
  if (weatherId >= 700 && weatherId < 800)  return "caution"; // fog/mist/haze

  // Good but not ideal
  if (weatherId >= 803) return "good"; // broken or overcast cloud
  if (windKmh > 30)     return "good";
  if (tempCelsius < 10 || tempCelsius > 32) return "good";

  return "excellent";
}

// ---------------------------------------------------------------------------
// Raw OpenWeather API response shapes
// ---------------------------------------------------------------------------

interface OWWeatherEntry {
  id:          number;
  main:        string;
  description: string;
  icon:        string;
}

interface OWCurrentResponse {
  name:    string;
  weather: OWWeatherEntry[];
  main: {
    temp:       number;
    feels_like: number;
    humidity:   number;
  };
  wind: { speed: number }; // m/s
}

interface OWForecastItem {
  dt_txt: string;
  weather: OWWeatherEntry[];
  main: {
    temp:     number;
    temp_min: number;
    temp_max: number;
  };
}

interface OWForecastResponse {
  list: OWForecastItem[];
}

// ---------------------------------------------------------------------------
// Public fetch functions
// ---------------------------------------------------------------------------

/**
 * Fetch current weather + 3-day forecast for a lat/lon point.
 * Returns null if the API key is missing or the request fails.
 */
export async function fetchRideWeather(
  rideId:       string,
  lat:          number,
  lng:          number,
  locationName: string,
): Promise<RideWeather | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const [curRes, fcastRes] = await Promise.all([
      fetch(
        `${BASE}/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`,
        { next: { revalidate: 1800 } },
      ),
      fetch(
        `${BASE}/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=8`,
        { next: { revalidate: 1800 } },
      ),
    ]);

    if (!curRes.ok || !fcastRes.ok) return null;

    const current  = (await curRes.json())   as OWCurrentResponse;
    const forecast = (await fcastRes.json()) as OWForecastResponse;

    const windKmh  = Math.round((current.wind?.speed ?? 0) * 3.6);
    const tempC    = Math.round(current.main.temp);
    const mainCond = current.weather[0];

    const conditions: WeatherCondition[] = [{
      id:          mainCond.id,
      main:        mainCond.main,
      description: mainCond.description,
      icon:        mainCond.icon,
    }];

    // Aggregate forecast: one entry per unique day (take first 3-hour slot)
    const dayMap = new Map<string, OWForecastItem>();
    for (const item of forecast.list) {
      const day = item.dt_txt.slice(0, 10); // "YYYY-MM-DD"
      if (!dayMap.has(day)) dayMap.set(day, item);
    }

    const forecastDays: WeatherForecastDay[] = Array.from(dayMap.values())
      .slice(0, 3)
      .map((item) => {
        const w = item.weather[0];
        const t = Math.round(item.main.temp);
        const wk = windKmh; // use current wind as proxy for forecast (OW free tier)
        return {
          date:            item.dt_txt.slice(0, 10),
          maxTempCelsius:  Math.round(item.main.temp_max),
          minTempCelsius:  Math.round(item.main.temp_min),
          conditions:      [{ id: w.id, main: w.main, description: w.description, icon: w.icon }],
          ridingCondition: scoreRidingCondition(w.id, t, wk),
        };
      });

    return {
      rideId,
      location:           locationName,
      temperatureCelsius: tempC,
      feelsLikeCelsius:   Math.round(current.main.feels_like),
      humidity:           current.main.humidity,
      windSpeedKmh:       windKmh,
      conditions,
      ridingCondition:    scoreRidingCondition(mainCond.id, tempC, windKmh),
      forecast:           forecastDays,
      fetchedAt:          new Date().toISOString(),
    };
  } catch (err) {
    console.error("[openweather] fetch error:", err);
    return null;
  }
}

/**
 * Fetch weather for a list of rides using their chapter coordinates.
 * Returns one entry per ride (null if unavailable).
 */
export async function fetchWeatherForRides(
  rides: Array<{ id: string; chapter: ChapterName }>,
): Promise<(RideWeather | null)[]> {
  return Promise.all(
    rides.map((ride) => {
      const coords = getChapterCoords(ride.chapter);
      if (!coords) return null;
      const [lng, lat] = coords;
      return fetchRideWeather(ride.id, lat, lng, `${ride.chapter}, Nepal`);
    }),
  );
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const CONDITION_META: Record<RidingCondition, {
  label: string; icon: string; color: string; bg: string;
}> = {
  excellent: { label: "Excellent",   icon: "☀️",  color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/30" },
  good:      { label: "Good",        icon: "🌤️", color: "text-lime-400",    bg: "bg-lime-950/40 border-lime-800/30"     },
  caution:   { label: "Use Caution", icon: "⛅",  color: "text-amber-400",   bg: "bg-amber-950/40 border-amber-800/30"   },
  poor:      { label: "Poor",        icon: "🌧️", color: "text-red-400",     bg: "bg-red-950/40 border-red-800/30"       },
};

/** URL for an OpenWeather icon (2x resolution) */
export function owIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
