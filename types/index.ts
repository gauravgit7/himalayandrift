// =============================================================================
// Himalayan Drift - Central Type Definitions
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
  /** Tier role: "Head Marshal" | "Senior Marshal" | "Ride Marshal" | custom */
  role: string;
  /** Optional badge art for the role. Falls back to the role text when null. */
  roleIconUrl: string | null;
  /** Comma-separated specialty tags, e.g. "Navigation, Route Planning, High Altitude" */
  specialty: string | null;
  bio: string | null;
  totalRidesLed: number;
  isActive: boolean;
  /** Instagram handle without @, e.g. "himalayan_rider". Null if not provided. */
  instagramHandle: string | null;
}

// ---------------------------------------------------------------------------
// Ride series
// ---------------------------------------------------------------------------

/**
 * A named series that releases in volumes, e.g. "Drift in the Mist — Vol III".
 *
 * Deliberately a separate axis from RideType: one volume might be an overnight
 * and the next a multi-day. Adding a second series is data, not code.
 */
export interface Series {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  bannerUrl:   string | null;
  createdAt:   string;
}

// ---------------------------------------------------------------------------
// Core Ride Object
// ---------------------------------------------------------------------------

export interface Ride {
  id: string;
  title: string;
  slug: string;
  rideType: RideType;
  /** Free-text start/meeting location, e.g. "Kathmandu" or "Pokhara". */
  location: string;
  startDate: string;        // ISO date string "YYYY-MM-DD"
  endDate: string;          // ISO date string "YYYY-MM-DD"
  status: RideStatus;
  priority: RidePriority;
  description: string | null;
  shortDescription: string | null;
  bannerImageUrl: string | null;
  expectedRiders: number;
  /** External sign-up form. Ignored while `registrationOpen` is true. */
  registrationLink: string | null;

  /** Built-in registration: off until the organiser opens sign-ups. */
  registrationOpen: boolean;
  /** The list fee. Null or 0 means a free ride — the form skips payment. */
  registrationFee: number | null;
  /** A flat amount off the list fee, for everyone. Null for no discount. */
  registrationDiscount: number | null;
  /** Base points a rider earns for an approved registration, before their
   *  tier multiplier. 0 means this ride awards nothing. */
  loyaltyPoints: number;
  /** Null means unlimited. Counts pending + approved. */
  registrationCapacity: number | null;
  /** Per-ride overrides for the club-wide payment details. */
  paymentQrUrl: string | null;
  paymentInstructions: string | null;

  routeData: RouteData | null;
  itinerary: ItineraryDay[];
  marshal: Marshal | null;
  /** The series this ride is a volume of, if any. */
  series: Series | null;
  /** Volume number within `series`. Null unless the ride belongs to a series. */
  volume: number | null;
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

/** `rejected` means the application was turned down and no card ever existed.
 *  `revoked` means one was issued and later withdrawn — a different fact, and
 *  one that stays true about a card already sitting in somebody's wallet. */
export type MemberCardStatus = "pending" | "approved" | "rejected" | "revoked";

export interface MemberCard {
  id:                 string;
  /** Set when a signed-in rider requested it, so it can show on their profile. */
  userId:             string | null;
  /** How it came to belong to that account: asked for while signed in, matched
   *  automatically to a walk-in application, or linked by an admin. */
  linkedBy:           "self" | "auto" | "admin" | null;
  linkedAt:           string | null;
  /** 0-1 match confidence, for the automatic and admin links. */
  linkScore:          number | null;
  accessCode:         string;
  cardNumber:         string | null;  // assigned on approval

  // Applicant details
  fullName:           string;
  photoUrl:           string;
  dateOfBirth:        string;         // ISO date string
  bloodGroup:         string;
  emergencyPhone:     string;
  licenseNumber:      string;         // stored, not shown on card
  consentAccepted:    boolean;

  // Workflow
  status:             MemberCardStatus;
  rejectionReason:    string | null;
  revokedReason:      string | null;
  adminNotes:         string | null;
  resubmissionCount:  number;

  // Timestamps
  createdAt:          string;
  updatedAt:          string;
  approvedAt:         string | null;
  revokedAt:          string | null;
  validUntil:         string | null;  // ISO date
}

// ---------------------------------------------------------------------------
// Ride registration
// ---------------------------------------------------------------------------

export type RideRegistrationStatus = "pending" | "approved" | "rejected";

export interface RideRegistration {
  id:              string;
  rideId:          string;
  /** Set when a signed-in rider registered. Guests register with this null. */
  userId:          string | null;
  /** Issued at submission; the only way a guest can look their status up. */
  accessCode:      string;

  fullName:        string;
  phone:           string;
  email:           string | null;
  emergencyName:   string | null;
  emergencyPhone:  string | null;
  bikeModel:       string | null;
  /** People riding pillion with them. Head count, not a fee multiplier. */
  pillionCount:    number;
  notes:           string | null;

  // Payment — all null on a free ride.
  amountPaid:            number | null;
  paymentReference:      string | null;
  paymentScreenshotUrl:  string | null;

  status:          RideRegistrationStatus;
  rejectionReason: string | null;
  adminNotes:      string | null;

  createdAt:       string;
  updatedAt:       string;
  approvedAt:      string | null;
  rejectedAt:      string | null;
  /** The membership tier the rider was on when they registered, copied so the
   *  roster still reads correctly after they are promoted. */
  tierLabel:       string | null;
}

/** A registration with the ride it belongs to, for the admin list. */
export interface RideRegistrationWithRide extends RideRegistration {
  ride: Pick<
    Ride,
    "id" | "title" | "slug" | "startDate" | "endDate" | "registrationFee" | "routeData"
  > | null;
}

// ---------------------------------------------------------------------------
// Anthem
// ---------------------------------------------------------------------------

/** One line of the anthem. `time` is the second it starts at, or null when it
 *  has not been synced yet — untimed lines still render, just without
 *  highlighting, so lyrics are useful before anyone sits down to sync them. */
export interface AnthemLyricLine {
  time: number | null;
  text: string;
}

export interface AnthemSettings {
  title:     string;
  audioUrl:  string | null;
  credits:   string | null;
  lyrics:    AnthemLyricLine[];
  isEnabled: boolean;
}

/** One song in the club's library. The anthem is the track flagged `isAnthem`;
 *  it sorts first and is what the player starts on. Everything else follows it
 *  in `sortOrder`, which is what prev/next walks. */
export interface AnthemTrack {
  id:        string;
  title:     string;
  audioUrl:  string;
  credits:   string | null;
  lyrics:    AnthemLyricLine[];
  coverUrl:  string | null;
  isAnthem:  boolean;
  isActive:  boolean;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

/** One size (or colour, or whatever the club is selling this year). Stock lives
 *  here rather than on the product, because "12 in stock" across S to XL is not
 *  a fact anyone can act on. */
export interface ProductVariant {
  id:         string;
  productId:  string;
  label:      string;
  /** Added to the product price — a 3XL costing a little more is normal. */
  priceDelta: number;
  stock:      number;
  sortOrder:  number;
  isActive:   boolean;
}

export interface Product {
  id:               string;
  name:             string;
  slug:             string;
  shortDescription: string | null;
  description:      string | null;
  category:         string;
  /** List price, before discount. */
  price:            number;
  discountPercent:  number;
  imageUrls:        string[];
  /** Stock for a product with no variants. Null means it is not tracked. */
  stock:            number | null;
  /** Points a buyer earns per item, before their tier multiplier. */
  loyaltyPoints:    number;
  isActive:         boolean;
  isFeatured:       boolean;
  sortOrder:        number;
  variants:         ProductVariant[];
}

export interface ShopSettings {
  isEnabled:    boolean;
  announcement: string;
  deliveryNote: string;
}

export type ShopOrderStatus = "pending" | "approved" | "fulfilled" | "rejected";

/** A line of an order. The product name and price are copied at submission, so
 *  the order still reads correctly after the product is repriced or deleted. */
export interface ShopOrderItem {
  id:           string;
  productId:    string | null;
  variantId:    string | null;
  productName:  string;
  variantLabel: string | null;
  unitPrice:    number;
  quantity:     number;
  lineTotal:    number;
}

export interface ShopOrder {
  id:              string;
  userId:          string | null;
  accessCode:      string;
  fullName:        string;
  phone:           string;
  email:           string | null;
  deliveryAddress: string | null;
  notes:           string | null;
  subtotal:        number;
  discountTotal:   number;
  total:           number;
  paymentReference:     string | null;
  paymentScreenshotUrl: string | null;
  status:          ShopOrderStatus;
  rejectionReason: string | null;
  adminNotes:      string | null;
  createdAt:       string;
  approvedAt:      string | null;
  fulfilledAt:     string | null;
  items:           ShopOrderItem[];
}

/** One line of the basket as the browser holds it. Deliberately just ids and a
 *  quantity: prices are re-read from the database at checkout, so a basket that
 *  has sat in localStorage for a week cannot lock in last week's price. */
export interface CartLine {
  productId: string;
  variantId: string | null;
  quantity:  number;
}

// ---------------------------------------------------------------------------
// Membership programme
// ---------------------------------------------------------------------------

/**
 * A tier is ASSIGNED by the committee, never computed. There is deliberately no
 * engine that promotes people — who counts as a veteran is a judgement about a
 * person, and pretending a rule can make it turns a compliment into a formula.
 */
export interface MembershipTier {
  id:              string;
  name:            string;
  slug:            string;
  description:     string | null;
  /** Off ride registration. A percentage, so a ride carries one price. */
  discountPercent: number;
  /** Multiplier on points earned. 1–2 is the useful range; 5 compounds. */
  rewardFactor:    number;
  /** Hex for the badge. Falls back to the ember accent. */
  colour:          string | null;
  isDefault:       boolean;
  isActive:        boolean;
  sortOrder:       number;
}

export interface MembershipSettings {
  /** Off means one price for everybody and no badge anywhere. */
  tiersEnabled:   boolean;
  /** Off means nothing is awarded and no balance is shown. */
  loyaltyEnabled: boolean;
  pointsLabel:    string;
}

export type LoyaltySource = "ride" | "order" | "manual" | "voucher";

/** One line of the ledger. Signed: positive earns, negative spends. A balance
 *  is the sum of these and is never stored anywhere. */
export interface LoyaltyEntry {
  id:         string;
  points:     number;
  /** What the ride or product was worth before the tier multiplier. */
  basePoints: number;
  /** The multiplier as it stood when this was earned. Never recomputed. */
  factor:     number;
  reason:     string;
  sourceType: LoyaltySource;
  sourceId:   string | null;
  createdAt:  string;
}

// ---------------------------------------------------------------------------
// Ride pricing
// ---------------------------------------------------------------------------

/** Club-wide payment details, overridable per ride. */
export interface PaymentSettings {
  qrUrl:               string | null;
  paymentInstructions: string;
  currencyLabel:       string;
}

/** What the registration form actually shows for one ride, after the
 *  per-ride override has been resolved against the club default. */
export interface ResolvedPaymentDetails {
  qrUrl:               string | null;
  paymentInstructions: string;
  currencyLabel:       string;
  /** What a rider with no claimed class pays: the list fee less any discount. */
  fee:                 number | null;
  /** The list fee before the club discount, when there is one. */
  listFee:             number | null;
  isPaid:              boolean;
  /** The tier this rider is on, if tiers are on and they have one. */
  tier:                MembershipTier | null;
  /** What they paid before their tier was applied, when it moved the number. */
  beforeTier:          number | null;
  loyaltyPoints:       number;
  pointsLabel:         string;
}

/** A profile field the membership card needs. Reported back by
 *  requestMemberCard so the UI can say what is missing rather than just
 *  disabling a button. */
export type CardRequirement =
  | "photo" | "fullName" | "dateOfBirth" | "bloodGroup"
  | "emergencyPhone" | "licenseNumber";

export interface CardSettings {
  tagline:            string;
  disclaimer:         string;
  validityYears:      number;
  showBloodGroup:     boolean;
  showDob:            boolean;
  showEmergencyPhone: boolean;
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
  rideType: RideType | "all";
  /** Series id, or "all". */
  series: string | "all";
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
  phone:          string | null;
  avatarUrl:      string | null;
  // Extended registration fields
  address:        string | null;
  bikeModel:      string | null;
  dateOfBirth:    string | null;   // ISO date "YYYY-MM-DD"
  licenseNumber:  string | null;
  // Captured at sign-up so a membership card can be issued without asking
  // for anything twice.
  bloodGroup:     string | null;
  emergencyName:  string | null;
  emergencyPhone: string | null;
  /** Committee member. Drives every RLS write policy. */
  isAdmin:        boolean;
  /** Assigned by the committee. Null falls back to the default tier at read
   *  time, so a deleted tier never leaves a member in limbo. */
  tierId:         string | null;
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
  includeStatuses: RideStatus[] | "all";
  brandedExport: boolean;
}
