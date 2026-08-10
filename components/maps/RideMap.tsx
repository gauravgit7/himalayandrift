// =============================================================================
// RideMap - full interactive Leaflet map for the public ride detail page
// Loaded via next/dynamic with ssr:false - Leaflet requires a browser DOM.
// =============================================================================

"use client";

import { useEffect }    from "react";
import {
  MapContainer, TileLayer, Polyline, Marker, Popup, useMap,
} from "react-leaflet";
import L                from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteData } from "@/types";

// ---------------------------------------------------------------------------
// Custom circular markers - avoids webpack default-icon path issue
// ---------------------------------------------------------------------------

function pinIcon(color: string) {
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 1px 5px rgba(0,0,0,.55);
    "></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
    className:  "",
  });
}

const START_ICON = pinIcon("#10B981");
const STOP_ICON  = pinIcon("#F59E0B");
const END_ICON   = pinIcon("#DC2626");

// ---------------------------------------------------------------------------
// Auto-fit map to waypoints
// ---------------------------------------------------------------------------

function BoundsFit({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [48, 48], maxZoom: 13 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 11);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RideMapProps {
  routeData: RouteData;
  className?: string;
  interactive?: boolean;  // false disables scroll/drag (mini-map mode)
}

export default function RideMap({
  routeData,
  className   = "h-80 w-full rounded-xl overflow-hidden",
  interactive = true,
}: RideMapProps) {
  const { waypoints, mapboxRouteGeoJSON, totalDistanceKm, estimatedDurationHours } = routeData;

  // Leaflet uses [lat, lng]; GeoJSON uses [lng, lat]
  const routePositions: [number, number][] = mapboxRouteGeoJSON
    ? ((mapboxRouteGeoJSON as { coordinates: [number, number][] }).coordinates ?? [])
        .map(([lng, lat]) => [lat, lng])
    : waypoints.map((w) => [w.coordinates[1], w.coordinates[0]]);

  const markerPositions: [number, number][] =
    waypoints.map((w) => [w.coordinates[1], w.coordinates[0]]);

  const center: [number, number] = markerPositions[0] ?? [28.3949, 84.124];

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={9}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        keyboard={false}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        attributionControl={interactive}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Route polyline */}
        {routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: "#DC2626", weight: 3.5, opacity: 0.85 }}
          />
        )}

        {/* Waypoint markers */}
        {waypoints.map((wp, i) => {
          const isFirst = i === 0;
          const isLast  = i === waypoints.length - 1;
          const icon    = isFirst ? START_ICON : isLast ? END_ICON : STOP_ICON;
          const label   = isFirst ? "Start" : isLast ? "End" : wp.isStop ? "Stop" : "Via";
          return (
            <Marker
              key={i}
              position={[wp.coordinates[1], wp.coordinates[0]]}
              icon={icon}
            >
              {interactive && (
                <Popup>
                  <p className="font-semibold text-sm m-0">{wp.name}</p>
                  <p className="text-xs text-gray-500 m-0">{label}</p>
                </Popup>
              )}
            </Marker>
          );
        })}

        {markerPositions.length > 0 && <BoundsFit positions={markerPositions} />}
      </MapContainer>

      {/* Stats bar - shown only in interactive / full mode */}
      {interactive && (totalDistanceKm || estimatedDurationHours) && (
        <div className="flex items-center gap-4 px-4 py-2 bg-tvs-charcoal-900 border-t border-tvs-charcoal-800 rounded-b-xl text-xs text-tvs-charcoal-400">
          {totalDistanceKm && (
            <span>
              <strong className="text-tvs-charcoal-100">{totalDistanceKm} km</strong>
              {" "}total distance
            </span>
          )}
          {estimatedDurationHours && (
            <span>
              <strong className="text-tvs-charcoal-100">
                {estimatedDurationHours >= 1
                  ? `${Math.floor(estimatedDurationHours)}h ${Math.round((estimatedDurationHours % 1) * 60)}min`
                  : `${Math.round(estimatedDurationHours * 60)} min`}
              </strong>
              {" "}riding time
            </span>
          )}
          <span className="ml-auto text-tvs-charcoal-600">
            {waypoints.length} waypoints
          </span>
        </div>
      )}
    </div>
  );
}
