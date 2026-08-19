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
  mapRideRegistration, mapPaymentSettings, mapAnthemSettings, mapAnthemTrack,
  mapProduct, mapShopSettings, mapShopOrder,
  mapMembershipTier, mapMembershipSettings, mapLoyaltyEntry,
  type DbRide, type DbSeries, type DbSponsor, type DbMarshal,
  type DbHomepageContent, type DbMemberCard, type DbCardSettings,
  type DbProfile, type DbRideRegistration, type DbPaymentSettings, type DbAnthemSettings,
  type DbAnthemTrack, type DbProduct, type DbShopSettings, type DbShopOrder,
  type DbMembershipTier, type DbMembershipSettings, type DbLoyaltyEntry,
} from "@/lib/supabase/mappers";
import type {
  Ride, Series, Sponsor, Marshal, HomepageContent, BrandLogos,
  MemberCard, CardSettings,
  RideRegistration, RideRegistrationWithRide, PaymentSettings, AnthemSettings, AnthemTrack,
  Product, ShopSettings, ShopOrder,
  MembershipTier, MembershipSettings, LoyaltyEntry,
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
  status?: MemberCard["status"],
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
      tierId:        null,
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
    .select("full_name, avatar_url, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const row = data as { full_name?: string; avatar_url?: string | null; is_admin?: boolean } | null;

  return {
    fullName:  row?.full_name  ?? (user.user_metadata?.full_name as string | undefined) ?? "",
    avatarUrl: row?.avatar_url ?? null,
    // Same source as the middleware and RLS. ADMIN_EMAILS only bootstraps this
    // at sign-in; it is never consulted at render time.
    isAdmin:   !!row?.is_admin,
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
        endDate:         ride.endDate,
        registrationFee: ride.registrationFee,
        routeData:       ride.routeData,
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
      endDate:         ride.endDate,
      registrationFee: ride.registrationFee,
      routeData:       ride.routeData,
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
        endDate:         ride.endDate,
        registrationFee: ride.registrationFee,
        routeData:       ride.routeData,
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

/** The club's song library, anthem first. Public — the player walks this list.
 *  Inactive tracks are for songs being prepared and never reach the player. */
export const getAnthemTracks = cache(async (): Promise<AnthemTrack[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anthem_tracks")
    .select("*")
    .eq("is_active", true)
    // is_anthem descending puts the anthem at the head of the queue whatever
    // its sort_order, so it is always what the player starts on.
    .order("is_anthem", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) { console.error("[getAnthemTracks]", error.message); return []; }
  return (data ?? []).map((r) => mapAnthemTrack(r as DbAnthemTrack));
});

// ---------------------------------------------------------------------------
// Membership programme
// ---------------------------------------------------------------------------

export const getMembershipSettings = cache(async (): Promise<MembershipSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_settings").select("*").eq("id", 1).maybeSingle();

  if (error) console.error("[getMembershipSettings]", error.message);
  if (!data) return { tiersEnabled: false, loyaltyEnabled: false, pointsLabel: "points" };
  return mapMembershipSettings(data as DbMembershipSettings);
});

/** Every tier, in the club's own order. Public — a rider sees what they are on
 *  and what the ones above are worth. */
export const getMembershipTiers = cache(async (): Promise<MembershipTier[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_tiers")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) { console.error("[getMembershipTiers]", error.message); return []; }
  return (data ?? []).map((r) => mapMembershipTier(r as DbMembershipTier));
});

/**
 * The tier one rider is on.
 *
 * Falls back to the default tier when they have none, so a member is never in
 * limbo — including after a tier they were on has been deleted.
 */
export function resolveTier(
  tiers: MembershipTier[], tierId: string | null,
): MembershipTier | null {
  if (tierId) {
    const exact = tiers.find((t) => t.id === tierId);
    if (exact) return exact;
  }
  return tiers.find((t) => t.isDefault && t.isActive) ?? null;
}

/** The signed-in rider's tier, or the default. Null when tiers are off. */
export async function getMyTier(): Promise<MembershipTier | null> {
  const [settings, tiers, profile] = await Promise.all([
    getMembershipSettings(), getMembershipTiers(), getProfile(),
  ]);
  if (!settings.tiersEnabled) return null;
  return resolveTier(tiers, profile?.tierId ?? null);
}

/** Balance and history. The balance is a SUM of the ledger, never a stored
 *  counter — a counter can only drift, and cannot explain itself. */
export async function getMyLoyalty(): Promise<{
  balance: number;
  entries: LoyaltyEntry[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { balance: 0, entries: [] };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data, error } = await createAdminClient()
    .from("loyalty_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) { console.error("[getMyLoyalty]", error.message); return { balance: 0, entries: [] }; }

  const entries = (data ?? []).map((r) => mapLoyaltyEntry(r as DbLoyaltyEntry));
  return {
    balance: entries.reduce((n, e) => n + e.points, 0),
    entries,
  };
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

const PRODUCT_SELECT = "*, product_variants(*)" as const;

export const getShopSettings = cache(async (): Promise<ShopSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_settings").select("*").eq("id", 1).maybeSingle();

  if (error) console.error("[getShopSettings]", error.message);
  if (!data) return { isEnabled: false, announcement: "", deliveryNote: "" };
  return mapShopSettings(data as DbShopSettings);
});

/** The shop window. Active products only — an inactive one is a draft. */
export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) { console.error("[getProducts]", error.message); return []; }
  return (data ?? []).map((r) => mapProduct(r as DbProduct));
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();

  if (error) { console.error("[getProduct]", error.message); return null; }
  return data ? mapProduct(data as DbProduct) : null;
}

/** Admin: every product, drafts included. Service role. */
export async function getAllProducts(): Promise<Product[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data, error } = await createAdminClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) { console.error("[getAllProducts]", error.message); return []; }
  return (data ?? []).map((r) => mapProduct(r as DbProduct));
}

/** Look up several products at once — what the basket needs to price itself. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products").select(PRODUCT_SELECT).in("id", ids);

  if (error) { console.error("[getProductsByIds]", error.message); return []; }
  return (data ?? []).map((r) => mapProduct(r as DbProduct));
}

const ORDER_SELECT = "*, shop_order_items(*)" as const;

/** Admin: the order queue. Service role — orders are not publicly readable. */
export async function getShopOrders(): Promise<ShopOrder[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data, error } = await createAdminClient()
    .from("shop_orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) { console.error("[getShopOrders]", error.message); return []; }
  return (data ?? []).map((r) => mapShopOrder(r as DbShopOrder));
}

/** A buyer looking their own order up by the code they were given. */
export async function getShopOrderByCode(code: string): Promise<ShopOrder | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data, error } = await createAdminClient()
    .from("shop_orders").select(ORDER_SELECT).eq("access_code", code).maybeSingle();

  if (error) { console.error("[getShopOrderByCode]", error.message); return null; }
  return data ? mapShopOrder(data as DbShopOrder) : null;
}

/** The signed-in rider's own orders, for their profile. */
export async function getMyShopOrders(): Promise<ShopOrder[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data, error } = await createAdminClient()
    .from("shop_orders")
    .select(ORDER_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) { console.error("[getMyShopOrders]", error.message); return []; }
  return (data ?? []).map((r) => mapShopOrder(r as DbShopOrder));
}

/** Admin: every track including the inactive ones. Service role. */
export async function getAllAnthemTracks(): Promise<AnthemTrack[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("anthem_tracks")
    .select("*")
    .order("is_anthem", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) { console.error("[getAllAnthemTracks]", error.message); return []; }
  return (data ?? []).map((r) => mapAnthemTrack(r as DbAnthemTrack));
}

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

// ---------------------------------------------------------------------------
// Payments export
//
// Ride fees and shop orders live in two tables but they are one ledger. This
// flattens them into the rows the export writes, and answers the question the
// export exists for on every line: was this person a member at the time.
// ---------------------------------------------------------------------------

/**
 * Every payment recorded in the given calendar year.
 *
 * Dated by when the payment was taken, not by when the ride happens — money
 * received in December for a January ride belongs in December's books, which
 * is the only reason anyone downloads this.
 *
 * Free rides are excluded rather than listed at zero: a ledger of nothings is
 * a roster, and there is already a roster.
 */
export async function getPaymentsForYear(
  year: number,
): Promise<import("@/lib/exports/payments").PaymentRow[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const from = `${year}-01-01T00:00:00.000Z`;
  const to   = `${year + 1}-01-01T00:00:00.000Z`;

  const [regsRes, ordersRes, profilesRes, tiersRes] = await Promise.all([
    supabase
      .from("ride_registrations")
      .select("*, rides(title)")
      .gte("created_at", from).lt("created_at", to),
    supabase
      .from("shop_orders")
      .select(ORDER_SELECT)
      .gte("created_at", from).lt("created_at", to),
    supabase.from("profiles").select("id, member_status, tier_id"),
    supabase.from("membership_tiers").select("id, name"),
  ]);

  if (regsRes.error)   console.error("[getPaymentsForYear] rides:", regsRes.error.message);
  if (ordersRes.error) console.error("[getPaymentsForYear] shop:",  ordersRes.error.message);

  const tierName = new Map<string, string>(
    ((tiersRes.data ?? []) as { id: string; name: string }[]).map((t) => [t.id, t.name]),
  );
  const profiles = new Map<string, { status: string; tier: string | null }>(
    ((profilesRes.data ?? []) as { id: string; member_status: string; tier_id: string | null }[])
      .map((p) => [p.id, {
        status: p.member_status,
        tier:   p.tier_id ? tierName.get(p.tier_id) ?? null : null,
      }]),
  );

  type Standing = import("@/lib/exports/payments").MembershipStanding;

  /** No account is a guest, not a rejection. The three-way answer is the point. */
  const standingFor = (userId: string | null): { standing: Standing; tier: string | null } => {
    if (!userId) return { standing: "Guest", tier: null };
    const p = profiles.get(userId);
    if (!p)     return { standing: "Guest", tier: null };
    return {
      standing: p.status === "approved" ? "Member"
              : p.status === "rejected" ? "Rejected"
              : "Pending",
      tier: p.tier,
    };
  };

  const rows: import("@/lib/exports/payments").PaymentRow[] = [];

  for (const raw of (regsRes.data ?? [])) {
    const r = raw as DbRideRegistration & { rides?: { title?: string } | null };
    const reg = mapRideRegistration(r);
    // A free ride has nothing to reconcile.
    if (!reg.amountPaid) continue;

    const who = standingFor(reg.userId);
    rows.push({
      date:       reg.createdAt,
      type:       "Ride",
      reference:  reg.accessCode,
      what:       r.rides?.title ?? "Ride",
      fullName:   reg.fullName,
      standing:   who.standing,
      // What they were on when they paid, if it was recorded then; their
      // current tier otherwise. The stored label is the more truthful of the
      // two, because a promotion since does not change what they were charged.
      tier:       reg.tierLabel ?? who.tier,
      phone:      reg.phone,
      email:      reg.email,
      amount:     reg.amountPaid,
      paymentRef: reg.paymentReference,
      hasProof:   !!reg.paymentScreenshotUrl,
      status:     reg.status,
      approvedAt: reg.approvedAt,
    });
  }

  for (const raw of (ordersRes.data ?? [])) {
    const order = mapShopOrder(raw as DbShopOrder);
    if (!order.total) continue;

    const who = standingFor(order.userId);
    const what = order.items.length === 1
      ? `${order.items[0].productName}${order.items[0].quantity > 1 ? ` ×${order.items[0].quantity}` : ""}`
      : `${order.items.length} items`;

    rows.push({
      date:       order.createdAt,
      type:       "Shop",
      reference:  order.accessCode,
      what,
      fullName:   order.fullName,
      standing:   who.standing,
      tier:       who.tier,
      phone:      order.phone,
      email:      order.email,
      amount:     order.total,
      paymentRef: order.paymentReference,
      hasProof:   !!order.paymentScreenshotUrl,
      status:     order.status,
      approvedAt: order.approvedAt,
    });
  }

  return rows;
}
