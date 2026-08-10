// =============================================================================
// TVS Nepal Ride Operations Platform - Central Type Definitions
// =============================================================================

// ---------------------------------------------------------------------------
// Enumerations (string unions for type safety + Supabase compatibility)
// ---------------------------------------------------------------------------

export type RideType =
  | "day"          // Single-day rides
  | "overnight"    // 2D1N rides
  | "multiday"     // 3+ day rides
  | "marquee";     // Flagship rides

export type RideStatus =
  | "planned"
  | "tentative"
  | "confirmed"
  | "postponed"
  | "cancelled"
  | "completed";

export type RidePriority = "standard" | "signature" | "marquee";

export type ChapterName =
  | "Bagmati"
  | "Narayani"
  | "Gandaki"
  | "Lumbini"
  | "Rapti"
  | "Bheri"
  | "Mahakali"
  | "Koshi"
  | "Mechi";

// ---------------------------------------------------------------------------
// Sponsor
// ---------------------------------------------------------------------------

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  websiteUrl: string | null;
  tier: "title" | "co" | "associate" | "media";
}

// ---------------------------------------------------------------------------
// Route Data (Mapbox)
// ---------------------------------------------------------------------------

export interface RouteWaypoint {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  isStop: boolean;
}

export interface RouteData {
  waypoints: RouteWaypoint[];
  totalDistanceKm: number | null;
  estimatedDurationHours: number | null;
  mapboxRouteGeoJSON: object | null; // Raw GeoJSON from Mapbox Directions API
}

// ---------------------------------------------------------------------------
// Itinerary
// ---------------------------------------------------------------------------

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  startLocation: string;
  endLocation: string;
  estimatedKm: number | null;
}

// ---------------------------------------------------------------------------
// Marshal / Lead Rider
// ---------------------------------------------------------------------------

export interface Marshal {
  id: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  /** Null for Head Marshal (national-level, not chapter-specific) */
  chapter: ChapterName | null;
  /** Tier role: "Head Marshal" | "Senior Marshal" | "Regional Marshal" | custom */
  role: string;
  /** Comma-separated specialty tags, e.g. "Navigation, Route Planning, High Altitude" */
  specialty: string | null;
  bio: string | null;
  totalRidesLed: number;
  isActive: boolean;
  /** Instagram handle without @, e.g. "tvs_rider_ram". Null if not provided. */
  instagramHandle: string | null;
}

// ---------------------------------------------------------------------------
// Core Ride Object
// ---------------------------------------------------------------------------

export interface Ride {
  id: string;
  title: string;
  slug: string;
  rideType: RideType;
  chapter: ChapterName;
  startDate: string;        // ISO date string "YYYY-MM-DD"
  endDate: string;          // ISO date string "YYYY-MM-DD"
  status: RideStatus;
  priority: RidePriority;
  description: string | null;
  shortDescription: string | null;
  bannerImageUrl: string | null;
  expectedRiders: number;
  registrationLink: string | null;
  routeData: RouteData | null;
  itinerary: ItineraryDay[];
  marshal: Marshal | null;
  sponsors: Sponsor[];
  tags: string[];
  isFeatured: boolean;
  isRecurring: boolean;
  recurringPattern: RecurringPattern | null;
  interestCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Recurring Pattern
// ---------------------------------------------------------------------------

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "quarterly";

export interface RecurringPattern {
  frequency: RecurringFrequency;
  dayOfWeek: number | null;   // 0 = Sunday … 6 = Saturday
  weekOfMonth: number | null; // 1–4 for monthly
  endDate: string | null;
}

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

export interface Chapter {
  id: string;
  name: ChapterName;
  description: string | null;
  region: string;
  coverImageUrl: string | null;
  memberCount: number;
  /** Lead marshal - the one stored in chapters.marshal_id */
  marshal: Marshal | null;
  /** All marshals belonging to this chapter */
  marshals: Marshal[];
  isActive: boolean;
  isPriority: boolean; // Bagmati, Gandaki, Narayani, Lumbini = true
  totalRidesThisYear: number;
  coordinates: [number, number]; // [lng, lat] chapter HQ location
}

// ---------------------------------------------------------------------------
// Admin / User
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: "superadmin";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Homepage Content (admin-editable)
// ---------------------------------------------------------------------------

export interface HeroBannerContent {
  title: string;
  subtitle: string;
  backgroundImageUrl: string | null;
  overlayOpacity: number; // 0–1
  primaryCTALabel: string;
  primaryCTALink: string;
  secondaryCTALabel: string | null;
  secondaryCTALink: string | null;
  featuredRideId: string | null;
}

export interface BrandLogos {
  /** The single Himalayan Drift brand mark, shown in the navbar, footer and hero. */
  logoUrl: string | null;
}

export interface HomepageContent {
  heroBanner: HeroBannerContent;
  brandLogos: BrandLogos;
  marqueeRideIds: string[];      // 2 per year - shown in marquee highlight section
  featuredUpcomingRideIds: string[];
  showWeatherWidget: boolean;
  showSponsorShowcase: boolean;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Membership cards
// ---------------------------------------------------------------------------

export type MemberCardStatus = "pending" | "approved" | "rejected";

export interface MemberCard {
  id:                 string;
  accessCode:         string;
  cardNumber:         string | null;  // assigned on approval

  // Applicant details
  fullName:           string;
  photoUrl:           string;
  dateOfBirth:        string;         // ISO date string
  bloodGroup:         string;
  emergencyPhone:     string;
  licenseNumber:      string;         // stored, not shown on card
  chapter:            string;
  consentAccepted:    boolean;

  // Workflow
  status:             MemberCardStatus;
  rejectionReason:    string | null;
  adminNotes:         string | null;
  resubmissionCount:  number;

  // Timestamps
  createdAt:          string;
  updatedAt:          string;
  approvedAt:         string | null;
  validUntil:         string | null;  // ISO date
}

export interface CardSettings {
  tagline:            string;
  disclaimer:         string;
  validityYears:      number;
  showBloodGroup:     boolean;
  showDob:            boolean;
  showEmergencyPhone: boolean;
  showChapter:        boolean;
  benefits:           string[];
}

// ---------------------------------------------------------------------------
// Weather (OpenWeather API)
// ---------------------------------------------------------------------------

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface RideWeather {
  rideId: string;
  location: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidity: number;
  windSpeedKmh: number;
  conditions: WeatherCondition[];
  ridingCondition: "excellent" | "good" | "caution" | "poor";
  forecast: WeatherForecastDay[];
  fetchedAt: string;
}

export interface WeatherForecastDay {
  date: string;
  maxTempCelsius: number;
  minTempCelsius: number;
  conditions: WeatherCondition[];
  ridingCondition: "excellent" | "good" | "caution" | "poor";
}

// ---------------------------------------------------------------------------
// Calendar / UI State
// ---------------------------------------------------------------------------

export interface CalendarFilters {
  chapter: ChapterName | "all";
  rideType: RideType | "all";
  status: RideStatus | "all";
  priority: RidePriority | "all";
  dateRange: { start: string | null; end: string | null };
  searchQuery: string;
}

export type CalendarView = "year" | "month" | "list";

export interface CalendarState {
  view: CalendarView;
  currentYear: number;
  currentMonth: number; // 0–11
  filters: CalendarFilters;
  selectedRideId: string | null;
  isDragging: boolean;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

export interface APISuccess<T> {
  data: T;
  error: null;
}

export interface APIError {
  data: null;
  error: { message: string; code?: string };
}

export type APIResponse<T> = APISuccess<T> | APIError;

// ---------------------------------------------------------------------------
// Export/Report
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public user profile (authenticated members)
// ---------------------------------------------------------------------------

export type MemberRegistrationStatus = "pending" | "approved" | "rejected";

export interface UserProfile {
  id:             string;
  fullName:       string;
  email:          string;          // stored at registration
  chapter:        string | null;
  phone:          string | null;
  avatarUrl:      string | null;
  // Extended registration fields
  address:        string | null;
  bikeModel:      string | null;
  dateOfBirth:    string | null;   // ISO date "YYYY-MM-DD"
  licenseNumber:  string | null;
  // Admin approval workflow
  memberStatus:   MemberRegistrationStatus;
  adminNotes:     string | null;
  approvedAt:     string | null;
  rejectedAt:     string | null;
  createdAt:      string;
  updatedAt:      string;
}

// Backwards-compatible alias — email is now part of UserProfile
export type UserProfileWithEmail = UserProfile;

export type ExportFormat = "pdf" | "excel";

export interface ExportOptions {
  format: ExportFormat;
  year: number;
  includeChapters: ChapterName[] | "all";
  includeStatuses: RideStatus[] | "all";
  brandedExport: boolean;
}
