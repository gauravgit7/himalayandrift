// =============================================================================
// Supabase DB → TypeScript mappers
// DB columns are snake_case; TypeScript types are camelCase.
// These types mirror schema.sql exactly - update both together.
// =============================================================================

import type {
  Ride, Series, Sponsor, Marshal, HomepageContent, BrandLogos,
  MemberCard, CardSettings, UserProfile,
  RouteData, ItineraryDay, RecurringPattern,
  RideType, RideStatus, RidePriority,
  MemberRegistrationStatus,
  RideRegistration, RideRegistrationStatus, PaymentSettings,
  AnthemSettings, AnthemLyricLine, AnthemTrack,
  Product, ProductVariant, ShopSettings, ShopOrder, ShopOrderItem, ShopOrderStatus,
  MembershipTier, MembershipSettings, LoyaltyEntry, LoyaltySource,
} from "@/types";

/** Postgres `numeric` arrives over PostgREST as a string, to avoid the
 *  precision loss of a JSON float. Anything unparseable becomes null rather
 *  than NaN, which would render as "NaN" in the UI. */
function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}


// ---------------------------------------------------------------------------
// Raw DB row types (snake_case)
// ---------------------------------------------------------------------------

export interface DbMarshal {
  id:               string;
  name:             string;
  phone:            string | null;
  avatar_url:       string | null;
  role:             string;
  role_icon_url:    string | null;
  specialty:        string | null;
  bio:              string | null;
  total_rides_led:  number;
  is_active:        boolean;
  instagram_handle: string | null;
  created_at:       string;
}

export interface DbSponsor {
  id:          string;
  name:        string;
  logo_url:    string | null;
  description: string | null;
  website_url: string | null;
  tier:        "title" | "co" | "associate" | "media";
  is_active:   boolean;
  created_at:  string;
}

export interface DbSeries {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  banner_url:  string | null;
  created_at:  string;
}

export function mapSeries(row: DbSeries): Series {
  return {
    id:          row.id,
    name:        row.name,
    slug:        row.slug,
    description: row.description,
    bannerUrl:   row.banner_url,
    createdAt:   row.created_at,
  };
}

export interface DbRide {
  id:                string;
  title:             string;
  slug:              string;
  ride_type:         RideType;
  location:          string;
  start_date:        string;
  end_date:          string;
  status:            RideStatus;
  priority:          RidePriority;
  description:       string | null;
  short_description: string | null;
  banner_image_url:  string | null;
  expected_riders:   number;
  registration_link: string | null;
  registration_open:      boolean | null;
  registration_fee:       number | string | null;  // numeric arrives as a string
  registration_discount:  number | string | null;
  loyalty_points:         number | null;
  registration_capacity:  number | null;
  payment_qr_url:         string | null;
  payment_instructions:   string | null;
  route_data:        RouteData | null;
  itinerary:         ItineraryDay[] | null;
  marshal_id:        string | null;
  series_id:         string | null;
  volume:            number | null;
  tags:              string[];
  is_featured:       boolean;
  is_recurring:      boolean;
  recurring_pattern: RecurringPattern | null;
  interest_count:    number;
  created_at:        string;
  updated_at:        string;
  // FK joins
  marshals?:         DbMarshal | null;
  series?:           DbSeries | null;
  ride_sponsors?:    { sponsors: DbSponsor }[];
}

export interface DbHomepageContent {
  id:                          number;
  hero_title:                  string;
  hero_subtitle:               string;
  hero_background_image_url:   string | null;
  hero_overlay_opacity:        number;
  hero_primary_cta_label:      string;
  hero_primary_cta_link:       string;
  hero_secondary_cta_label:    string | null;
  hero_secondary_cta_link:     string | null;
  hero_featured_ride_id:       string | null;
  brand_logo_url:              string | null;
  marquee_ride_ids:            string[];
  featured_upcoming_ride_ids:  string[];
  show_weather_widget:         boolean;
  show_sponsor_showcase:       boolean;
  updated_at:                  string;
}

// ---------------------------------------------------------------------------
// Mapper functions - DB row → TypeScript domain type
// ---------------------------------------------------------------------------

export function mapMarshal(row: DbMarshal): Marshal {
  return {
    id:            row.id,
    name:          row.name,
    phone:         row.phone,
    avatarUrl:     row.avatar_url,
    role:          row.role          ?? "Ride Marshal",
    roleIconUrl:   row.role_icon_url ?? null,
    specialty:     row.specialty     ?? null,
    bio:           row.bio           ?? null,
    totalRidesLed:   row.total_rides_led ?? 0,
    isActive:        row.is_active,
    instagramHandle: row.instagram_handle ?? null,
  };
}

export function mapSponsor(row: DbSponsor): Sponsor {
  return {
    id:          row.id,
    name:        row.name,
    logoUrl:     row.logo_url,
    description: row.description,
    websiteUrl:  row.website_url,
    tier:        row.tier,
  };
}

export function mapRide(row: DbRide): Ride {
  return {
    id:               row.id,
    title:            row.title,
    slug:             row.slug,
    rideType:         row.ride_type,
    location:         row.location ?? "",
    startDate:        row.start_date,
    endDate:          row.end_date,
    status:           row.status,
    priority:         row.priority,
    description:      row.description,
    shortDescription: row.short_description,
    bannerImageUrl:   row.banner_image_url,
    expectedRiders:   row.expected_riders,
    registrationLink: row.registration_link,
    registrationOpen:     row.registration_open ?? false,
    registrationFee:      toNumber(row.registration_fee),
    registrationDiscount: toNumber(row.registration_discount),
    loyaltyPoints:        row.loyalty_points ?? 0,
    registrationCapacity: row.registration_capacity ?? null,
    paymentQrUrl:         row.payment_qr_url ?? null,
    paymentInstructions:  row.payment_instructions ?? null,
    routeData:        row.route_data,
    itinerary:        row.itinerary ?? [],
    marshal:          row.marshals ? mapMarshal(row.marshals) : null,
    series:           row.series   ? mapSeries(row.series)    : null,
    volume:           row.volume   ?? null,
    sponsors:         row.ride_sponsors?.map((rs) => mapSponsor(rs.sponsors)) ?? [],
    tags:             row.tags ?? [],
    isFeatured:       row.is_featured,
    isRecurring:      row.is_recurring,
    recurringPattern: row.recurring_pattern,
    interestCount:    row.interest_count ?? 0,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// MemberCard
// ---------------------------------------------------------------------------

export interface DbMemberCard {
  id:                  string;
  user_id:             string | null;
  access_code:         string;
  card_number:         string | null;
  full_name:           string;
  photo_url:           string;
  date_of_birth:       string;
  blood_group:         string;
  emergency_phone:     string;
  license_number:      string;
  consent_accepted:    boolean;
  status:              string;
  rejection_reason:    string | null;
  revoked_reason:      string | null;
  admin_notes:         string | null;
  resubmission_count:  number;
  created_at:          string;
  updated_at:          string;
  approved_at:         string | null;
  revoked_at:          string | null;
  valid_until:         string | null;
  linked_by:           string | null;
  linked_at:           string | null;
  link_score:          number | string | null;
}

export function mapMemberCard(row: DbMemberCard): MemberCard {
  return {
    id:                row.id,
    userId:            row.user_id ?? null,
    linkedBy:          (row.linked_by as MemberCard["linkedBy"]) ?? null,
    linkedAt:          row.linked_at ?? null,
    // numeric arrives from PostgREST as a string.
    linkScore:         row.link_score == null ? null : Number(row.link_score),
    accessCode:        row.access_code,
    cardNumber:        row.card_number        ?? null,
    fullName:          row.full_name,
    photoUrl:          row.photo_url,
    dateOfBirth:       row.date_of_birth,
    bloodGroup:        row.blood_group,
    emergencyPhone:    row.emergency_phone,
    licenseNumber:     row.license_number,
    consentAccepted:   row.consent_accepted,
    status:            row.status             as MemberCard["status"],
    rejectionReason:   row.rejection_reason   ?? null,
    revokedReason:     row.revoked_reason     ?? null,
    adminNotes:        row.admin_notes        ?? null,
    resubmissionCount: row.resubmission_count ?? 0,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
    approvedAt:        row.approved_at        ?? null,
    revokedAt:         row.revoked_at         ?? null,
    validUntil:        row.valid_until        ?? null,
  };
}

// ---------------------------------------------------------------------------
// CardSettings
// ---------------------------------------------------------------------------

export interface DbCardSettings {
  tagline:              string;
  disclaimer:           string;
  validity_years:       number;
  show_blood_group:     boolean;
  show_dob:             boolean;
  show_emergency_phone: boolean;
  benefits:             string[];
}

export function mapCardSettings(row: DbCardSettings): CardSettings {
  return {
    tagline:            row.tagline,
    disclaimer:         row.disclaimer,
    validityYears:      row.validity_years,
    showBloodGroup:     row.show_blood_group,
    showDob:            row.show_dob,
    showEmergencyPhone: row.show_emergency_phone,
    benefits:           row.benefits ?? [],
  };
}

// ---------------------------------------------------------------------------

export function mapHomepageContent(row: DbHomepageContent): HomepageContent {
  return {
    heroBanner: {
      title:              row.hero_title,
      subtitle:           row.hero_subtitle,
      backgroundImageUrl: row.hero_background_image_url,
      overlayOpacity:     Number(row.hero_overlay_opacity),
      primaryCTALabel:    row.hero_primary_cta_label,
      primaryCTALink:     row.hero_primary_cta_link,
      secondaryCTALabel:  row.hero_secondary_cta_label,
      secondaryCTALink:   row.hero_secondary_cta_link,
      featuredRideId:     row.hero_featured_ride_id,
    },
    brandLogos: {
      logoUrl: row.brand_logo_url ?? null,
    } satisfies BrandLogos,
    marqueeRideIds:          row.marquee_ride_ids         ?? [],
    featuredUpcomingRideIds: row.featured_upcoming_ride_ids ?? [],
    showWeatherWidget:       row.show_weather_widget,
    showSponsorShowcase:     row.show_sponsor_showcase,
    updatedAt:               row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// UserProfile
// ---------------------------------------------------------------------------

export interface DbProfile {
  id:              string;
  full_name:       string;
  email:           string | null;
  phone:           string | null;
  avatar_url:      string | null;
  address:         string | null;
  bike_model:      string | null;
  date_of_birth:   string | null;
  license_number:  string | null;
  blood_group:     string | null;
  emergency_name:  string | null;
  emergency_phone: string | null;
  is_admin:        boolean | null;
  tier_id:         string | null;
  member_status:   string;
  admin_notes:     string | null;
  approved_at:     string | null;
  rejected_at:     string | null;
  created_at:      string;
  updated_at:      string;
}

export function mapProfile(row: DbProfile): UserProfile {
  return {
    id:            row.id,
    fullName:      row.full_name,
    email:         row.email        ?? "",
    phone:         row.phone        ?? null,
    avatarUrl:     row.avatar_url   ?? null,
    address:       row.address      ?? null,
    bikeModel:     row.bike_model   ?? null,
    dateOfBirth:   row.date_of_birth ?? null,
    licenseNumber: row.license_number ?? null,
    bloodGroup:     row.blood_group     ?? null,
    emergencyName:  row.emergency_name  ?? null,
    emergencyPhone: row.emergency_phone ?? null,
    isAdmin:        row.is_admin ?? false,
    tierId:         row.tier_id ?? null,
    memberStatus:  (row.member_status as MemberRegistrationStatus) ?? "pending",
    adminNotes:    row.admin_notes  ?? null,
    approvedAt:    row.approved_at  ?? null,
    rejectedAt:    row.rejected_at  ?? null,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Ride registration
// ---------------------------------------------------------------------------

export interface DbRideRegistration {
  id:                      string;
  ride_id:                 string;
  user_id:                 string | null;
  access_code:             string;
  full_name:               string;
  phone:                   string;
  email:                   string | null;
  emergency_name:          string | null;
  emergency_phone:         string | null;
  bike_model:              string | null;
  pillion_count:           number;
  notes:                   string | null;
  amount_paid:             number | string | null;
  payment_reference:       string | null;
  payment_screenshot_url:  string | null;
  status:                  string;
  rejection_reason:        string | null;
  admin_notes:             string | null;
  created_at:              string;
  updated_at:              string;
  approved_at:             string | null;
  rejected_at:             string | null;
  tier_label:              string | null;
  // FK join
  rides?:                  DbRide | null;
}

export function mapRideRegistration(row: DbRideRegistration): RideRegistration {
  return {
    id:                   row.id,
    rideId:               row.ride_id,
    userId:               row.user_id ?? null,
    accessCode:           row.access_code,
    fullName:             row.full_name,
    phone:                row.phone,
    email:                row.email ?? null,
    emergencyName:        row.emergency_name ?? null,
    emergencyPhone:       row.emergency_phone ?? null,
    bikeModel:            row.bike_model ?? null,
    pillionCount:         row.pillion_count ?? 0,
    notes:                row.notes ?? null,
    amountPaid:           toNumber(row.amount_paid),
    paymentReference:     row.payment_reference ?? null,
    paymentScreenshotUrl: row.payment_screenshot_url ?? null,
    status:               (row.status as RideRegistrationStatus) ?? "pending",
    rejectionReason:      row.rejection_reason ?? null,
    adminNotes:           row.admin_notes ?? null,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
    approvedAt:           row.approved_at ?? null,
    rejectedAt:           row.rejected_at ?? null,
    tierLabel:            row.tier_label ?? null,
  };
}

// ---------------------------------------------------------------------------
// Payment settings
// ---------------------------------------------------------------------------

export interface DbPaymentSettings {
  id:                   number;
  qr_url:               string | null;
  payment_instructions: string;
  currency_label:       string;
  updated_at:           string;
}

export function mapPaymentSettings(row: DbPaymentSettings): PaymentSettings {
  return {
    qrUrl:               row.qr_url ?? null,
    paymentInstructions: row.payment_instructions ?? "",
    currencyLabel:       row.currency_label || "NPR",
  };
}

// ---------------------------------------------------------------------------
// Anthem
// ---------------------------------------------------------------------------

export interface DbAnthemSettings {
  id:         number;
  title:      string;
  audio_url:  string | null;
  credits:    string | null;
  lyrics:     unknown;
  is_enabled: boolean;
  updated_at: string;
}

/** Lyrics come out of jsonb, so they are whatever was last written - possibly
 *  from an older shape. Anything unrecognisable is dropped rather than allowed
 *  to reach the player, where a missing `text` would render "undefined". */
function parseLyrics(raw: unknown): AnthemLyricLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: AnthemLyricLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row  = item as { t?: unknown; text?: unknown };
    const text = typeof row.text === "string" ? row.text : null;
    if (text === null) continue;
    const t = typeof row.t === "number" && Number.isFinite(row.t) ? row.t : null;
    lines.push({ time: t, text });
  }
  return lines;
}

export function mapAnthemSettings(row: DbAnthemSettings): AnthemSettings {
  return {
    title:     row.title || "Our Anthem",
    audioUrl:  row.audio_url ?? null,
    credits:   row.credits   ?? null,
    lyrics:    parseLyrics(row.lyrics),
    isEnabled: row.is_enabled ?? false,
  };
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

export interface DbProductVariant {
  id:          string;
  product_id:  string;
  label:       string;
  price_delta: number | string;
  stock:       number;
  sort_order:  number;
  is_active:   boolean;
}

export function mapProductVariant(row: DbProductVariant): ProductVariant {
  return {
    id:         row.id,
    productId:  row.product_id,
    label:      row.label,
    priceDelta: toNumber(row.price_delta) ?? 0,
    stock:      row.stock ?? 0,
    sortOrder:  row.sort_order ?? 0,
    isActive:   row.is_active ?? true,
  };
}

export interface DbProduct {
  id:                string;
  name:              string;
  slug:              string;
  short_description: string | null;
  description:       string | null;
  category:          string;
  price:             number | string;
  discount_percent:  number;
  image_urls:        string[] | null;
  stock:             number | null;
  loyalty_points:    number | null;
  is_active:         boolean;
  is_featured:       boolean;
  sort_order:        number;
  product_variants?: DbProductVariant[] | null;
}

export function mapProduct(row: DbProduct): Product {
  return {
    id:               row.id,
    name:             row.name,
    slug:             row.slug,
    shortDescription: row.short_description ?? null,
    description:      row.description       ?? null,
    category:         row.category || "Merch",
    price:            toNumber(row.price) ?? 0,
    discountPercent:  row.discount_percent ?? 0,
    imageUrls:        row.image_urls ?? [],
    stock:            row.stock ?? null,
    loyaltyPoints:    row.loyalty_points ?? 0,
    isActive:         row.is_active   ?? true,
    isFeatured:       row.is_featured ?? false,
    sortOrder:        row.sort_order  ?? 0,
    variants: (row.product_variants ?? [])
      .map(mapProductVariant)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export interface DbShopSettings {
  is_enabled:    boolean;
  announcement:  string;
  delivery_note: string;
}

export function mapShopSettings(row: DbShopSettings): ShopSettings {
  return {
    isEnabled:    row.is_enabled ?? false,
    announcement: row.announcement  ?? "",
    deliveryNote: row.delivery_note ?? "",
  };
}

export interface DbShopOrderItem {
  id:            string;
  product_id:    string | null;
  variant_id:    string | null;
  product_name:  string;
  variant_label: string | null;
  unit_price:    number | string;
  quantity:      number;
  line_total:    number | string;
}

export function mapShopOrderItem(row: DbShopOrderItem): ShopOrderItem {
  return {
    id:           row.id,
    productId:    row.product_id   ?? null,
    variantId:    row.variant_id   ?? null,
    productName:  row.product_name,
    variantLabel: row.variant_label ?? null,
    unitPrice:    toNumber(row.unit_price) ?? 0,
    quantity:     row.quantity ?? 1,
    lineTotal:    toNumber(row.line_total) ?? 0,
  };
}

export interface DbShopOrder {
  id:                     string;
  user_id:                string | null;
  access_code:            string;
  full_name:              string;
  phone:                  string;
  email:                  string | null;
  delivery_address:       string | null;
  notes:                  string | null;
  subtotal:               number | string;
  discount_total:         number | string;
  total:                  number | string;
  payment_reference:      string | null;
  payment_screenshot_url: string | null;
  status:                 string;
  rejection_reason:       string | null;
  admin_notes:            string | null;
  created_at:             string;
  approved_at:            string | null;
  fulfilled_at:           string | null;
  shop_order_items?:      DbShopOrderItem[] | null;
}

export function mapShopOrder(row: DbShopOrder): ShopOrder {
  return {
    id:              row.id,
    userId:          row.user_id ?? null,
    accessCode:      row.access_code,
    fullName:        row.full_name,
    phone:           row.phone,
    email:           row.email ?? null,
    deliveryAddress: row.delivery_address ?? null,
    notes:           row.notes ?? null,
    subtotal:        toNumber(row.subtotal)       ?? 0,
    discountTotal:   toNumber(row.discount_total) ?? 0,
    total:           toNumber(row.total)          ?? 0,
    paymentReference:     row.payment_reference      ?? null,
    paymentScreenshotUrl: row.payment_screenshot_url ?? null,
    status:          (row.status as ShopOrderStatus) ?? "pending",
    rejectionReason: row.rejection_reason ?? null,
    adminNotes:      row.admin_notes ?? null,
    createdAt:       row.created_at,
    approvedAt:      row.approved_at  ?? null,
    fulfilledAt:     row.fulfilled_at ?? null,
    items: (row.shop_order_items ?? []).map(mapShopOrderItem),
  };
}

export interface DbAnthemTrack {
  id:         string;
  title:      string;
  audio_url:  string;
  credits:    string | null;
  lyrics:     unknown;
  cover_url:  string | null;
  is_anthem:  boolean;
  is_active:  boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function mapAnthemTrack(row: DbAnthemTrack): AnthemTrack {
  return {
    id:        row.id,
    title:     row.title || "Untitled",
    audioUrl:  row.audio_url,
    credits:   row.credits   ?? null,
    lyrics:    parseLyrics(row.lyrics),
    coverUrl:  row.cover_url ?? null,
    isAnthem:  row.is_anthem ?? false,
    isActive:  row.is_active ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}


// ---------------------------------------------------------------------------
// Membership programme
// ---------------------------------------------------------------------------

export interface DbMembershipTier {
  id:               string;
  name:             string;
  slug:             string;
  description:      string | null;
  discount_percent: number;
  reward_factor:    number | string;
  colour:           string | null;
  is_default:       boolean;
  is_active:        boolean;
  sort_order:       number;
}

export function mapMembershipTier(row: DbMembershipTier): MembershipTier {
  return {
    id:              row.id,
    name:            row.name,
    slug:            row.slug,
    description:     row.description ?? null,
    discountPercent: row.discount_percent ?? 0,
    rewardFactor:    toNumber(row.reward_factor) ?? 1,
    colour:          row.colour ?? null,
    isDefault:       row.is_default ?? false,
    isActive:        row.is_active  ?? true,
    sortOrder:       row.sort_order ?? 0,
  };
}

export interface DbMembershipSettings {
  tiers_enabled:   boolean;
  loyalty_enabled: boolean;
  points_label:    string;
}

export function mapMembershipSettings(row: DbMembershipSettings): MembershipSettings {
  return {
    tiersEnabled:   row.tiers_enabled   ?? false,
    loyaltyEnabled: row.loyalty_enabled ?? false,
    pointsLabel:    row.points_label || "points",
  };
}

export interface DbLoyaltyEntry {
  id:          string;
  points:      number;
  base_points: number;
  factor:      number | string;
  reason:      string;
  source_type: string;
  source_id:   string | null;
  created_at:  string;
}

export function mapLoyaltyEntry(row: DbLoyaltyEntry): LoyaltyEntry {
  return {
    id:         row.id,
    points:     row.points,
    basePoints: row.base_points ?? 0,
    factor:     toNumber(row.factor) ?? 1,
    reason:     row.reason,
    sourceType: (row.source_type as LoyaltySource) ?? "manual",
    sourceId:   row.source_id ?? null,
    createdAt:  row.created_at,
  };
}
