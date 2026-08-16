// =============================================================================
// RouteSparkline — the shape of a route, as an SVG polyline
//
// Deliberately not a map. This renders above the fold in the hero, so pulling
// in Leaflet and tile requests would cost the page its LCP for decoration.
// Everything here comes from routeData, which the ride already carries.
// =============================================================================

import { cn } from "@/utils/cn";
import type { RouteWaypoint } from "@/types";

interface Props {
  waypoints: RouteWaypoint[];
  className?: string;
  /** Accent for the line and the end cap. */
  tone?: "ember" | "violet";
}

const VIEW_W = 240;
const VIEW_H = 64;
const PAD    = 8;

export function RouteSparkline({ waypoints, className, tone = "ember" }: Props) {
  // A single point is a dot, not a route — nothing to draw.
  if (waypoints.length < 2) return null;

  // coordinates are [lng, lat]. Latitude grows northwards and SVG y grows
  // downwards, so y is flipped to keep the route the right way up.
  const pts = waypoints.map((w) => ({ x: w.coordinates[0], y: w.coordinates[1] }));

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  // A route that doubles back to its start spans zero in one axis; dividing by
  // that span would give NaN and silently blank the SVG.
  const spanX = maxX - minX || 1e-6;
  const spanY = maxY - minY || 1e-6;

  // Preserve the route's real proportions rather than stretching it to fill the
  // box — a straight north-south run should look like one.
  const scale = Math.min((VIEW_W - PAD * 2) / spanX, (VIEW_H - PAD * 2) / spanY);
  const drawW = spanX * scale;
  const drawH = spanY * scale;
  const offX  = (VIEW_W - drawW) / 2;
  const offY  = (VIEW_H - drawH) / 2;

  const proj = pts.map((p) => ({
    x: offX + (p.x - minX) * scale,
    y: offY + (maxY - p.y) * scale,   // flip
  }));

  const d = proj.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const start = proj[0];
  const end   = proj[proj.length - 1];

  const stroke = tone === "violet" ? "#a78bfa" : "#f09020";

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn("w-full h-auto", className)}
      role="img"
      aria-label={`Route from ${waypoints[0].name} to ${waypoints[waypoints.length - 1].name}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Soft trail under the line, so it reads on a busy gradient */}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeOpacity={0.25}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Intermediate stops */}
      {proj.slice(1, -1).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.8} fill={stroke} fillOpacity={0.65} />
      ))}

      {/* Start: hollow. End: solid. Reads as direction without an arrowhead. */}
      <circle cx={start.x} cy={start.y} r={3} fill="#0a0908" stroke={stroke} strokeWidth={1.75} />
      <circle cx={end.x}   cy={end.y}   r={3.4} fill={stroke} />
    </svg>
  );
}
