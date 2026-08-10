// =============================================================================
// Supabase Read Query Functions - server-side only
// Import in Server Components / Route Handlers / Server Actions.
// All functions return empty arrays / null / defaults on error so pages
// never crash; they simply show empty states until the DB is seeded.
// =============================================================================

import { cache }               from "react";
import { createClient }        from "@/lib/supabase/server";
import {
  mapRide, mapChapter, mapSponsor, mapMarshal, mapHomepageContent,
  mapMemberCard, mapCardSettings, mapProfile,
  type DbRide, type DbChapter, type DbSponsor, type DbMarshal,
  type DbHomepageContent, type DbMemberCard, type DbCardSettings,
  type DbProfile,
} from "@/lib/supabase/mappers";
import type {
  Ride, Chapter, Sponsor, Marshal, HomepageContent, BrandLogos,
  MemberCard, CardSettings,
} from "@/types";

// ---------------------------------------------------------------------------
// Shared select fragments (PostgREST syntax)
// ---------------------------------------------------------------------------

const RIDE_SELECT =
  "*, marshals(*), ride_sponsors(sponsors(*))" as const;

const CHAPTER_SELECT = "*, marshals(*)" as const;

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
// Chapters
// ---------------------------------------------------------------------------

/**
 * All chapters with their marshals (lead + all), plus totalRidesThisYear.
 * Fetches all marshals in one query and groups them by chapter name.
 */
export async function getChapters(year = new Date().getFullYear()): Promise<Chapter[]> {
  const supabase = await createClient();

  const [chaptersResult, rideCountsResult, marshalsResult] = await Promise.all([
    supabase
      .from("chapters")
      .select(CHAPTER_SELECT)
      .order("is_priority", { ascending: false }),

    supabase
      .from("rides")
      .select("chapter")
      .gte("start_date", `${year}-01-01`)
      .lte("start_date", `${year}-12-31`),

    // Fetch ALL marshals (active + inactive) so admin sees full picture.
    // Public pages filter by isActive client-side if needed.
    supabase
      .from("marshals")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  if (chaptersResult.error) {
    console.error("[queries] getChapters:", chaptersResult.error.message);
    return [];
  }

  const countByChapter: Record<string, number> = {};
  for (const row of rideCountsResult.data ?? []) {
    countByChapter[row.chapter] = (countByChapter[row.chapter] ?? 0) + 1;
  }

  // Group marshals by chapter name — skip null (Head Marshal is national-level)
  const marshalsByChapter: Record<string, DbMarshal[]> = {};
  for (const m of (marshalsResult.data ?? []) as DbMarshal[]) {
    if (!m.chapter) continue;
    if (!marshalsByChapter[m.chapter]) marshalsByChapter[m.chapter] = [];
    marshalsByChapter[m.chapter].push(m);
  }

  return (chaptersResult.data as DbChapter[]).map((ch) =>
    mapChapter(
      ch,
      countByChapter[ch.name] ?? 0,
      marshalsByChapter[ch.name] ?? [],
    )
  );
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
      showChapter:        true,
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
      chapter:       null,
      phone:         null,
      avatarUrl:     null,
      address:       null,
      bikeModel:     null,
      dateOfBirth:   null,
      licenseNumber: null,
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
