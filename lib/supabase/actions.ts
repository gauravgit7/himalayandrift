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
import type { HomepageContent, RouteData, MemberCard, CardSettings } from "@/types";
import type { PushOptInSettings }          from "@/components/shared/PushOptIn";
import type { PwaSettings }               from "@/features/admin/PwaSettingsAdmin";
import { MEMBER_CARD_PREFIX }             from "@/lib/constants";

// ---------------------------------------------------------------------------
// Auth - Sign In
// ---------------------------------------------------------------------------

export async function signIn(
  email:    string,
  password: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath(ROUTES.admin, "layout");
  redirect(ROUTES.admin);
}

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
  bannerImageUrl:   string | null;
  routeData:        RouteData | null;
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
    banner_image_url:  payload.bannerImageUrl          ?? null,
    route_data:        payload.routeData               ?? null,
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

/** Generate a random 6-char access code: TVS-XXXXXX */
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TVS-${suffix}`;
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
  await admin.from("profiles").upsert({
    id:             data.user.id,
    full_name:      payload.fullName.trim(),
    email:          payload.email.trim(),
    phone:          payload.phone?.trim()  ?? null,
    address:        payload.address?.trim() ?? null,
    bike_model:     payload.bikeModel?.trim() ?? null,
    date_of_birth:  payload.dateOfBirth    ?? null,
    license_number: payload.licenseNumber?.trim() ?? null,
    member_status:  "pending",
  });

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

  // If the signed-in user is an admin, send them to the admin dashboard
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (adminEmailsEnv) {
    const adminEmails = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes((data.user?.email ?? "").toLowerCase())) {
      revalidatePath(ROUTES.admin, "layout");
      redirect(ROUTES.admin);
    }
  }

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
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name:      data.fullName.trim(),
      phone:          data.phone?.trim()   ?? null,
      avatar_url:     data.avatarUrl       ?? null,
      address:        data.address?.trim() ?? null,
      bike_model:     data.bikeModel?.trim() ?? null,
      date_of_birth:  data.dateOfBirth     ?? null,
      license_number: data.licenseNumber?.trim() ?? null,
      updated_at:     new Date().toISOString(),
    })
    .eq("id", user.id);

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
