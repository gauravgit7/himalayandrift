// =============================================================================
// Supabase DB → TypeScript mappers
// DB columns are snake_case; TypeScript types are camelCase.
// These types mirror schema.sql exactly - update both together.
// =============================================================================

import type {
  Ride, Sponsor, Marshal, HomepageContent, BrandLogos,
  MemberCard, CardSettings, UserProfile,
  RouteData, ItineraryDay, RecurringPattern,
  RideType, RideStatus, RidePriority,
  MemberRegistrationStatus,
} from "@/types";

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
  route_data:        RouteData | null;
  itinerary:         ItineraryDay[] | null;
  marshal_id:        string | null;
  tags:              string[];
  is_featured:       boolean;
  is_recurring:      boolean;
  recurring_pattern: RecurringPattern | null;
  interest_count:    number;
  created_at:        string;
  updated_at:        string;
  // FK joins
  marshals?:         DbMarshal | null;
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
    routeData:        row.route_data,
    itinerary:        row.itinerary ?? [],
    marshal:          row.marshals ? mapMarshal(row.marshals) : null,
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
  admin_notes:         string | null;
  resubmission_count:  number;
  created_at:          string;
  updated_at:          string;
  approved_at:         string | null;
  valid_until:         string | null;
}

export function mapMemberCard(row: DbMemberCard): MemberCard {
  return {
    id:                row.id,
    accessCode:        row.access_code,
    cardNumber:        row.card_number        ?? null,
    fullName:          row.full_name,
    photoUrl:          row.photo_url,
    dateOfBirth:       row.date_of_birth,
    bloodGroup:        row.blood_group,
    emergencyPhone:    row.emergency_phone,
    licenseNumber:     row.license_number,
    consentAccepted:   row.consent_accepted,
    status:            row.status             as "pending" | "approved" | "rejected",
    rejectionReason:   row.rejection_reason   ?? null,
    adminNotes:        row.admin_notes        ?? null,
    resubmissionCount: row.resubmission_count ?? 0,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
    approvedAt:        row.approved_at        ?? null,
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
    memberStatus:  (row.member_status as MemberRegistrationStatus) ?? "pending",
    adminNotes:    row.admin_notes  ?? null,
    approvedAt:    row.approved_at  ?? null,
    rejectedAt:    row.rejected_at  ?? null,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}
