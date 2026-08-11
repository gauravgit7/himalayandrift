// =============================================================================
// TVS Nepal Ride Operations Platform - Application Constants
// =============================================================================

import type {
  RideStatus,
  RideType,
  RidePriority,
} from "@/types";

// ---------------------------------------------------------------------------
// Blood groups
// ---------------------------------------------------------------------------

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

// ---------------------------------------------------------------------------
// Membership cards
// ---------------------------------------------------------------------------

/**
 * Prefix for membership card numbers: `HD-<2-digit year>-<5-digit sequence>`,
 * e.g. HD-26-00001. The sequence restarts each calendar year.
 */
export const MEMBER_CARD_PREFIX = "HD";

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/**
 * Fallback point used for ride weather when a ride has no route waypoints.
 * Kathmandu — where most rides start.
 */
export const DEFAULT_RIDE_COORDINATES: [number, number] = [85.3240, 27.7172]; // [lng, lat]
export const DEFAULT_RIDE_LOCATION_NAME = "Kathmandu";

// ---------------------------------------------------------------------------
// Ride Types
// ---------------------------------------------------------------------------

export const RIDE_TYPES: {
  value: RideType;
  label: string;
  description: string;
  icon: string;
  durationDays: string;
}[] = [
  {
    value: "day",
    label: "Day Ride",
    description: "Out and back in a single day",
    icon: "🏍️",
    durationDays: "1",
  },
  {
    value: "overnight",
    label: "Overnight",
    description: "Two days, one night on the road",
    icon: "🌙",
    durationDays: "2",
  },
  {
    value: "multiday",
    label: "Multi-Day",
    description: "Three days or more",
    icon: "🏔️",
    durationDays: "3+",
  },
  {
    value: "marquee",
    label: "Marquee",
    description: "Flagship ride of the year",
    icon: "⭐",
    durationDays: "Flagship",
  },
];

/**
 * Calendar colour coding. With a single community, ride type is what the
 * calendar views colour-code by: chips in the month grids, continuation bars
 * for multi-day rides, and dots in the year grids.
 */
export const RIDE_TYPE_STYLES: Record<
  RideType,
  { chip: string; continuation: string; dot: string; label: string }
> = {
  day: {
    chip:         "bg-tvs-charcoal-800/70 border-l-tvs-charcoal-400 text-tvs-charcoal-100 hover:bg-tvs-charcoal-700/70",
    continuation: "bg-tvs-charcoal-700/30 border-l-tvs-charcoal-600",
    dot:          "bg-tvs-charcoal-300",
    label:        "Day Ride",
  },
  overnight: {
    chip:         "bg-tvs-steel-900/50 border-l-tvs-steel-400 text-tvs-steel-200 hover:bg-tvs-steel-800/60",
    continuation: "bg-tvs-steel-800/30 border-l-tvs-steel-700",
    dot:          "bg-tvs-steel-400",
    label:        "Overnight",
  },
  multiday: {
    chip:         "bg-amber-900/50 border-l-amber-400 text-amber-200 hover:bg-amber-800/60",
    continuation: "bg-amber-800/30 border-l-amber-700",
    dot:          "bg-amber-400",
    label:        "Multi-Day",
  },
  marquee: {
    chip:         "bg-violet-900/50 border-l-violet-400 text-violet-200 hover:bg-violet-800/60",
    continuation: "bg-violet-800/30 border-l-violet-700",
    dot:          "bg-violet-400",
    label:        "Marquee",
  },
};

/** Fallbacks for a ride whose type isn't recognised (e.g. legacy DB rows). */
export const RIDE_TYPE_STYLE_FALLBACK = {
  chip:         "bg-tvs-charcoal-800 border-l-tvs-charcoal-600 text-tvs-charcoal-200",
  continuation: "bg-tvs-charcoal-800 border-l-tvs-charcoal-600",
  dot:          "bg-tvs-charcoal-500",
  label:        "Ride",
} as const;

// ---------------------------------------------------------------------------
// Ride Statuses
// ---------------------------------------------------------------------------

export const RIDE_STATUSES: {
  value: RideStatus;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}[] = [
  {
    value: "planned",
    label: "Planned",
    color: "#6B7280",    // gray-500
    bgColor: "#F3F4F6",  // gray-100
    description: "Scheduled but not yet confirmed",
  },
  {
    value: "tentative",
    label: "Tentative",
    color: "#D97706",    // amber-600
    bgColor: "#FEF3C7",  // amber-100
    description: "Subject to change - awaiting confirmation",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    color: "#059669",    // emerald-600
    bgColor: "#D1FAE5",  // emerald-100
    description: "Locked in - all logistics confirmed",
  },
  {
    value: "postponed",
    label: "Postponed",
    color: "#DC2626",    // red-600
    bgColor: "#FEE2E2",  // red-100
    description: "Delayed - new date to be announced",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "#7F1D1D",    // red-900
    bgColor: "#FEE2E2",  // red-100
    description: "Permanently cancelled",
  },
  {
    value: "completed",
    label: "Completed",
    color: "#1D4ED8",    // blue-700
    bgColor: "#DBEAFE",  // blue-100
    description: "Ride successfully completed",
  },
];

// ---------------------------------------------------------------------------
// Ride Priorities
// ---------------------------------------------------------------------------

export const RIDE_PRIORITIES: {
  value: RidePriority;
  label: string;
  description: string;
  weight: number; // higher = more prominent in UI
}[] = [
  { value: "standard",  label: "Standard",  description: "Regular ride on the calendar",       weight: 1 },
  { value: "signature", label: "Signature", description: "Headline ride - promoted prominently", weight: 2 },
  { value: "marquee",   label: "Marquee",   description: "Flagship ride - premium treatment",  weight: 3 },
];

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

export const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
] as const;

export const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const DEFAULT_CALENDAR_YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Riding condition thresholds (weather)
// ---------------------------------------------------------------------------

export const RIDING_CONDITIONS = {
  excellent: { label: "Excellent",  color: "#059669", icon: "☀️" },
  good:      { label: "Good",       color: "#65A30D", icon: "🌤️" },
  caution:   { label: "Use Caution",color: "#D97706", icon: "⛅" },
  poor:      { label: "Poor",       color: "#DC2626", icon: "🌧️" },
} as const;

// ---------------------------------------------------------------------------
// Supabase storage bucket names
// ---------------------------------------------------------------------------

export const STORAGE_BUCKETS = {
  rideBanners:   "ride-banners",
  heroBanners:   "hero-banners",
  sponsorLogos:  "sponsor-logos",
  riderAvatars:  "rider-avatars",
  documents:     "ride-documents",
  memberPhotos:  "member-photos",
} as const;

// ---------------------------------------------------------------------------
// Route / Navigation
// ---------------------------------------------------------------------------

export const ROUTES = {
  home:           "/",
  calendar:       "/calendar",
  marshals:       "/marshals",
  rides:          "/rides",
  ride:           (id: string) => `/rides/${id}`,
  admin:          "/admin",
  adminRides:     "/admin/rides",
  adminCalendar:  "/admin/calendar",
  adminHomepage:  "/admin/homepage",
  adminSponsors:  "/admin/sponsors",
  adminExports:   "/admin/exports",
  adminMarshals:  "/admin/marshals",
  adminSettings:  "/admin/settings",
  adminMembers:   "/admin/members",
  membership:     "/membership",
  signin:         "/signin",
  signup:         "/signup",
  profile:        "/profile",
  memberCard:     (code: string) => `/card/${code}`,
  memberConfirmed:(code: string) => `/membership/confirmed/${code}`,
  validate:       (cardNumber: string) => `/validate/${cardNumber}`,
  login:          "/login",
} as const;

// ---------------------------------------------------------------------------
// API endpoints (internal Next.js API routes)
// ---------------------------------------------------------------------------

export const API = {
  rides:          "/api/rides",
  ride:           (id: string) => `/api/rides/${id}`,
  weather:        (rideId: string) => `/api/weather/${rideId}`,
  export:         "/api/export",
  homepage:       "/api/homepage",
} as const;

// ---------------------------------------------------------------------------
// App metadata
// ---------------------------------------------------------------------------

export const APP_META = {
  name:        "Himalayan Drift",
  shortName:   "HD",
  /** Three-beat motto. Short enough for badges, cards and the footer mark. */
  motto:       "Grit, Brotherhood, Adventure",
  /** Full tagline. Used as the hero subtitle and the site meta description. */
  tagline:     "Riding the raw side of Nepal, together",
  description: "Riding the raw side of Nepal, together — ride planning and operations for the Himalayan Drift community.",
  url:         process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  primaryColor: "#DC2626",
} as const;
