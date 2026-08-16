// =============================================================================
// Supabase Read Query Functions - server-side only
// Import in Server Components / Route Handlers / Server Actions.
// All functions return empty arrays / null / defaults on error so pages
// never crash; they simply show empty states until the DB is seeded.
// =============================================================================

import { cache }               from "react";
import { createClient }        from "@/lib/supabase/server";
import {
  mapRide, mapSeries, mapSponsor, mapMarshal, mapHomepageContent,
  mapMemberCard, mapCardSettings, mapProfile,
  mapRideRegistration, mapPaymentSettings, mapAnthemSettings,
  type DbRide, type DbSeries, type DbSponsor, type DbMarshal,
  type DbHomepageContent, type DbMemberCard, type DbCardSettings,
  type DbProfile, type DbRideRegistration, type DbPaymentSettings, type DbAnthemSettings,
} from "@/lib/supabase/mappers";
import type {
  Ride, Series, Sponsor, Marshal, HomepageContent, BrandLogos,
  MemberCard, CardSettings,
  RideRegistration, RideRegistrationWithRide, PaymentSettings, AnthemSettings,
} from "@/types";

// ---------------------------------------------------------------------------
// Shared select fragments (PostgREST syntax)
// ---------------------------------------------------------------------------

const RIDE_SELECT =
  "*, marshals(*), series(*), ride_sponsors(sponsors(*))" as const;


// ---------------------------------------------------------------------------
// Rides
// ---------------------------------------------------------------------------

/** All rides, ordered by start_date ASC */
export async function getRides(): Promise<Ride[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("[queries] getRides:", error.message);
    return [];
  }
  return (data as DbRide[]).map(mapRide);
}

/** Single ride by UUID or slug */
export async function getRide(idOrSlug: string): Promise<Ride | null> {
  const supabase = await createClient();

  // UUID pattern check
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(idOrSlug);

  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .eq(isUUID ? "id" : "slug", idOrSlug)
    .maybeSingle();

  if (error) {
    console.error("[queries] getRide:", error.message);
    return null;
  }
  return data ? mapRide(data as DbRide) : null;
}

/** All rides whose start_date falls within a given year */
export async function getRidesForYear(year: number): Promise<Ride[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("[queries] getRidesForYear:", error.message);
    return [];
  }
  return (data as DbRide[]).map(mapRide);
}

/** Rides with is_featured = true */
export async function getFeaturedRides(): Promise<Ride[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .eq("is_featured", true)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("[queries] getFeaturedRides:", error.message);
    return [];
  }
  return (data as DbRide[]).map(mapRide);
}

/** Look up multiple rides by ID array (preserves order) */
export async function getRidesByIds(ids: string[]): Promise<Ride[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .in("id", ids);

  if (error) {
    console.error("[queries] getRidesByIds:", error.message);
    return [];
  }
  const rowById = new Map((data as DbRide[]).map((r) => [r.id, mapRide(r)]));
  return ids.map((id) => rowById.get(id)).filter((r): r is Ride => !!r);
}

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

/** All series, newest first. */
export async function getSeries(): Promise<Series[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("series")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[queries] getSeries:", error.message);
    return [];
  }
  return (data as DbSeries[]).map(mapSeries);
}

/** Single series by slug. */
export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("series")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[queries] getSeriesBySlug:", error.message);
    return null;
  }
  return data ? mapSeries(data as DbSeries) : null;
}

/**
 * Every volume of one series, in chronological order.
 * Volume number first so the reading order matches how the series is numbered,
 * with the date as a tiebreaker for rides that have no volume set yet.
 */
export async function getRidesBySeries(seriesId: string): Promise<Ride[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .eq("series_id", seriesId)
    .order("volume",     { ascending: true, nullsFirst: false })
    .order("start_date", { ascending: true });

  if (error) {
    console.error("[queries] getRidesBySeries:", error.message);
    return [];
  }
  return (data as DbRide[]).map(mapRide);
}

/** Ride counts per series id, for the series index. */
export async function getSeriesRideCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rides")
    .select("series_id")
    .not("series_id", "is", null);

  if (error) {
    console.error("[queries] getSeriesRideCounts:", error.message);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { series_id: string }[]) {
    counts[row.series_id] = (counts[row.series_id] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------

/** All active sponsors */
export async function getSponsors(): Promise<Sponsor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("is_active", true)
    .order("tier", { ascending: true });

  if (error) {
    console.error("[queries] getSponsors:", error.message);
    return [];
  }
  return (data as DbSponsor[]).map(mapSponsor);
}

// ---------------------------------------------------------------------------
// Marshals
// ---------------------------------------------------------------------------

/** All active marshals (public page), ordered by name */
export async function getMarshals(): Promise<Marshal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marshals")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[queries] getMarshals:", error.message);
    return [];
  }
  return (data as DbMarshal[]).map(mapMarshal);
}

/** All marshals including inactive — for the admin marshals page */
export async function getAllMarshals(): Promise<Marshal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marshals")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[queries] getAllMarshals:", error.message);
    return [];
  }
  return (data as DbMarshal[]).map(mapMarshal);
}

// ---------------------------------------------------------------------------
// Homepage Content (singleton row id=1)
// ---------------------------------------------------------------------------

/** Homepage content row. Falls back to sensible defaults if DB not yet seeded.
 *  Wrapped in React cache() to deduplicate DB calls within the same request
 *  (e.g. public layout + home page both calling this function).
 */
export const getHomepageContent = cache(async (): Promise<HomepageContent> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homepage_content")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[queries] getHomepageContent:", error.message);
    return {
      heroBanner: {
        title:              "Grit. Brotherhood. Adventure.",
        subtitle:           "Riding the raw side of Nepal, together.",
        backgroundImageUrl: null,
        overlayOpacity:     0.6,
        primaryCTALabel:    "View Calendar",
        primaryCTALink:     "/calendar",
        secondaryCTALabel:  null,
        secondaryCTALink:   null,
        featuredRideId:     null,
      },
      brandLogos: {
        logoUrl: null,
      },
      marqueeRideIds:          [],
      featuredUpcomingRideIds: [],
      showWeatherWidget:        true,
      showSponsorShowcase:      true,
      updatedAt:                new Date().toISOString(),
    };
  }
  return mapHomepageContent(data as DbHomepageContent);
});

// ---------------------------------------------------------------------------
// getBrandLogos — lightweight query for pages that don't load full homepage
// content but still need logo URLs (ride detail, admin pages, etc.)
// Shares the React cache with getHomepageContent so a page that calls both
// only hits Supabase once.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Member cards (public — anon key, filtered reads)
// ---------------------------------------------------------------------------

/** Fetch a card by its private access code (status check by applicant). */
export async function getMemberCardByAccessCode(
  accessCode: string,
): Promise<MemberCard | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("member_cards")
    .select("*")
    .eq("access_code", accessCode)
    .maybeSingle();
  return data ? mapMemberCard(data as DbMemberCard) : null;
}

/** Fetch an APPROVED card by its public card number (QR validation page). */
export async function getMemberCardByCardNumber(
  cardNumber: string,
): Promise<MemberCard | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_cards")
    .select("*")
    .eq("card_number", cardNumber)
    .eq("status", "approved")
    .maybeSingle();
  return data ? mapMemberCard(data as DbMemberCard) : null;
}

/** Admin: fetch all cards with optional status filter. Uses service role. */
export async function getMemberCards(
  status?: "pending" | "approved" | "rejected",
): Promise<MemberCard[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  let query = supabase
    .from("member_cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) { console.error("[getMemberCards]", error.message); return []; }
  return (data ?? []).map((r) => mapMemberCard(r as DbMemberCard));
}

/** Fetch the admin-configurable card settings (public). */
export const getCardSettings = cache(async (): Promise<CardSettings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("card_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!data) {
    return {
      tagline:            "GRIT · BROTHERHOOD · ADVENTURE",
      disclaimer:         "If found, please return to the original owner or contact Himalayan Drift.",
      validityYears:      2,
      showBloodGroup:     true,
      showDob:            true,
      showEmergencyPhone: true,
      benefits:           [],
    };
  }
  return mapCardSettings(data as DbCardSettings);
});

// ---------------------------------------------------------------------------

/** Fetch the signed-in public user's profile (returns null if not signed in). */
export async function getProfile(): Promise<import("@/types").UserProfileWithEmail | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // No profile row yet (migration not run, or user pre-dates the table)
  // Return a minimal default so the profile page renders instead of 404ing.
  if (!data) {
    const now = new Date().toISOString();
    return {
      id:            user.id,
      fullName:      (user.user_metadata?.full_name as string | undefined) ?? "",
      email:         user.email ?? "",
      phone:         null,
      avatarUrl:     null,
      address:       null,
      bikeModel:     null,
      dateOfBirth:   null,
      licenseNumber: null,
      bloodGroup:     null,
      emergencyName:  null,
      emergencyPhone: null,
      isAdmin:        false,
      memberStatus:  "pending",
      adminNotes:    null,
      approvedAt:    null,
      rejectedAt:    null,
      createdAt:     user.created_at ?? now,
      updatedAt:     now,
    };
  }
  // Override email from auth.users (authoritative source)
  return { ...mapProfile(data as DbProfile), email: user.email ?? "" };
}

/** Lightweight version — only what the Navbar needs (name, avatar, admin flag).
 *  Falls back to auth metadata when no profile row exists yet (migration not run). */
export async function getNavbarUser(): Promise<{
  fullName:  string;
  avatarUrl: string | null;
  isAdmin:   boolean;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // Require ADMIN_EMAILS to be explicitly set and matching — if not set, no one
  // is treated as admin on the public site (avoids showing Admin Panel link to riders).
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  const isAdmin = !!adminEmailsEnv &&
    adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
      .includes((user.email ?? "").toLowerCase());

  return {
    fullName:  data?.full_name  ?? (user.user_metadata?.full_name as string | undefined) ?? "",
    avatarUrl: data?.avatar_url ?? null,
    isAdmin,
  };
}

/** Admin: fetch all registered member profiles. Uses service role to bypass RLS. */
export async function getAllProfiles(): Promise<import("@/types").UserProfile[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllProfiles]", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapProfile(r as DbProfile));
}

export const getBrandLogos = cache(async (): Promise<BrandLogos> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("homepage_content")
    .select("brand_logo_url")
    .maybeSingle();
  return {
    logoUrl: data?.brand_logo_url ?? null,
  };
});

// ---------------------------------------------------------------------------
// Ride registrations
//
// ride_registrations has no public SELECT policy on purpose - a roster is a
// list of phone numbers and emergency contacts. Every read below therefore
// goes through the service role, and each one is responsible for scoping
// itself to what the caller is allowed to see.
// ---------------------------------------------------------------------------

/** Club-wide payment details. Public — the registration form renders these
 *  for signed-out visitors. */
export const getPaymentSettings = cache(async (): Promise<PaymentSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) console.error("[getPaymentSettings]", error.message);
  if (!data) {
    return { qrUrl: null, paymentInstructions: "", currencyLabel: "NPR" };
  }
  return mapPaymentSettings(data as DbPaymentSettings);
});

/** Admin: every registration for one ride, oldest first (queue order). */
export async function getRideRegistrations(
  rideId: string,
): Promise<RideRegistration[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ride_registrations")
    .select("*")
    .eq("ride_id", rideId)
    .order("created_at", { ascending: true });

  if (error) { console.error("[getRideRegistrations]", error.message); return []; }
  return (data ?? []).map((r) => mapRideRegistration(r as DbRideRegistration));
}

/** Admin: every registration across all rides, newest first. */
export async function getAllRideRegistrations(): Promise<RideRegistrationWithRide[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ride_registrations")
    .select("*, rides(*)")
    .order("created_at", { ascending: false });

  if (error) { console.error("[getAllRideRegistrations]", error.message); return []; }

  return (data ?? []).map((row) => {
    const r = row as DbRideRegistration;
    const ride = r.rides ? mapRide(r.rides) : null;
    return {
      ...mapRideRegistration(r),
      ride: ride && {
        id:              ride.id,
        title:           ride.title,
        slug:            ride.slug,
        startDate:       ride.startDate,
        registrationFee: ride.registrationFee,
      },
    };
  });
}

/** How many seats one ride has taken. Rejected registrations free their seat,
 *  so only pending and approved count against capacity. */
export async function getRideRegistrationCount(rideId: string): Promise<number> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("ride_registrations")
    .select("id", { count: "exact", head: true })
    .eq("ride_id", rideId)
    .in("status", ["pending", "approved"]);

  if (error) { console.error("[getRideRegistrationCount]", error.message); return 0; }
  return count ?? 0;
}

/** Taken-seat counts for many rides at once, keyed by ride id. Used by the
 *  admin list so it does not fire one count query per ride. */
export async function getRideRegistrationCounts(): Promise<Record<string, number>> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ride_registrations")
    .select("ride_id")
    .in("status", ["pending", "approved"]);

  if (error) { console.error("[getRideRegistrationCounts]", error.message); return {}; }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { ride_id: string }).ride_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

/** Look a registration up by the access code issued at submission. This is how
 *  a signed-out registrant checks their own status, so it must never return
 *  anything the code holder should not see. */
export async function getRegistrationByAccessCode(
  accessCode: string,
): Promise<RideRegistrationWithRide | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ride_registrations")
    .select("*, rides(*)")
    .eq("access_code", accessCode.trim().toUpperCase())
    .maybeSingle();

  if (error) { console.error("[getRegistrationByAccessCode]", error.message); return null; }
  if (!data) return null;

  const r    = data as DbRideRegistration;
  const ride = r.rides ? mapRide(r.rides) : null;
  return {
    ...mapRideRegistration(r),
    ride: ride && {
      id:              ride.id,
      title:           ride.title,
      slug:            ride.slug,
      startDate:       ride.startDate,
      registrationFee: ride.registrationFee,
    },
  };
}

/** The signed-in rider's own registrations. Uses the anon client so the
 *  read_own_ride_registrations policy does the scoping. */
export async function getMyRideRegistrations(): Promise<RideRegistrationWithRide[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("ride_registrations")
    .select("*, rides(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) { console.error("[getMyRideRegistrations]", error.message); return []; }

  return (data ?? []).map((row) => {
    const r = row as DbRideRegistration;
    const ride = r.rides ? mapRide(r.rides) : null;
    return {
      ...mapRideRegistration(r),
      ride: ride && {
        id:              ride.id,
        title:           ride.title,
        slug:            ride.slug,
        startDate:       ride.startDate,
        registrationFee: ride.registrationFee,
      },
    };
  });
}

/** The community anthem. Public — the hero renders the play control from this. */
export const getAnthemSettings = cache(async (): Promise<AnthemSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anthem_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) console.error("[getAnthemSettings]", error.message);
  if (!data) {
    return { title: "Our Anthem", audioUrl: null, credits: null, lyrics: [], isEnabled: false };
  }
  return mapAnthemSettings(data as DbAnthemSettings);
});

/** The signed-in rider's membership card, if they have requested one.
 *  Uses the service role: member_cards is publicly readable for QR validation,
 *  but scoping by user_id is the point here, not the read permission. */
export async function getMyMemberCard(): Promise<MemberCard | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("member_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) { console.error("[getMyMemberCard]", error.message); return null; }
  return data ? mapMemberCard(data as DbMemberCard) : null;
}
