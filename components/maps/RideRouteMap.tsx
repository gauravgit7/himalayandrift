// =============================================================================
// RideRouteMap - Leaflet + OpenStreetMap (CartoDB Dark Matter tiles)
// Completely free - no API key required.
// 'use client' + loaded via `dynamic(..., { ssr: false })` in Server Components.
// =============================================================================

"use client";

import { useMemo }                                    from "react";
import { MapContainer, TileLayer, Polyline,
         CircleMarker, Tooltip }                      from "react-leaflet";
import type { LatLngExpression,
              LatLngBoundsExpression }                from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteWaypoint }                         from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RideRouteMapProps {
  waypoints:        RouteWaypoint[];
  totalDistanceKm?: number | null;
  className?:       string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeBounds(waypoints: RouteWaypoint[]): LatLngBoundsExpression {
  const lats = waypoints.map((w) => w.coordinates[1]);
  const lngs = waypoints.map((w) => w.coordinates[0]);
  return [
    [Math.min(...lats) - 0.08, Math.min(...lngs) - 0.08],
    [Math.max(...lats) + 0.08, Math.max(...lngs) + 0.08],
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RideRouteMap({
  waypoints,
  totalDistanceKm,
  className = "h-72",
}: RideRouteMapProps) {
  const hasRoute = waypoints && waypoints.length >= 2;

  // Hooks must be called before any conditional return
  const positions = useMemo<LatLngExpression[]>(
    () =>
      hasRoute
        ? waypoints.map((w) => [w.coordinates[1], w.coordinates[0]] as LatLngExpression)
        : [],
    [waypoints, hasRoute],
  );

  const bounds = useMemo<LatLngBoundsExpression | undefined>(
    () => (hasRoute ? computeBounds(waypoints) : undefined),
    [waypoints, hasRoute],
  );

  // ── Not enough waypoints ────────────────────────────────────────────────────
  if (!hasRoute) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-xl bg-tvs-charcoal-900/60 border border-tvs-charcoal-700/60`}
      >
        <p className="text-sm text-tvs-charcoal-500">Route map not available</p>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-xl overflow-hidden relative`}>
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        dragging
        zoomControl
        style={{ width: "100%", height: "100%" }}
      >
        {/* CartoDB Dark Matter - free, no API key, dark theme */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Dashed red route line */}
        <Polyline
          positions={positions}
          pathOptions={{
            color:      "#DC2626",
            weight:     3,
            opacity:    0.85,
            dashArray:  "8 4",
          }}
        />

        {/* Soft glow line underneath */}
        <Polyline
          positions={positions}
          pathOptions={{
            color:      "#DC2626",
            weight:     12,
            opacity:    0.12,
          }}
        />

        {/* Waypoint markers */}
        {waypoints.map((wp, i) => {
          const isEndpoint = i === 0 || i === waypoints.length - 1;
          return (
            <CircleMarker
              key={`${wp.name}-${i}`}
              center={[wp.coordinates[1], wp.coordinates[0]]}
              radius={isEndpoint ? 10 : 6}
              pathOptions={{
                fillColor:   isEndpoint ? "#DC2626" : "#374151",
                color:       "#ffffff",
                weight:      2,
                opacity:     1,
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>
                  {i === 0 ? "▶ " : i === waypoints.length - 1 ? "⬛ " : ""}
                  {wp.name}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Distance badge (above map controls) */}
      {totalDistanceKm && (
        <div className="absolute bottom-3 right-10 z-[1000] px-2.5 py-1 rounded-lg bg-tvs-charcoal-900/90 border border-tvs-charcoal-700/60 text-xs text-tvs-charcoal-300 font-medium backdrop-blur-sm pointer-events-none">
          {totalDistanceKm} km total
        </div>
      )}

      {/* Start / End legend */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1 max-w-[140px] pointer-events-none">
        {[waypoints[0], waypoints[waypoints.length - 1]].map((wp, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-tvs-charcoal-900/80 border border-tvs-charcoal-700/40 backdrop-blur-sm"
          >
            <span className="text-[9px] font-bold text-tvs-red-400">
              {i === 0 ? "START" : "END"}
            </span>
            <span className="text-[10px] text-tvs-charcoal-300 truncate">{wp.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
