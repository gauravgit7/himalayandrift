// =============================================================================
// RouteBuilder - admin waypoint editor with Nominatim search + OSRM routing
// 'use client' - all state is local, map requires browser DOM
// =============================================================================

"use client";

import { useState, useRef, useCallback } from "react";
import dynamic      from "next/dynamic";
import {
  Plus, X, Loader2, Navigation, MapPin, GripVertical, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn }       from "@/utils/cn";
import type { RouteData, RouteWaypoint } from "@/types";

// Leaflet map - loaded client-side only
const RideRouteMap = dynamic(() => import("@/components/maps/RideRouteMap"), {
  ssr:     false,
  loading: () => (
    <div className="h-64 w-full rounded-xl bg-tvs-charcoal-800 border border-tvs-charcoal-700 flex items-center justify-center text-tvs-charcoal-500 text-sm">
      Loading map…
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NominatimResult {
  place_id:     string;
  display_name: string;
  lat:          string;
  lon:          string;
}

interface AdminWaypoint {
  id:              string;   // local key
  name:            string;   // resolved display name
  lat:             number | null;
  lng:             number | null;
  isStop:          boolean;
  query:           string;   // current search text
  suggestions:     NominatimResult[];
  showSuggestions: boolean;
  searching:       boolean;
}

function makeWaypoint(overrides?: Partial<AdminWaypoint>): AdminWaypoint {
  return {
    id:              crypto.randomUUID(),
    name:            "",
    lat:             null,
    lng:             null,
    isStop:          true,
    query:           "",
    suggestions:     [],
    showSuggestions: false,
    searching:       false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "6");
    url.searchParams.set("countrycodes", "np");
    url.searchParams.set("accept-language", "en");

    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return [];
    return (await res.json()) as NominatimResult[];
  } catch {
    return [];
  }
}

async function fetchOSRMRoute(waypoints: AdminWaypoint[]): Promise<RouteData | null> {
  const valid = waypoints.filter((w) => w.lat !== null && w.lng !== null);
  if (valid.length < 2) return null;

  const coords = valid.map((w) => `${w.lng},${w.lat}`).join(";");
  const url    = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const res  = await fetch(url);
    const data = await res.json() as {
      code: string;
      routes?: { geometry: object; distance: number; duration: number }[];
    };

    if (data.code !== "Ok" || !data.routes?.[0]) return null;

    const route = data.routes[0];
    return {
      waypoints: valid.map((w) => ({
        name:        w.name,
        coordinates: [w.lng!, w.lat!] as [number, number],
        isStop:      w.isStop,
      })),
      totalDistanceKm:       Math.round(route.distance / 100) / 10,
      estimatedDurationHours: Math.round(route.duration / 360) / 10,
      mapboxRouteGeoJSON:    route.geometry,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sub-component: single waypoint row
// ---------------------------------------------------------------------------

interface WaypointRowProps {
  wp:       AdminWaypoint;
  index:    number;
  total:    number;
  onChange: (id: string, patch: Partial<AdminWaypoint>) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string, result: NominatimResult) => void;
}

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-sm",
  "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
  "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40 transition-colors"
);

function WaypointRow({ wp, index, total, onChange, onRemove, onSelect }: WaypointRowProps) {
  const isFirst = index === 0;
  const isLast  = index === total - 1;
  const dotColor = isFirst ? "bg-emerald-500" : isLast ? "bg-tvs-red-500" : "bg-amber-500";
  const label    = isFirst ? "Start" : isLast ? "End" : `Stop ${index}`;

  return (
    <div className="flex items-start gap-2">
      {/* Drag handle + dot */}
      <div className="flex flex-col items-center gap-1 pt-2 shrink-0">
        <GripVertical className="size-4 text-tvs-charcoal-600 cursor-grab" />
        <span className={cn("size-2.5 rounded-full shrink-0", dotColor)} />
      </div>

      {/* Search input */}
      <div className="flex-1 relative">
        <div className="relative">
          {wp.searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-tvs-charcoal-500 animate-spin" />
          )}
          {wp.lat !== null && !wp.searching && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-emerald-500" />
          )}
          <input
            type="text"
            value={wp.query}
            onChange={(e) => onChange(wp.id, { query: e.target.value, lat: null, lng: null, name: "" })}
            placeholder={`${label} - search location in Nepal…`}
            className={cn(inputCls, wp.lat !== null && "border-emerald-700/50")}
            autoComplete="off"
          />
        </div>

        {/* Suggestions dropdown */}
        {wp.showSuggestions && wp.suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-tvs-charcoal-900 border border-tvs-charcoal-700 rounded-lg shadow-cinematic overflow-hidden">
            {wp.suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                onClick={() => onSelect(wp.id, s)}
                className="flex items-start gap-2 w-full px-3 py-2 text-left hover:bg-tvs-charcoal-800 transition-colors"
              >
                <MapPin className="size-3.5 text-tvs-charcoal-500 mt-0.5 shrink-0" />
                <span className="text-xs text-tvs-charcoal-300 leading-snug line-clamp-2">
                  {s.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Is Stop toggle (only for middle waypoints) */}
      {!isFirst && !isLast && (
        <label className="flex items-center gap-1 pt-2 cursor-pointer shrink-0" title="Mark as a stop">
          <input
            type="checkbox"
            checked={wp.isStop}
            onChange={(e) => onChange(wp.id, { isStop: e.target.checked })}
            className="sr-only"
          />
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded border transition-colors",
            wp.isStop
              ? "bg-amber-900/50 text-amber-400 border-amber-800/40"
              : "bg-tvs-charcoal-800 text-tvs-charcoal-600 border-tvs-charcoal-700"
          )}>
            {wp.isStop ? "Stop" : "Via"}
          </span>
        </label>
      )}

      {/* Remove */}
      {total > 2 && (
        <button
          type="button"
          onClick={() => onRemove(wp.id)}
          className="mt-2 p-1 rounded text-tvs-charcoal-600 hover:text-tvs-red-400 hover:bg-tvs-red-950/30 transition-colors shrink-0"
          title="Remove waypoint"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main RouteBuilder component
// ---------------------------------------------------------------------------

interface RouteBuilderProps {
  initialRouteData?: RouteData | null;
  onChange:          (routeData: RouteData | null) => void;
}

export function RouteBuilder({ initialRouteData, onChange }: RouteBuilderProps) {
  // Initialise waypoints from existing routeData (edit mode)
  const [waypoints, setWaypoints] = useState<AdminWaypoint[]>(() => {
    if (initialRouteData?.waypoints?.length) {
      return initialRouteData.waypoints.map((w) => makeWaypoint({
        name:  w.name,
        query: w.name,
        lat:   w.coordinates[1],
        lng:   w.coordinates[0],
        isStop: w.isStop,
      }));
    }
    return [makeWaypoint(), makeWaypoint()]; // default: start + end
  });

  const [fetchedRoute, setFetchedRoute] = useState<RouteData | null>(initialRouteData ?? null);
  const [fetching,     setFetching]     = useState(false);
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  // Per-waypoint search debounce timers
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Waypoint update helper ──────────────────────────────────────────────
  const updateWaypoint = useCallback((id: string, patch: Partial<AdminWaypoint>) => {
    setWaypoints((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } : w));
  }, []);

  // ── Typing in search → debounced Nominatim call ──────────────────────────
  const handleQueryChange = useCallback((id: string, patch: Partial<AdminWaypoint>) => {
    updateWaypoint(id, { ...patch, showSuggestions: false, suggestions: [] });

    const query = patch.query ?? "";
    if (timers.current[id]) clearTimeout(timers.current[id]);
    if (query.length < 3) return;

    updateWaypoint(id, { searching: true });
    timers.current[id] = setTimeout(async () => {
      const results = await searchNominatim(query);
      updateWaypoint(id, { searching: false, suggestions: results, showSuggestions: results.length > 0 });
    }, 500);
  }, [updateWaypoint]);

  // ── Select a suggestion → resolve coords ────────────────────────────────
  const handleSelect = useCallback((id: string, result: NominatimResult) => {
    updateWaypoint(id, {
      name:            result.display_name.split(",")[0].trim(),
      query:           result.display_name.split(",")[0].trim(),
      lat:             parseFloat(result.lat),
      lng:             parseFloat(result.lon),
      showSuggestions: false,
      suggestions:     [],
    });
    // Clear saved route when waypoints change
    setFetchedRoute(null);
    onChange(null);
  }, [updateWaypoint, onChange]);

  // ── Remove waypoint ──────────────────────────────────────────────────────
  const removeWaypoint = useCallback((id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    setFetchedRoute(null);
    onChange(null);
  }, [onChange]);

  // ── Add waypoint (inserted before the last/end waypoint) ─────────────────
  const addWaypoint = () => {
    setWaypoints((prev) => {
      const copy = [...prev];
      copy.splice(copy.length - 1, 0, makeWaypoint({ isStop: true }));
      return copy;
    });
    setFetchedRoute(null);
    onChange(null);
  };

  // ── Fetch route from OSRM ────────────────────────────────────────────────
  const handleFetchRoute = async () => {
    const resolved = waypoints.filter((w) => w.lat !== null);
    if (resolved.length < 2) {
      setFetchError("Set at least 2 locations before fetching the route.");
      return;
    }
    setFetching(true);
    setFetchError(null);
    const route = await fetchOSRMRoute(waypoints);
    setFetching(false);
    if (!route) {
      setFetchError("OSRM could not calculate this route. Check the waypoints and try again.");
      return;
    }
    setFetchedRoute(route);
    onChange(route);
  };

  // ── Clear route ──────────────────────────────────────────────────────────
  const clearRoute = () => {
    setFetchedRoute(null);
    setWaypoints([makeWaypoint(), makeWaypoint()]);
    onChange(null);
  };

  const resolvedCount = waypoints.filter((w) => w.lat !== null).length;
  const canFetch      = resolvedCount >= 2;

  return (
    <div className="space-y-4">
      {/* ── Waypoints list ── */}
      <div className="space-y-2">
        {waypoints.map((wp, i) => (
          <WaypointRow
            key={wp.id}
            wp={wp}
            index={i}
            total={waypoints.length}
            onChange={handleQueryChange}
            onRemove={removeWaypoint}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* ── Add waypoint + Fetch Route ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={addWaypoint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-tvs-charcoal-700 text-xs font-semibold text-tvs-charcoal-500 hover:border-tvs-charcoal-500 hover:text-tvs-charcoal-300 transition-all"
        >
          <Plus className="size-3.5" />
          Add Stop
        </button>

        <button
          type="button"
          onClick={handleFetchRoute}
          disabled={!canFetch || fetching}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
            canFetch && !fetching
              ? "bg-tvs-red-600 text-white hover:bg-tvs-red-500 hover:shadow-glow-red"
              : "bg-tvs-charcoal-800 text-tvs-charcoal-600 border border-tvs-charcoal-700 cursor-not-allowed"
          )}
        >
          {fetching ? (
            <><Loader2 className="size-3.5 animate-spin" />Fetching route…</>
          ) : (
            <><Navigation className="size-3.5" />Fetch Route via OSRM</>
          )}
        </button>

        {fetchedRoute && (
          <button
            type="button"
            onClick={clearRoute}
            className="text-xs text-tvs-charcoal-600 hover:text-tvs-red-400 transition-colors"
          >
            Clear route
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {fetchError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40 text-tvs-red-300 text-xs">
          <AlertCircle className="size-3.5 shrink-0 mt-px" />
          {fetchError}
        </div>
      )}

      {/* ── Route stats ── */}
      {fetchedRoute && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/30 text-xs text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>
            <strong>{fetchedRoute.totalDistanceKm} km</strong>
            {" "}·{" "}
            {fetchedRoute.estimatedDurationHours != null && (
              <strong>
                {fetchedRoute.estimatedDurationHours >= 1
                  ? `${Math.floor(fetchedRoute.estimatedDurationHours)}h ${Math.round((fetchedRoute.estimatedDurationHours % 1) * 60)}min`
                  : `${Math.round(fetchedRoute.estimatedDurationHours * 60)} min`}
              </strong>
            )}
            {" "}· {fetchedRoute.waypoints.length} waypoints
            {" "}· Route saved ✓
          </span>
        </div>
      )}

      {/* ── Live map preview ── */}
      {fetchedRoute && (
        <RideRouteMap
          waypoints={fetchedRoute.waypoints}
          totalDistanceKm={fetchedRoute.totalDistanceKm}
          className="h-64 rounded-xl overflow-hidden border border-tvs-charcoal-700"
        />
      )}

      {/* Helper text */}
      {!fetchedRoute && (
        <p className="text-[10px] text-tvs-charcoal-600">
          Search locations using OpenStreetMap · Route calculated via OSRM (free, no API key) ·
          Route is saved with the ride automatically
        </p>
      )}
    </div>
  );
}
