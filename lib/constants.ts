// =============================================================================
// TVS Nepal Ride Operations Platform - Application Constants
// =============================================================================

import type {
  ChapterName,
  Community,
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
// Communities
// ---------------------------------------------------------------------------

export const COMMUNITIES: { value: Community; label: string; color: string }[] =
  [
    { value: "AOG", label: "Apache Owners Group", color: "#DC2626" },   // red-600
    { value: "CULT", label: "CULT", color: "#2563EB" },                  // blue-600
    { value: "AOGxCULT", label: "AOG × CULT", color: "#7C3AED" },       // violet-700
  ];

// ---------------------------------------------------------------------------
// Chapters (9 total; 4 priority)
// ---------------------------------------------------------------------------

export const CHAPTERS: {
  name: ChapterName;
  region: string;
  isPriority: boolean;
  coordinates: [number, number]; // [lng, lat]
}[] = [
  // Priority chapters
  { name: "Bagmati",   region: "Bagmati Province",   isPriority: true,  coordinates: [85.3240, 27.7172] },
  { name: "Gandaki",   region: "Gandaki Province",   isPriority: true,  coordinates: [84.0148, 28.2096] },
  { name: "Narayani",  region: "Bagmati Province",   isPriority: true,  coordinates: [85.1200, 27.6783] },
  { name: "Lumbini",   region: "Lumbini Province",   isPriority: true,  coordinates: [83.2762, 27.4833] },
  // Standard chapters
  { name: "Rapti",     region: "Lumbini Province",   isPriority: false, coordinates: [82.1980, 28.0900] },
  { name: "Bheri",     region: "Karnali Province",   isPriority: false, coordinates: [81.6100, 28.2600] },
  { name: "Mahakali",  region: "Sudurpashchim Province", isPriority: false, coordinates: [80.1780, 29.5900] },
  { name: "Koshi",     region: "Koshi Province",     isPriority: false, coordinates: [87.2700, 26.8065] },
  { name: "Mechi",     region: "Koshi Province",     isPriority: false, coordinates: [88.0900, 26.6400] },
];

export const CHAPTER_NAMES = CHAPTERS.map((c) => c.name);
export const PRIORITY_CHAPTERS = CHAPTERS.filter((c) => c.isPriority).map((c) => c.name);

/** 3-letter abbreviations used in membership card numbers  e.g. AOG-BAG-26-00001 */
export const CHAPTER_CODES: Record<string, string> = {
  Bagmati:  "BAG",
  Gandaki:  "GAN",
  Narayani: "NAR",
  Lumbini:  "LUM",
  Rapti:    "RAP",
  Bheri:    "BHE",
  Mahakali: "MAH",
  Koshi:    "KOS",
  Mechi:    "MEC",
} as const;

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
    value: "chapter",
    label: "Chapter Ride",
    description: "Breakfast or recreational rides - 20–30 riders",
    icon: "🏍️",
    durationDays: "1",
  },
  {
    value: "cult",
    label: "CULT Ride",
    description: "Travel, lifestyle, exploration & culture focused",
    icon: "🗺️",
    durationDays: "1",
  },
  {
    value: "overnight",
    label: "Overnight Ride",
    description: "2D1N rides - quarterly cadence",
    icon: "🌙",
    durationDays: "2",
  },
  {
    value: "marquee",
    label: "Marquee Ride",
    description: "Flagship 4–6 day rides - AOG × CULT - 2 per year",
    icon: "⭐",
    durationDays: "4–6",
  },
];

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
  { value: "local",    label: "Local",    description: "Single chapter, local event",    weight: 1 },
  { value: "chapter",  label: "Chapter",  description: "Chapter-wide ride",              weight: 2 },
  { value: "national", label: "National", description: "Multi-chapter national event",   weight: 3 },
  { value: "marquee",  label: "Marquee",  description: "Flagship ride - premium treatment", weight: 4 },
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
// Frequency expectations (for planning validation/display)
// ---------------------------------------------------------------------------

export const RIDE_FREQUENCY = {
  aogMonthly: { min: 3, max: 4 },
  cultMonthly: { min: 1, max: 2 },
  overnightQuarterly: { min: 1, max: 2 },
  marqueeYearly: 2,
} as const;

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
  chapters:       "/chapters",
  marshals:       "/marshals",
  rides:          "/rides",
  ride:           (id: string) => `/rides/${id}`,
  admin:          "/admin",
  adminRides:     "/admin/rides",
  adminChapters:  "/admin/chapters",
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
  chapters:       "/api/chapters",
  weather:        (rideId: string) => `/api/weather/${rideId}`,
  export:         "/api/export",
  homepage:       "/api/homepage",
} as const;

// ---------------------------------------------------------------------------
// App metadata
// ---------------------------------------------------------------------------

export const APP_META = {
  name:        "TVS Nepal Ride Operations",
  shortName:   "TVS Nepal",
  description: "Annual ride planning and operations platform for AOG & CULT communities",
  url:         process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  primaryColor: "#DC2626",
} as const;
