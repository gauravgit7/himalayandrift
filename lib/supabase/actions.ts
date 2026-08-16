// =============================================================================
// Supabase Server Actions - mutations + auth
// 'use server' makes every export in this file a Next.js Server Action.
// Safe to import in Client Components - only the serialised call crosses the wire.
// SECURITY: uses the anon key + user session (RLS enforced).
// Do NOT import SUPABASE_SERVICE_ROLE_KEY here - that's for seed scripts only.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect }       from "next/navigation";
import { createClient }   from "@/lib/supabase/server";
import { ROUTES }         from "@/lib/constants";
import type { HomepageContent, RouteData, MemberCard, CardSettings, CardRequirement } from "@/types";
import type { PushOptInSettings }          from "@/components/shared/PushOptIn";
import type { PwaSettings }               from "@/features/admin/PwaSettingsAdmin";
import { MEMBER_CARD_PREFIX }             from "@/lib/constants";

// ---------------------------------------------------------------------------
// Auth - Sign Out
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}

// ---------------------------------------------------------------------------
// Rides - upsert payload shape (matches RideForm state)
// ---------------------------------------------------------------------------

export interface RidePayload {
  title:            string;
  rideType:         string;
  location:         string;
  startDate:        string;
  endDate:          string;
  status:           string;
  priority:         string;
  shortDescription: string;
  description:      string;
  expectedRiders:   number;
  registrationLink: string | null;
  isFeatured:       boolean;
  marshalId:        string | null;
  seriesId:         string | null;
  volume:           number | null;
  bannerImageUrl:   string | null;
  routeData:        RouteData | null;
  // Built-in registration
  registrationOpen:     boolean;
  registrationFee:      number | null;
  registrationCapacity: number | null;
  paymentQrUrl:         string | null;
  paymentInstructions:  string | null;
}

// ---------------------------------------------------------------------------
// Rides - Save (create or update)
// ---------------------------------------------------------------------------

export async function saveRide(
  payload: RidePayload,
  rideId?: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const dbRow = {
    title:             payload.title.trim(),
    ride_type:         payload.rideType,
    location:          payload.location.trim(),
    start_date:        payload.startDate,
    end_date:          payload.endDate,
    status:            payload.status,
    priority:          payload.priority,
    short_description: payload.shortDescription.trim() || null,
    description:       payload.description.trim()      || null,
    expected_riders:   payload.expectedRiders,
    registration_link: payload.registrationLink        || null,
    is_featured:       payload.isFeatured,
    marshal_id:        payload.marshalId               || null,
    series_id:         payload.seriesId                || null,
    // A volume number without a series is meaningless, and the DB enforces it.
    volume:            payload.seriesId ? payload.volume ?? null : null,
    banner_image_url:  payload.bannerImageUrl          ?? null,
    route_data:        payload.routeData               ?? null,
    registration_open:     payload.registrationOpen,
    // 0 and null both mean free; store null so the check constraint and the
    // "is this paid?" test agree on one representation.
    registration_fee:      payload.registrationFee && payload.registrationFee > 0
                             ? payload.registrationFee
                             : null,
    registration_capacity: payload.registrationCapacity && payload.registrationCapacity > 0
                             ? payload.registrationCapacity
                             : null,
    payment_qr_url:        payload.paymentQrUrl        || null,
    payment_instructions:  payload.paymentInstructions?.trim() || null,
    // Generate slug only when creating - preserve existing slug on edit
    ...(!rideId && {
      slug: payload.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    }),
  };

  if (rideId) {
    const { error } = await supabase
      .from("rides")
      .update(dbRow)
      .eq("id", rideId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("rides").insert(dbRow);
    if (error) return { error: error.message };
  }

  revalidatePath(ROUTES.adminRides);
  revalidatePath(ROUTES.calendar);
  revalidatePath("/home");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Rides - Delete
// ---------------------------------------------------------------------------

export async function deleteRide(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("rides").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.adminRides);
  revalidatePath(ROUTES.calendar);
  revalidatePath("/home");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Homepage Content - Save
// ---------------------------------------------------------------------------

export async function saveHomepageContent(
  content: HomepageContent,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.from("homepage_content").upsert({
    id:                          1,
    hero_title:                  content.heroBanner.title,
    hero_subtitle:               content.heroBanner.subtitle,
    hero_background_image_url:   content.heroBanner.backgroundImageUrl,
    hero_overlay_opacity:        content.heroBanner.overlayOpacity,
    hero_primary_cta_label:      content.heroBanner.primaryCTALabel,
    hero_primary_cta_link:       content.heroBanner.primaryCTALink,
    hero_secondary_cta_label:    content.heroBanner.secondaryCTALabel,
    hero_secondary_cta_link:     content.heroBanner.secondaryCTALink,
    hero_featured_ride_id:       content.heroBanner.featuredRideId,
    brand_logo_url:              content.brandLogos.logoUrl,
    marquee_ride_ids:            content.marqueeRideIds,
    featured_upcoming_ride_ids:  content.featuredUpcomingRideIds,
    show_weather_widget:         content.showWeatherWidget,
    show_sponsor_showcase:       content.showSponsorShowcase,
  });

  if (error) return { error: error.message };

  revalidatePath("/home");
  revalidatePath(ROUTES.adminHomepage);
  return { error: null };
}

// ---------------------------------------------------------------------------
// Series - Save (create or update)
// ---------------------------------------------------------------------------

export interface SeriesPayload {
  id?:         string;
  name:        string;
  slug:        string;
  description: string | null;
  bannerUrl:   string | null;
}

export async function saveSeries(
  payload: SeriesPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const slug = (payload.slug.trim() || payload.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!payload.name.trim()) return { error: "Name is required" };
  if (!slug)                return { error: "Could not build a slug from that name" };

  const row = {
    name:        payload.name.trim(),
    slug,
    description: payload.description?.trim() || null,
    banner_url:  payload.bannerUrl           || null,
  };

  const { error } = payload.id
    ? await supabase.from("series").update(row).eq("id", payload.id)
    : await supabase.from("series").insert(row);

  if (error) {
    // 23505 = unique_violation on series.slug
    if (error.code === "23505") {
      return { error: `A series with the slug "${slug}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath(ROUTES.adminSeries);
  revalidatePath(ROUTES.series);
  revalidatePath(ROUTES.calendar);
  revalidatePath("/home");
  return { error: null };
}

/**
 * Deleting a series leaves its rides in place — rides.series_id is ON DELETE
 * SET NULL, so the volumes simply become standalone rides rather than
 * disappearing from the calendar.
 */
export async function deleteSeries(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("series").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(ROUTES.adminSeries);
  revalidatePath(ROUTES.series);
  revalidatePath(ROUTES.calendar);
  revalidatePath("/home");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Sponsors - Save (create or update)
// ---------------------------------------------------------------------------

export interface SponsorPayload {
  id?:         string;
  name:        string;
  logoUrl:     string | null;
  description: string | null;
  websiteUrl:  string | null;
  tier:        "title" | "co" | "associate" | "media";
  isActive:    boolean;
}

export async function saveSponsor(
  payload: SponsorPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const row = {
    name:        payload.name.trim(),
    logo_url:    payload.logoUrl     || null,
    description: payload.description?.trim() || null,
    website_url: payload.websiteUrl?.trim()  || null,
    tier:        payload.tier,
    is_active:   payload.isActive,
  };

  if (payload.id) {
    const { error } = await supabase.from("sponsors").update(row).eq("id", payload.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("sponsors").insert(row);
    if (error) return { error: error.message };
  }

  revalidatePath(ROUTES.adminSponsors);
  revalidatePath("/home");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Sponsors - Delete
// ---------------------------------------------------------------------------

export async function deleteSponsor(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("sponsors").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.adminSponsors);
  revalidatePath("/home");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Marshals - Save (create or update)
// ---------------------------------------------------------------------------

export interface MarshalPayload {
  id?:           string;
  name:          string;
  phone:         string | null;
  avatarUrl:     string | null;
  role:          string;
  roleIconUrl:   string | null;
  /** Comma-separated specialty tags: "Navigation, Route Planning" */
  specialty:     string | null;
  bio:           string | null;
  totalRidesLed:   number;
  isActive:        boolean;
  /** Instagram handle without @ prefix. Null if not provided. */
  instagramHandle: string | null;
}

export async function saveMarshal(
  payload: MarshalPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const row = {
    name:            payload.name.trim(),
    phone:           payload.phone?.trim()   || null,
    avatar_url:      payload.avatarUrl       || null,
    role:            payload.role.trim()     || "Ride Marshal",
    role_icon_url:   payload.roleIconUrl     || null,
    specialty:       payload.specialty?.trim() || null,
    bio:             payload.bio?.trim()     || null,
    total_rides_led:  payload.totalRidesLed   ?? 0,
    is_active:        payload.isActive,
    instagram_handle: payload.instagramHandle?.replace(/^@/, "").trim() || null,
  };

  if (payload.id) {
    const { error } = await supabase.from("marshals").update(row).eq("id", payload.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("marshals").insert(row);
    if (error) return { error: error.message };
  }

  revalidatePath("/marshals");
  revalidatePath("/home");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Marshals - Delete
// ---------------------------------------------------------------------------

export async function deleteMarshal(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("marshals").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/marshals");
  revalidatePath("/home");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Push notification settings - Save
// ---------------------------------------------------------------------------

export async function savePushSettings(
  settings: PushOptInSettings,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("push_settings")
    .upsert({
      id:                1,
      enabled:           settings.enabled,
      prompt_style:      settings.promptStyle,
      prompt_delay_secs: settings.promptDelaySecs,
      prompt_page:       settings.promptPage,
      updated_at:        new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath("/");
  return { error: null };
}

// ---------------------------------------------------------------------------
// PWA settings - Save
// ---------------------------------------------------------------------------

export async function savePwaSettings(
  settings: PwaSettings,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pwa_settings")
    .upsert({
      id:         1,
      app_name:   settings.appName.trim(),
      short_name: settings.shortName.trim(),
      icon_url:   settings.iconUrl || null,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath("/manifest.webmanifest");
  revalidatePath("/");
  return { error: null };
}

// =============================================================================
// Membership card actions
// =============================================================================

/** Generate a random 6-char access code: HD-XXXXXX */
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HD-${suffix}`;
}

export interface MemberCardPayload {
  fullName:        string;
  photoUrl:        string;
  dateOfBirth:     string;
  bloodGroup:      string;
  emergencyPhone:  string;
  licenseNumber:   string;
  consentAccepted: boolean;
}

/** Public — submit a new membership card application. */
export async function submitMemberCard(
  payload: MemberCardPayload,
): Promise<{ accessCode: string | null; error: string | null }> {
  // Attempt up to 5 times in case of (very unlikely) access code collision
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateAccessCode();
    const { error } = await supabase.from("member_cards").insert({
      access_code:      accessCode,
      full_name:        payload.fullName.trim(),
      photo_url:        payload.photoUrl,
      date_of_birth:    payload.dateOfBirth,
      blood_group:      payload.bloodGroup,
      emergency_phone:  payload.emergencyPhone.trim(),
      license_number:   payload.licenseNumber.trim(),
      consent_accepted: payload.consentAccepted,
      status:           "pending",
    });

    if (!error) {
      revalidatePath("/admin/members");
      return { accessCode, error: null };
    }

    // 23505 = unique_violation — retry with a new code
    if ((error as { code?: string }).code !== "23505") {
      return { accessCode: null, error: error.message };
    }
  }

  return { accessCode: null, error: "Failed to generate unique access code. Please try again." };
}

/** Public — re-submit after rejection (same access code retained). */
export async function resubmitMemberCard(
  accessCode: string,
  payload:    Partial<MemberCardPayload>,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("member_cards")
    .update({
      ...(payload.fullName       && { full_name:       payload.fullName.trim() }),
      ...(payload.photoUrl       && { photo_url:       payload.photoUrl }),
      ...(payload.dateOfBirth    && { date_of_birth:   payload.dateOfBirth }),
      ...(payload.bloodGroup     && { blood_group:     payload.bloodGroup }),
      ...(payload.emergencyPhone && { emergency_phone: payload.emergencyPhone.trim() }),
      ...(payload.licenseNumber  && { license_number:  payload.licenseNumber.trim() }),
      status:           "pending",
      rejection_reason: null,
      updated_at:       new Date().toISOString(),
    })
    .eq("access_code", accessCode)
    .eq("status", "rejected");

  if (error) return { error: error.message };

  // Increment resubmission count
  await supabase.rpc("increment_resubmission_count", { p_access_code: accessCode });

  revalidatePath("/admin/members");
  return { error: null };
}

/** Admin — approve a card application and assign its card number. */
export async function approveMemberCard(
  id: string,
): Promise<{ error: string | null; cardNumber?: string }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Fetch card to build the card number
  const { data: card, error: fetchError } = await supabase
    .from("member_cards")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !card) return { error: fetchError?.message ?? "Card not found" };

  // Get validity_years from settings
  const { data: settings } = await supabase
    .from("card_settings")
    .select("validity_years")
    .eq("id", 1)
    .single();
  const validityYears = settings?.validity_years ?? 2;

  // Compute the sequential card number for this year, e.g. HD-26-00001
  const yearShort = String(new Date().getFullYear()).slice(2); // "26"
  const prefix    = `${MEMBER_CARD_PREFIX}-${yearShort}-`;

  const { count } = await supabase
    .from("member_cards")
    .select("id", { count: "exact", head: true })
    .like("card_number", `${prefix}%`);

  const seq = String((count ?? 0) + 1).padStart(5, "0");
  const cardNumber = `${prefix}${seq}`;

  // Compute valid_until
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + validityYears);
  const validUntilStr = validUntil.toISOString().slice(0, 10);

  const { error } = await supabase
    .from("member_cards")
    .update({
      status:      "approved",
      card_number: cardNumber,
      approved_at: new Date().toISOString(),
      valid_until: validUntilStr,
      updated_at:  new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  return { error: null, cardNumber };
}

/** Admin — reject a card application with a reason. */
export async function rejectMemberCard(
  id:     string,
  reason: string,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("member_cards")
    .update({
      status:           "rejected",
      rejection_reason: reason.trim() || null,
      updated_at:       new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  return { error: null };
}

/** Admin — save card settings. */
export async function saveCardSettings(
  settings: CardSettings,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("card_settings")
    .upsert({
      id:                   1,
      tagline:              settings.tagline.trim(),
      disclaimer:           settings.disclaimer.trim(),
      validity_years:       settings.validityYears,
      show_blood_group:     settings.showBloodGroup,
      show_dob:             settings.showDob,
      show_emergency_phone: settings.showEmergencyPhone,
      benefits:             settings.benefits,
      updated_at:           new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath("/membership");
  revalidatePath("/admin/settings");
  return { error: null };
}

// =============================================================================
// Public Auth — sign up, sign in, sign out, profile update
// These are separate from the admin signIn/signOut above.
// =============================================================================

export interface SignUpPayload {
  fullName:      string;
  email:         string;
  password:      string;
  phone?:        string | null;
  address?:      string | null;
  bikeModel?:    string | null;
  dateOfBirth?:  string | null;
  licenseNumber?: string | null;
  // Asked at sign-up only so a membership card can be issued later without
  // making the rider fill in a second form.
  bloodGroup?:     string | null;
  emergencyName?:  string | null;
  emergencyPhone?: string | null;
}

/** Register a new community member. Creates auth user + profile row. */
export async function signUpPublic(
  payload: SignUpPayload,
): Promise<{ error: string | null; needsConfirmation?: boolean }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email:    payload.email.trim(),
    password: payload.password,
    options:  {
      data:             { full_name: payload.fullName.trim() },
      // Supabase sends confirmation email → our callback handler → home
      emailRedirectTo:  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Sign up failed. Please try again." };

  // Insert profile via service role so it works regardless of email-confirm setting
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").upsert({
    id:             data.user.id,
    full_name:      payload.fullName.trim(),
    email:          payload.email.trim(),
    phone:          payload.phone?.trim()  ?? null,
    address:        payload.address?.trim() ?? null,
    bike_model:     payload.bikeModel?.trim() ?? null,
    date_of_birth:  payload.dateOfBirth    ?? null,
    license_number: payload.licenseNumber?.trim() ?? null,
    blood_group:     payload.bloodGroup?.trim()     ?? null,
    emergency_name:  payload.emergencyName?.trim()  ?? null,
    emergency_phone: payload.emergencyPhone?.trim() ?? null,
    member_status:  "pending",
  });

  // The auth user exists at this point, so failing the sign-up would strand the
  // account. Log loudly instead: the rider can still sign in, and saving their
  // profile page recreates the row (updateProfile upserts for exactly this case).
  if (profileError) {
    console.error("[signUpPublic] profile row not created:", profileError.message);
  }

  // Email confirmation required — no session yet
  if (!data.session) {
    return { error: null, needsConfirmation: true };
  }

  revalidatePath(ROUTES.profile);
  redirect(ROUTES.profile);
}

/** Sign in an existing community member (or admin via rider form — redirects to /admin). */
export async function signInPublic(
  email:    string,
  password: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { error: error.message };

  const user = data.user;
  if (!user) return { error: "Sign in failed. Please try again." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // ADMIN_EMAILS is a BOOTSTRAP, not a runtime check. Being on the list
  // promotes the account here, once; from then on profiles.is_admin is the
  // single answer to "is this an admin", used by the middleware and by every
  // RLS policy alike. Two independent sources for one question is how they
  // drift, and how someone ends up seeing an admin panel that cannot save.
  const listed = (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    .includes((user.email ?? "").toLowerCase());

  // An account created in the Supabase dashboard has no profile row at all,
  // so this upserts rather than updates.
  const { data: existing } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("profiles").insert({
      id:            user.id,
      email:         user.email ?? null,
      full_name:     (user.user_metadata?.full_name as string | undefined) ?? "",
      is_admin:      listed,
      // A bootstrapped admin is a member by definition; nobody approves them.
      member_status: listed ? "approved" : "pending",
    });
  } else if (listed && !(existing as { is_admin: boolean }).is_admin) {
    await admin
      .from("profiles")
      .update({ is_admin: true, member_status: "approved" })
      .eq("id", user.id);
  }

  const isAdmin = listed || !!(existing as { is_admin?: boolean } | null)?.is_admin;

  if (isAdmin) {
    revalidatePath(ROUTES.admin, "layout");
    redirect(ROUTES.admin);
  }

  revalidatePath(ROUTES.profile);
  redirect(ROUTES.profile);
}

/** Sign out the current public user and return to home. */
export async function signOutPublic(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect(ROUTES.home);
}

/** Update the signed-in user's own profile. */
export async function updateProfile(data: {
  fullName:      string;
  phone?:        string | null;
  avatarUrl?:    string | null;
  address?:      string | null;
  bikeModel?:    string | null;
  dateOfBirth?:  string | null;
  licenseNumber?: string | null;
  bloodGroup?:     string | null;
  emergencyName?:  string | null;
  emergencyPhone?: string | null;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Upsert, not update: getProfile() renders a default for a signed-in user with
  // no row yet, so an update here would silently affect zero rows and still
  // report success. The approval columns are deliberately absent - a rider must
  // not set their own status, and the DB trigger freezes them regardless.
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id:             user.id,
      email:          user.email ?? null,
      full_name:      data.fullName.trim(),
      phone:          data.phone?.trim()   ?? null,
      avatar_url:     data.avatarUrl       ?? null,
      address:        data.address?.trim() ?? null,
      bike_model:     data.bikeModel?.trim() ?? null,
      date_of_birth:  data.dateOfBirth     ?? null,
      license_number: data.licenseNumber?.trim() ?? null,
      blood_group:     data.bloodGroup?.trim()     ?? null,
      emergency_name:  data.emergencyName?.trim()  ?? null,
      emergency_phone: data.emergencyPhone?.trim() ?? null,
      updated_at:     new Date().toISOString(),
    });

  if (error) return { error: error.message };
  revalidatePath(ROUTES.profile);
  return { error: null };
}

// =============================================================================
// Admin — member registration management
// =============================================================================

/** Admin: approve a member registration. */
export async function approveRegistration(
  id: string,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      member_status: "approved",
      approved_at:   new Date().toISOString(),
      rejected_at:   null,
      updated_at:    new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.adminMembers);
  return { error: null };
}

/** Admin: reject a member registration with an optional reason. */
export async function rejectRegistration(
  id:     string,
  reason: string,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      member_status: "rejected",
      rejected_at:   new Date().toISOString(),
      approved_at:   null,
      admin_notes:   reason.trim() || null,
      updated_at:    new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.adminMembers);
  return { error: null };
}

/** Admin: update a member's registration details and/or add notes. */
export async function updateRegistrationByAdmin(
  id:   string,
  data: {
    fullName?:     string;
    phone?:        string | null;
    address?:      string | null;
    bikeModel?:    string | null;
    dateOfBirth?:  string | null;
    licenseNumber?: string | null;
    adminNotes?:   string | null;
  },
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.fullName      !== undefined) patch.full_name      = data.fullName.trim();
  if (data.phone         !== undefined) patch.phone          = data.phone?.trim()  ?? null;
  if (data.address       !== undefined) patch.address        = data.address?.trim() ?? null;
  if (data.bikeModel     !== undefined) patch.bike_model     = data.bikeModel?.trim() ?? null;
  if (data.dateOfBirth   !== undefined) patch.date_of_birth  = data.dateOfBirth    ?? null;
  if (data.licenseNumber !== undefined) patch.license_number = data.licenseNumber?.trim() ?? null;
  if (data.adminNotes    !== undefined) patch.admin_notes    = data.adminNotes?.trim() ?? null;

  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(ROUTES.adminMembers);
  return { error: null };
}

/** Send a password reset email to the given address. */
export async function sendPasswordReset(
  email: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${base}/auth/callback?next=/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) return { error: error.message };
  return { error: null };
}

// =============================================================================
// Ride registrations
// =============================================================================

/** Generate a random registration code: HD-R-XXXXXX */
function generateRegistrationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HD-R-${suffix}`;
}

export interface RideRegistrationPayload {
  rideId:          string;
  fullName:        string;
  phone:           string;
  email?:          string | null;
  emergencyName?:  string | null;
  emergencyPhone?: string | null;
  bikeModel?:      string | null;
  pillionCount?:   number;
  notes?:          string | null;
  paymentReference?:     string | null;
  paymentScreenshotUrl?: string | null;
}

/**
 * Public - register for a ride. Open to signed-out visitors.
 *
 * Everything the form decided is re-decided here. A client can post whatever it
 * likes to a server action, so the fee, the capacity check and the "screenshot
 * required" rule are all re-read from the database rather than trusted from
 * the payload.
 */
export async function submitRideRegistration(
  payload: RideRegistrationPayload,
): Promise<{ accessCode: string | null; error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  if (!payload.fullName.trim()) return { accessCode: null, error: "Please enter your name." };
  if (!payload.phone.trim())    return { accessCode: null, error: "Please enter a phone number." };

  // -- Re-read the ride; never trust the client's idea of it -----------------
  const { data: rideRow, error: rideError } = await admin
    .from("rides")
    .select("id, slug, status, end_date, registration_open, registration_fee, registration_capacity")
    .eq("id", payload.rideId)
    .maybeSingle();

  if (rideError) return { accessCode: null, error: rideError.message };
  if (!rideRow)  return { accessCode: null, error: "That ride no longer exists." };

  const ride = rideRow as {
    id: string; slug: string | null; status: string; end_date: string;
    registration_open: boolean;
    registration_fee: number | string | null;
    registration_capacity: number | null;
  };

  if (!ride.registration_open) {
    return { accessCode: null, error: "Registration is not open for this ride." };
  }
  if (ride.status === "cancelled") {
    return { accessCode: null, error: "This ride has been cancelled." };
  }
  if (ride.end_date < new Date().toISOString().slice(0, 10)) {
    return { accessCode: null, error: "This ride has already finished." };
  }

  const fee    = ride.registration_fee === null ? null : Number(ride.registration_fee);
  const isPaid = fee !== null && fee > 0;

  if (isPaid && !payload.paymentScreenshotUrl) {
    return { accessCode: null, error: "Please upload a screenshot of your payment." };
  }

  // -- Capacity --------------------------------------------------------------
  // Checked immediately before the insert. Two riders taking the last seat in
  // the same instant can still both get in; that is a deliberate trade against
  // locking the table, and the admin can reject the extra one.
  if (ride.registration_capacity !== null) {
    const { count } = await admin
      .from("ride_registrations")
      .select("id", { count: "exact", head: true })
      .eq("ride_id", ride.id)
      .in("status", ["pending", "approved"]);

    if ((count ?? 0) >= ride.registration_capacity) {
      return { accessCode: null, error: "This ride is full." };
    }
  }

  // -- Link to the signed-in rider, if there is one --------------------------
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await admin
      .from("ride_registrations")
      .select("id")
      .eq("ride_id", ride.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      return { accessCode: null, error: "You have already registered for this ride." };
    }
  }

  const base = {
    ride_id:          ride.id,
    user_id:          user?.id ?? null,
    full_name:        payload.fullName.trim(),
    phone:            payload.phone.trim(),
    email:            payload.email?.trim()          || null,
    emergency_name:   payload.emergencyName?.trim()  || null,
    emergency_phone:  payload.emergencyPhone?.trim() || null,
    bike_model:       payload.bikeModel?.trim()      || null,
    pillion_count:    Math.max(0, payload.pillionCount ?? 0),
    notes:            payload.notes?.trim()          || null,
    // Taken from the ride, not the form, so the roster records what was
    // actually owed even if the fee is edited afterwards.
    amount_paid:            isPaid ? fee : null,
    payment_reference:      isPaid ? payload.paymentReference?.trim() || null : null,
    payment_screenshot_url: isPaid ? payload.paymentScreenshotUrl     || null : null,
    status:           "pending",
  };

  // Retry on the (very unlikely) access-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateRegistrationCode();
    const { error } = await admin
      .from("ride_registrations")
      .insert({ ...base, access_code: accessCode });

    if (!error) {
      revalidatePath(ROUTES.adminRegistrations);
      // The ride page is ISR and reachable by both id and slug, so the seat
      // count is cached under whichever one was requested. Flush both.
      revalidatePath(`/rides/${ride.id}`);
      if (ride.slug) revalidatePath(`/rides/${ride.slug}`);
      return { accessCode, error: null };
    }

    // 23505 = unique_violation. Either the access code, or the one-per-rider
    // index if the same account raced itself in two tabs.
    if ((error as { code?: string }).code !== "23505") {
      return { accessCode: null, error: error.message };
    }
    if ((error as { message?: string }).message?.includes("one_per_user")) {
      return { accessCode: null, error: "You have already registered for this ride." };
    }
  }

  return { accessCode: null, error: "Could not generate a unique code. Please try again." };
}

/** Flush the public ride page after a registration changes, so the seat count
 *  and the "full" badge do not sit stale behind ISR. The page is reachable by
 *  both id and slug, so both are flushed. */
async function revalidateRideForRegistration(registrationId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("ride_registrations")
    .select("rides(id, slug)")
    .eq("id", registrationId)
    .maybeSingle();

  const ride = (data as { rides?: { id: string; slug: string | null } | null } | null)?.rides;
  if (!ride) return;

  revalidatePath(`/rides/${ride.id}`);
  if (ride.slug) revalidatePath(`/rides/${ride.slug}`);
}

/** Admin: approve a ride registration. */
export async function approveRideRegistration(
  id: string,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ride_registrations")
    .update({
      status:           "approved",
      approved_at:      new Date().toISOString(),
      rejected_at:      null,
      rejection_reason: null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await revalidateRideForRegistration(id);
  revalidatePath(ROUTES.adminRegistrations);
  return { error: null };
}

/** Admin: reject a ride registration, which frees its seat. */
export async function rejectRideRegistration(
  id:     string,
  reason: string,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ride_registrations")
    .update({
      status:           "rejected",
      rejected_at:      new Date().toISOString(),
      approved_at:      null,
      rejection_reason: reason.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await revalidateRideForRegistration(id);
  revalidatePath(ROUTES.adminRegistrations);
  return { error: null };
}

/** Admin: attach an internal note to a registration. */
export async function updateRideRegistrationNotes(
  id:    string,
  notes: string,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ride_registrations")
    .update({ admin_notes: notes.trim() || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.adminRegistrations);
  return { error: null };
}

/** Admin: delete a registration outright. Rejecting is usually the right move -
 *  this is for duplicates and test entries that should not sit in the roster. */
export async function deleteRideRegistration(
  id: string,
): Promise<{ error: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Resolve the ride before the row is gone.
  await revalidateRideForRegistration(id);

  const { error } = await supabase.from("ride_registrations").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(ROUTES.adminRegistrations);
  return { error: null };
}

// =============================================================================
// Payment settings
// =============================================================================

export interface PaymentSettingsPayload {
  qrUrl:               string | null;
  paymentInstructions: string;
  currencyLabel:       string;
}

/** Admin: save the club-wide payment details. */
export async function savePaymentSettings(
  payload: PaymentSettingsPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_settings")
    .upsert({
      id:                   1,
      qr_url:               payload.qrUrl || null,
      payment_instructions: payload.paymentInstructions.trim(),
      currency_label:       payload.currencyLabel.trim() || "NPR",
      updated_at:           new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath(ROUTES.adminSettings);
  revalidatePath("/rides");
  return { error: null };
}

// =============================================================================
// Anthem
// =============================================================================

export interface AnthemLyricLinePayload {
  time: number | null;
  text: string;
}

export interface AnthemSettingsPayload {
  title:     string;
  audioUrl:  string | null;
  credits:   string | null;
  lyrics:    AnthemLyricLinePayload[];
  isEnabled: boolean;
}

/** Admin: save the community anthem and its lyrics. */
export async function saveAnthemSettings(
  payload: AnthemSettingsPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Stored as { t, text } to keep each timestamp attached to its own line, so
  // reordering or inserting a line can never shift the timings underneath it.
  //
  // Blank lines are KEPT - they are the stanza breaks, and dropping them would
  // reflow the whole anthem into one block. Only the empty lines top and tail
  // are trimmed, since those are just paste artefacts.
  const trimmed = [...payload.lyrics];
  while (trimmed.length && !trimmed[0].text.trim())              trimmed.shift();
  while (trimmed.length && !trimmed[trimmed.length - 1].text.trim()) trimmed.pop();

  const lyrics = trimmed
    .map((l) => ({
      t: typeof l.time === "number" && Number.isFinite(l.time) && l.time >= 0
        ? Math.round(l.time * 100) / 100   // centiseconds is plenty for singing
        : null,
      text: l.text.trim(),
    }));

  const { error } = await supabase
    .from("anthem_settings")
    .upsert({
      id:         1,
      title:      payload.title.trim() || "Our Anthem",
      audio_url:  payload.audioUrl || null,
      credits:    payload.credits?.trim() || null,
      lyrics,
      // Nothing to play without audio, so the switch cannot be on without it.
      is_enabled: payload.isEnabled && !!payload.audioUrl,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath(ROUTES.adminSettings);
  revalidatePath("/home");
  revalidatePath("/");
  return { error: null };
}

/**
 * Public — request a membership card using the details already on the profile.
 *
 * The point of this action is that a signed-in rider never re-types anything:
 * everything the card needs was captured at sign-up. Accounts created before
 * those fields existed will be missing some, which is why this reports exactly
 * what is absent rather than failing vaguely.
 */
export async function requestMemberCard(): Promise<{
  accessCode: string | null;
  missing:    CardRequirement[];
  error:      string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { accessCode: null, missing: [], error: "Please sign in first." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: row, error: profileError } = await admin
    .from("profiles")
    .select("full_name, avatar_url, date_of_birth, blood_group, emergency_phone, license_number, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return { accessCode: null, missing: [], error: profileError.message };
  if (!row) {
    return { accessCode: null, missing: [], error: "Complete your profile before requesting a card." };
  }

  const p = row as {
    full_name: string | null; avatar_url: string | null; date_of_birth: string | null;
    blood_group: string | null; emergency_phone: string | null; license_number: string | null;
    is_admin: boolean | null;
  };

  const missing: CardRequirement[] = [];
  if (!p.avatar_url)              missing.push("photo");
  if (!p.full_name?.trim())       missing.push("fullName");
  if (!p.date_of_birth)           missing.push("dateOfBirth");
  if (!p.blood_group?.trim())     missing.push("bloodGroup");
  if (!p.emergency_phone?.trim()) missing.push("emergencyPhone");
  if (!p.license_number?.trim())  missing.push("licenseNumber");

  if (missing.length) {
    return { accessCode: null, missing, error: null };
  }

  // One live card per account. A rejected one does not block a fresh attempt,
  // which is the whole point of rejecting rather than deleting.
  const { data: existing } = await admin
    .from("member_cards")
    .select("id, status, access_code")
    .eq("user_id", user.id)
    .neq("status", "rejected")
    .maybeSingle();

  if (existing) {
    const e = existing as { status: string; access_code: string };
    return {
      accessCode: e.access_code,
      missing: [],
      error: e.status === "approved"
        ? "You already have a membership card."
        : "Your card request is already with the committee.",
    };
  }

  // A committee member is the person who would approve this. Queuing their own
  // card for their own approval is a loop with one participant, so theirs is
  // issued on the spot, card number and all.
  const selfIssue = !!p.is_admin;

  let cardNumber: string | null = null;
  let validUntil: string | null = null;

  if (selfIssue) {
    const { data: settings } = await admin
      .from("card_settings").select("validity_years").eq("id", 1).single();

    const yearShort = String(new Date().getFullYear()).slice(2);
    const prefix    = `${MEMBER_CARD_PREFIX}-${yearShort}-`;
    const { count } = await admin
      .from("member_cards")
      .select("id", { count: "exact", head: true })
      .like("card_number", `${prefix}%`);

    cardNumber = `${prefix}${String((count ?? 0) + 1).padStart(5, "0")}`;

    const until = new Date();
    until.setFullYear(until.getFullYear() + (settings?.validity_years ?? 2));
    validUntil = until.toISOString().slice(0, 10);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateAccessCode();
    const { error } = await admin.from("member_cards").insert({
      user_id:          user.id,
      access_code:      accessCode,
      full_name:        p.full_name!.trim(),
      photo_url:        p.avatar_url!,
      date_of_birth:    p.date_of_birth!,
      blood_group:      p.blood_group!.trim(),
      emergency_phone:  p.emergency_phone!.trim(),
      license_number:   p.license_number!.trim(),
      // Requesting from your own profile page is the consent - the button says
      // what it does, and the details being submitted are on screen above it.
      consent_accepted: true,
      status:           selfIssue ? "approved" : "pending",
      card_number:      cardNumber,
      valid_until:      validUntil,
      approved_at:      selfIssue ? new Date().toISOString() : null,
    });

    if (!error) {
      revalidatePath(ROUTES.profile);
      revalidatePath(ROUTES.adminMembers);
      return { accessCode, missing: [], error: null };
    }
    if ((error as { code?: string }).code !== "23505") {
      return { accessCode: null, missing: [], error: error.message };
    }
    // 23505 could be the access code, or the one-card-per-account index if the
    // rider double-clicked.
    if ((error as { message?: string }).message?.includes("one_per_user")) {
      return { accessCode: null, missing: [], error: "You already have a card request in progress." };
    }
  }

  return { accessCode: null, missing: [], error: "Could not generate a unique code. Please try again." };
}
