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
import { requireAdmin }   from "@/lib/supabase/guards";
import { priceForRider, pointsEarned } from "@/lib/rides/pricing";
import { parseCode, hrefForCode, CODE_KIND_LABEL, type CodeKind } from "@/lib/codes";
import { ROUTES }         from "@/lib/constants";
import type { AccountCandidate } from "@/lib/membership/link";
import type {
  HomepageContent, RouteData, MemberCard, CardSettings, CardRequirement,
  MembershipTier,
} from "@/types";
import type { PushOptInSettings }          from "@/components/shared/PushOptIn";
import type { PwaSettings }               from "@/features/admin/PwaSettingsAdmin";
import { generateCode }                   from "@/lib/codes";

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
  registrationDiscount: number | null;
  /** Base points for an approved registration, before the tier multiplier. */
  loyaltyPoints:        number;
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
    registration_discount: payload.registrationDiscount && payload.registrationDiscount > 0
                             ? payload.registrationDiscount
                             : null,
    loyalty_points:        Math.max(0, Math.round(payload.loyaltyPoints || 0)),
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

  // The public form is open to signed-out visitors, but a signed-in rider may
  // well be standing on it — from a shared phone, or because they found the
  // page before they found the button on their profile. Their session says
  // whose application this is, so there is nothing left to infer later.
  //
  // The service-role client bypasses guard_member_card_submission, so unlike a
  // raw PostgREST insert this has to establish the owner itself.
  let ownerId: string | null = null;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (user) {
    const { data: live } = await supabase
      .from("member_cards").select("id")
      .eq("user_id", user.id).neq("status", "rejected").maybeSingle();
    // Already holds one: leave this application unowned rather than trip the
    // one-live-card index and lose the submission entirely.
    if (!live) ownerId = user.id;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateCode("member");
    const { error } = await supabase.from("member_cards").insert({
      user_id:          ownerId,
      linked_by:        ownerId ? "self" : null,
      linked_at:        ownerId ? new Date().toISOString() : null,
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

/**
 * Admin — approve a walk-in card application.
 *
 * The only remaining path that issues a card without approving a member,
 * because these applications have no account behind them. Anything attached to
 * an account goes through approveRegistration instead, where the person is the
 * decision and the card merely follows.
 */
export async function approveMemberCard(
  id: string,
): Promise<{ error: string | null; cardNumber?: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { issueCardById } = await import("@/lib/membership/issue");
  const res = await issueCardById(id);

  if (res.error) return { error: res.error };

  revalidatePath(ROUTES.adminMembers);
  revalidatePath(ROUTES.profile);
  return { error: null, cardNumber: res.cardNumber };
}

/** Admin — reject a card application with a reason. */
export async function rejectMemberCard(
  id:     string,
  reason: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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

  // The rider may already have walked up at a ride, filled in a paper-style
  // application while signed out and been given an access code. If the details
  // they just typed match one of those, it is theirs — claim it now rather
  // than let them wonder why their profile says they have no card.
  await claimCardsQuietly(data.user.id, "signUpPublic");

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

  // Cheap safety net: accounts that predate this feature, and riders who filled
  // in the details that make them recognisable somewhere other than the profile
  // form, get their card picked up the next time they sign in.
  await claimCardsQuietly(user.id, "signInPublic");

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

  // This is the moment a half-filled account most often becomes recognisable:
  // the rider has just added their licence number or date of birth, which is
  // exactly the evidence the matcher needs.
  await claimCardsQuietly(user.id, "updateProfile");

  revalidatePath(ROUTES.profile);
  return { error: null };
}

/**
 * Claiming a card is never the reason the caller was invoked, so it must not
 * be able to fail one. A rider who cannot sign in because a background match
 * threw is worse off than one whose card stays unlinked for another day.
 */
async function claimCardsQuietly(userId: string, caller: string): Promise<void> {
  try {
    const { claimOrphanCardsForUser } = await import("@/lib/membership/link");
    const res = await claimOrphanCardsForUser(userId);
    if (res.error) console.error(`[${caller}] card claim failed:`, res.error);
    else if (res.linked) {
      console.info(
        `[${caller}] claimed card ${res.linked.accessCode} for ${userId} ` +
        `at ${Math.round(res.linked.score * 100)}% confidence`,
      );
    }
  } catch (e) {
    console.error(`[${caller}] card claim threw:`, e);
  }
}

// =============================================================================
// Admin — member registration management
// =============================================================================

/**
 * Admin: approve a member — and issue their card in the same movement.
 *
 * There used to be two decisions here and they were the same decision twice.
 * Somebody had to be approved as a member, and then approved again as a
 * cardholder, which produced states nobody could explain to a rider: approved
 * member, card still pending; approved card, account still waiting.
 *
 * So the card is no longer a judgement, it is a consequence. If their profile
 * has the six things a card is printed from, they leave this call holding one.
 * If it does not, they are still approved and the caller is told exactly what
 * is missing — an errand does not get to veto a decision about a person.
 */
export async function approveRegistration(
  id: string,
): Promise<{ error: string | null; cardNumber?: string | null; missing?: CardRequirement[] }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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

  const { issueCardForUser } = await import("@/lib/membership/issue");
  const issued = await issueCardForUser(id);

  revalidatePath(ROUTES.adminMembers);
  revalidatePath(ROUTES.profile);

  // The member IS approved at this point. A card that could not be printed is
  // reported, never raised as an error, because reporting it as one would make
  // the admin think the approval failed and press the button again.
  return {
    error:      null,
    cardNumber: issued.cardNumber,
    missing:    issued.missing,
  };
}

/**
 * Admin: reject a member registration with an optional reason.
 *
 * Takes their pending card request down with it. Leaving it standing would
 * mean a rejected applicant still sitting in a queue waiting to be handed the
 * membership they were just refused.
 */
export async function rejectRegistration(
  id:     string,
  reason: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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

  // Only the request. An already-issued card is revoked deliberately, with its
  // own reason, and never as a side effect of something else.
  await supabase
    .from("member_cards")
    .update({
      status:           "rejected",
      rejection_reason: reason.trim() || "Membership application was not approved.",
      updated_at:       new Date().toISOString(),
    })
    .eq("user_id", id)
    .eq("status", "pending");

  revalidatePath(ROUTES.adminMembers);
  revalidatePath(ROUTES.profile);
  return { error: null };
}

/**
 * Admin: issue a card to a member who has none.
 *
 * The deliberate button behind the approval flow. Members approved before the
 * two queues were merged, and members whose profile was incomplete on the day
 * they were approved, both land here — and both are pressed one at a time by
 * somebody who has looked at the row, rather than swept up by a migration.
 */
export async function issueCardForMember(
  userId: string,
): Promise<{ error: string | null; cardNumber?: string | null; missing?: CardRequirement[] }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { issueCardForUser } = await import("@/lib/membership/issue");
  const res = await issueCardForUser(userId);

  if (!res.error) {
    revalidatePath(ROUTES.adminMembers);
    revalidatePath(ROUTES.profile);
  }
  return { error: res.error, cardNumber: res.cardNumber, missing: res.missing };
}

/** Admin: withdraw a card that was issued. Keeps the row, and the reason. */
export async function revokeMemberCard(
  cardId: string,
  reason: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { revokeCardById } = await import("@/lib/membership/issue");
  const res = await revokeCardById(cardId, reason);

  if (!res.error) {
    revalidatePath(ROUTES.adminMembers);
    revalidatePath(ROUTES.profile);
  }
  return res;
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
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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
  /** Which rider class the registrant says applies to them. An id only — the
   *  price behind it is looked up here, never sent. */
  tierId?:         string | null;
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
    .select(
      "id, slug, status, end_date, registration_open, registration_fee, " +
      "registration_discount, registration_tiers, registration_capacity",
    )
    .eq("id", payload.rideId)
    .maybeSingle();

  if (rideError) return { accessCode: null, error: rideError.message };
  if (!rideRow)  return { accessCode: null, error: "That ride no longer exists." };

  const ride = rideRow as unknown as {
    id: string; slug: string | null; status: string; end_date: string;
    registration_open: boolean;
    registration_fee: number | string | null;
    registration_discount: number | string | null;
    registration_tiers: unknown;
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

  // -- What this rider actually owes ------------------------------------------
  // Resolved here from the ride and the rider's own tier. The form displayed a
  // price; it never sent one, and there is no longer anything for it to pick.
  const sessionClient = await createClient();
  const { data: { user: claimant } } = await sessionClient.auth.getUser();

  const { loadMembershipSettings, loadTierForUser } = await import("@/lib/membership/loyalty");
  const membership = await loadMembershipSettings();
  // A tier is an attribute of the account. A signed-out registrant has none
  // and pays the standard price - which is exactly what a null tier means to
  // the pricing helpers.
  const tier = await loadTierForUser(claimant?.id, membership.tiersEnabled);
  const mine = priceForRider({
    registrationFee:      ride.registration_fee === null ? null : Number(ride.registration_fee),
    registrationDiscount: ride.registration_discount === null ? null : Number(ride.registration_discount),
  }, tier, membership.tiersEnabled);

  const fee    = mine.price;
  const isPaid = mine.isPaid;

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
  // Already looked up above, for the membership-card check.
  const user = claimant;

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
    // Copied, so the roster still reads correctly after a promotion.
    tier_label:             tier?.name ?? null,
    payment_reference:      isPaid ? payload.paymentReference?.trim() || null : null,
    payment_screenshot_url: isPaid ? payload.paymentScreenshotUrl     || null : null,
    status:           "pending",
  };

  // Retry on the (very unlikely) access-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateCode("ride");
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
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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

  // Points land on approval, not on submission. A registration nobody has
  // checked the payment for is a claim, not a ride — paying for it would let
  // an abandoned form mint points.
  await awardForRideRegistration(id);

  await revalidateRideForRegistration(id);
  revalidatePath(ROUTES.adminRegistrations);
  return { error: null };
}

/**
 * Pay a rider for an approved registration.
 *
 * Split out and deliberately silent: an approval that worked must not report
 * failure because the points did. The ledger's own once-per-source index makes
 * repeat calls harmless, so re-approving costs nothing.
 */
async function awardForRideRegistration(registrationId: string): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data } = await admin
    .from("ride_registrations")
    .select("user_id, rides(title, loyalty_points)")
    .eq("id", registrationId)
    .maybeSingle();

  const row = data as {
    user_id: string | null;
    rides: { title: string; loyalty_points: number | null } | null;
  } | null;

  // No account, nothing to credit. A guest registration earns nobody points,
  // which is one more reason the join form is worth merging with sign-up.
  if (!row?.user_id || !row.rides?.loyalty_points) return;

  const {
    loadMembershipSettings, loadTierForUser, awardPoints,
  } = await import("@/lib/membership/loyalty");

  const membership = await loadMembershipSettings();
  const tier = await loadTierForUser(row.user_id, membership.tiersEnabled);

  await awardPoints({
    userId:         row.user_id,
    basePoints:     row.rides.loyalty_points,
    tier,
    tiersEnabled:   membership.tiersEnabled,
    loyaltyEnabled: membership.loyaltyEnabled,
    reason:         row.rides.title,
    sourceType:     "ride",
    sourceId:       registrationId,
  });
}

/** Admin: reject a ride registration, which frees its seat. */
export async function rejectRideRegistration(
  id:     string,
  reason: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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

  // Approving and then rejecting has to take the points back, or an admin
  // correcting themselves leaves a rider paid for a ride they are not on.
  // A negative row, not a delete: the history has to stay reconcilable.
  const { data: reg } = await supabase
    .from("ride_registrations").select("user_id").eq("id", id).maybeSingle();
  const riderId = (reg as { user_id?: string | null } | null)?.user_id;
  if (riderId) {
    const { reversePoints } = await import("@/lib/membership/loyalty");
    await reversePoints({
      userId: riderId, sourceType: "ride", sourceId: id,
      reason: "Registration withdrawn",
    });
  }

  await revalidateRideForRegistration(id);
  revalidatePath(ROUTES.adminRegistrations);
  return { error: null };
}

/** Admin: attach an internal note to a registration. */
export async function updateRideRegistrationNotes(
  id:    string,
  notes: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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
  const denied = await requireAdmin();
  if (denied) return { error: denied };

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

// =============================================================================
// Anthem tracks — the song library
// =============================================================================

/** Lyrics are stored as { t, text } so a timestamp can never drift away from
 *  its own line when lines are added or reordered. Blank lines are KEPT: they
 *  are the stanza breaks, and dropping them reflows the song into one block. */
function packLyrics(lyrics: { time: number | null; text: string }[]) {
  const trimmed = [...lyrics];
  while (trimmed.length && !trimmed[0].text.trim())                  trimmed.shift();
  while (trimmed.length && !trimmed[trimmed.length - 1].text.trim()) trimmed.pop();
  return trimmed.map((l) => ({
    t: typeof l.time === "number" && Number.isFinite(l.time) && l.time >= 0
      ? Math.round(l.time * 100) / 100     // centiseconds is plenty for singing
      : null,
    text: l.text.trim(),
  }));
}

function revalidateMusic() {
  revalidatePath(ROUTES.adminSettings);
  revalidatePath("/home");
  revalidatePath("/", "layout");   // the player lives in the root layout
}

export interface AnthemTrackPayload {
  id?:       string;
  title:     string;
  audioUrl:  string;
  credits?:  string | null;
  coverUrl?: string | null;
  lyrics:    { time: number | null; text: string }[];
  isAnthem:  boolean;
  isActive:  boolean;
}

/** Admin: create or update one song. */
export async function saveAnthemTrack(
  payload: AnthemTrackPayload,
): Promise<{ id: string | null; error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { id: null, error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  if (!payload.audioUrl) {
    return { id: null, error: "Upload the audio file first — a track needs something to play." };
  }

  // At most one anthem, enforced by a partial unique index. Clearing the old
  // one first turns what would be a constraint violation into a handover.
  if (payload.isAnthem) {
    await admin.from("anthem_tracks").update({ is_anthem: false })
      .eq("is_anthem", true)
      .neq("id", payload.id ?? "00000000-0000-0000-0000-000000000000");
  }

  const row = {
    title:     payload.title.trim() || "Untitled",
    audio_url: payload.audioUrl,
    credits:   payload.credits?.trim() || null,
    cover_url: payload.coverUrl || null,
    lyrics:    packLyrics(payload.lyrics),
    is_anthem: payload.isAnthem,
    is_active: payload.isActive,
  };

  if (payload.id) {
    const { error } = await admin.from("anthem_tracks").update(row).eq("id", payload.id);
    if (error) return { id: null, error: error.message };
    revalidateMusic();
    return { id: payload.id, error: null };
  }

  // New tracks go to the end of the list rather than the top: the running order
  // is the club's, and a new upload should not jump the queue.
  const { data: last } = await admin
    .from("anthem_tracks").select("sort_order")
    .order("sort_order", { ascending: false }).limit(1).maybeSingle();

  const { data, error } = await admin
    .from("anthem_tracks")
    .insert({ ...row, sort_order: ((last as { sort_order?: number } | null)?.sort_order ?? 0) + 1 })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  revalidateMusic();
  return { id: (data as { id: string }).id, error: null };
}

/** Admin: remove a song from the library. */
export async function deleteAnthemTrack(id: string): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient().from("anthem_tracks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMusic();
  return { error: null };
}

/** Admin: set the running order from the list as it now reads on screen. */
export async function reorderAnthemTracks(ids: string[]): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  for (let i = 0; i < ids.length; i++) {
    const { error } = await admin
      .from("anthem_tracks").update({ sort_order: i }).eq("id", ids[i]);
    if (error) return { error: error.message };
  }
  revalidateMusic();
  return { error: null };
}

/** Admin: the master switch for whether the player appears on the site. */
export async function setAnthemEnabled(enabled: boolean): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient()
    .from("anthem_settings")
    .upsert({ id: 1, is_enabled: enabled, updated_at: new Date().toISOString() });

  if (error) return { error: error.message };
  revalidateMusic();
  return { error: null };
}

// =============================================================================
// Membership programme
// =============================================================================

export async function saveMembershipSettings(settings: {
  tiersEnabled: boolean; loyaltyEnabled: boolean; pointsLabel: string;
}): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient().from("membership_settings").upsert({
    id:              1,
    tiers_enabled:   settings.tiersEnabled,
    loyalty_enabled: settings.loyaltyEnabled,
    points_label:    settings.pointsLabel.trim() || "points",
    updated_at:      new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  revalidatePath(ROUTES.adminMembers);
  return { error: null };
}

export interface MembershipTierPayload {
  id?:             string;
  name:            string;
  description?:    string | null;
  discountPercent: number;
  rewardFactor:    number;
  colour?:         string | null;
  isDefault:       boolean;
  isActive:        boolean;
}

export async function saveMembershipTier(
  payload: MembershipTierPayload,
): Promise<{ id: string | null; error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { id: null, error: denied };

  const name = payload.name.trim();
  if (!name) return { id: null, error: "A tier needs a name." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // At most one default, enforced by a partial unique index. Clearing the old
  // one first turns what would be a constraint violation into a handover.
  if (payload.isDefault) {
    await admin.from("membership_tiers").update({ is_default: false })
      .eq("is_default", true)
      .neq("id", payload.id ?? "00000000-0000-0000-0000-000000000000");
  }

  const row = {
    name,
    slug,
    description:      payload.description?.trim() || null,
    discount_percent: Math.min(Math.max(Math.round(payload.discountPercent), 0), 90),
    reward_factor:    Math.max(0, Number(payload.rewardFactor) || 1),
    colour:           payload.colour?.trim() || null,
    is_default:       payload.isDefault,
    is_active:        payload.isActive,
  };

  if (payload.id) {
    const { error } = await admin.from("membership_tiers").update(row).eq("id", payload.id);
    if (error) return { id: null, error: error.message };
    revalidatePath("/", "layout");
    return { id: payload.id, error: null };
  }

  const { data: last } = await admin
    .from("membership_tiers").select("sort_order")
    .order("sort_order", { ascending: false }).limit(1).maybeSingle();

  const { data, error } = await admin
    .from("membership_tiers")
    .insert({ ...row, sort_order: ((last as { sort_order?: number } | null)?.sort_order ?? 0) + 1 })
    .select("id").single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { id: null, error: "A tier with that name already exists." };
    }
    return { id: null, error: error.message };
  }
  revalidatePath("/", "layout");
  return { id: (data as { id: string }).id, error: null };
}

export async function deleteMembershipTier(id: string): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  // profiles.tier_id is ON DELETE SET NULL, so members on this tier fall back
  // to the default rather than losing their account.
  const { error } = await createAdminClient()
    .from("membership_tiers").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

/** Admin: put one member on a tier. The only way a tier is ever assigned —
 *  there is deliberately no engine that promotes people automatically. */
export async function assignMemberTier(
  userId: string, tierId: string | null,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient()
    .from("profiles").update({ tier_id: tierId }).eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.adminMembers);
  revalidatePath(ROUTES.profile);
  return { error: null };
}

/** Admin: hand out or take back points by hand. The reason is shown to the
 *  rider in their history, so it is written for them. */
export async function adjustPoints(
  userId: string, points: number, reason: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const n = Math.round(points);
  if (!n) return { error: "Enter a number of points, positive or negative." };
  if (!reason.trim()) return { error: "Give a reason — the rider sees it." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient().from("loyalty_ledger").insert({
    user_id: userId, points: n, base_points: Math.abs(n), factor: 1,
    reason: reason.trim(), source_type: "manual", source_id: null,
  });

  if (error) return { error: error.message };
  revalidatePath(ROUTES.adminMembers);
  revalidatePath(ROUTES.profile);
  return { error: null };
}

// =============================================================================
// Reference code lookup
// =============================================================================

/**
 * Public — find out what a reference code belongs to, and where to send its
 * holder.
 *
 * Resolved here rather than by pushing straight to the destination, so a
 * mistyped code produces "we cannot find that" on the form the rider is already
 * looking at, instead of a 404 page that cannot tell them whether they got the
 * code wrong or the thing has been deleted.
 *
 * Uses the service role: ride registrations and shop orders are deliberately
 * not publicly readable, and this needs to answer "does it exist" without
 * opening either of them up.
 */
export async function resolveCode(raw: string): Promise<{
  href:  string | null;
  kind:  CodeKind | null;
  error: string | null;
}> {
  const parsed = parseCode(raw);
  if (!parsed) {
    return {
      href: null, kind: null,
      error: "That does not look like one of our codes. They look like HD-AB12CD, HD-R-AB12CD or HDS-AB12CD.",
    };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const table = parsed.kind === "ride"  ? "ride_registrations"
              : parsed.kind === "order" ? "shop_orders"
              : "member_cards";

  const { data, error } = await admin
    .from(table).select("id").eq("access_code", parsed.code).maybeSingle();

  if (error) return { href: null, kind: null, error: "Could not check that just now. Try again in a moment." };
  if (!data) {
    return {
      href: null, kind: parsed.kind,
      error: `No ${CODE_KIND_LABEL[parsed.kind].toLowerCase()} found for ${parsed.code}. Check the code and try again.`,
    };
  }

  return { href: hrefForCode(parsed), kind: parsed.kind, error: null };
}

// =============================================================================
// Shop
// =============================================================================

/** The price a rider actually pays for one unit, after the product's discount
 *  and any size surcharge. One function so the card, the basket, the checkout
 *  and the stored order line can never disagree about it. */
function unitPriceOf(
  price: number, discountPercent: number, priceDelta: number,
): number {
  const discounted = price * (1 - Math.min(Math.max(discountPercent, 0), 90) / 100);
  return Math.round((discounted + priceDelta) * 100) / 100;
}

export interface ProductPayload {
  id?:               string;
  name:              string;
  slug:              string;
  shortDescription?: string | null;
  description?:      string | null;
  category:          string;
  price:             number;
  discountPercent:   number;
  imageUrls:         string[];
  stock:             number | null;
  loyaltyPoints:     number;
  isActive:          boolean;
  isFeatured:        boolean;
  variants: { id?: string; label: string; priceDelta: number; stock: number; isActive: boolean }[];
}

/** Admin: create or update a product together with its sizes. */
export async function saveProduct(
  payload: ProductPayload,
): Promise<{ id: string | null; error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { id: null, error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const slug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) return { id: null, error: "A product needs a web address (slug)." };

  const row = {
    name:              payload.name.trim(),
    slug,
    short_description: payload.shortDescription?.trim() || null,
    description:       payload.description?.trim() || null,
    category:          payload.category.trim() || "Merch",
    price:             payload.price,
    discount_percent:  Math.min(Math.max(Math.round(payload.discountPercent), 0), 90),
    image_urls:        payload.imageUrls,
    // Product-level stock is meaningless once sizes exist, and leaving a stale
    // number behind invites someone to read it later and believe it.
    stock:             payload.variants.length ? null : payload.stock,
    loyalty_points:    Math.max(0, Math.round(payload.loyaltyPoints || 0)),
    is_active:         payload.isActive,
    is_featured:       payload.isFeatured,
  };

  let productId = payload.id ?? null;

  if (productId) {
    const { error } = await admin.from("products").update(row).eq("id", productId);
    if (error) return { id: null, error: error.message };
  } else {
    const { data, error } = await admin.from("products").insert(row).select("id").single();
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return { id: null, error: "Another product already uses that web address." };
      }
      return { id: null, error: error.message };
    }
    productId = (data as { id: string }).id;
  }

  // Variants are replaced wholesale rather than diffed. Deleting one that has
  // been ordered is safe: shop_order_items nulls the reference and keeps the
  // label it recorded at the time.
  const { data: existing } = await admin
    .from("product_variants").select("id").eq("product_id", productId);
  const keep = new Set(payload.variants.map((v) => v.id).filter(Boolean));
  const drop = ((existing ?? []) as { id: string }[])
    .filter((v) => !keep.has(v.id)).map((v) => v.id);
  if (drop.length) await admin.from("product_variants").delete().in("id", drop);

  for (let i = 0; i < payload.variants.length; i++) {
    const v = payload.variants[i];
    const vRow = {
      product_id:  productId,
      label:       v.label.trim(),
      price_delta: v.priceDelta,
      stock:       Math.max(0, Math.round(v.stock)),
      sort_order:  i,
      is_active:   v.isActive,
    };
    const { error } = v.id
      ? await admin.from("product_variants").update(vRow).eq("id", v.id)
      : await admin.from("product_variants").insert(vRow);
    if (error) return { id: productId, error: `Size "${v.label}": ${error.message}` };
  }

  revalidatePath("/shop");
  revalidatePath(`/shop/${slug}`);
  revalidatePath("/admin/shop");
  return { id: productId, error: null };
}

/** Admin: remove a product. Its order lines survive, holding the name. */
export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient().from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/shop");
  revalidatePath("/admin/shop");
  return { error: null };
}

/** Admin: adjust one size's stock without opening the whole product form —
 *  which is what you want standing over a box counting shirts. */
export async function setVariantStock(
  variantId: string, stock: number,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient()
    .from("product_variants")
    .update({ stock: Math.max(0, Math.round(stock)) })
    .eq("id", variantId);

  if (error) return { error: error.message };
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
  return { error: null };
}

export async function saveShopSettings(
  settings: { isEnabled: boolean; announcement: string; deliveryNote: string },
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient().from("shop_settings").upsert({
    id:            1,
    is_enabled:    settings.isEnabled,
    announcement:  settings.announcement.trim(),
    delivery_note: settings.deliveryNote.trim(),
    updated_at:    new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/shop");
  revalidatePath("/", "layout");
  return { error: null };
}

// ── Orders ─────────────────────────────────────────────────────────────────

export interface ShopOrderPayload {
  lines: { productId: string; variantId: string | null; quantity: number }[];
  fullName:        string;
  phone:           string;
  email?:          string | null;
  deliveryAddress?: string | null;
  notes?:          string | null;
  paymentReference?:     string | null;
  paymentScreenshotUrl?: string | null;
}

/**
 * Public — place an order.
 *
 * Every price and every stock check is re-read from the database here. The
 * basket in the browser carries ids and quantities and nothing else, so a
 * tampered payload cannot buy a jacket for one rupee, and a basket left open
 * for a week cannot check out at last week's price.
 */
export async function submitShopOrder(
  payload: ShopOrderPayload,
): Promise<{ accessCode: string | null; error: string | null }> {
  if (!payload.lines.length) return { accessCode: null, error: "Your basket is empty." };
  if (!payload.fullName.trim() || !payload.phone.trim()) {
    return { accessCode: null, error: "Name and phone number are both needed." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: shopRow } = await admin
    .from("shop_settings").select("is_enabled").eq("id", 1).maybeSingle();
  if (!(shopRow as { is_enabled?: boolean } | null)?.is_enabled) {
    return { accessCode: null, error: "The shop is closed at the moment." };
  }

  const productIds = [...new Set(payload.lines.map((l) => l.productId))];
  const { data: productData, error: productError } = await admin
    .from("products").select("*, product_variants(*)").in("id", productIds);
  if (productError) return { accessCode: null, error: productError.message };

  const products = new Map(
    ((productData ?? []) as {
      id: string; name: string; price: number | string; discount_percent: number;
      is_active: boolean; stock: number | null;
      product_variants: { id: string; label: string; price_delta: number | string; stock: number; is_active: boolean }[] | null;
    }[]).map((p) => [p.id, p]),
  );

  const items: {
    product_id: string; variant_id: string | null; product_name: string;
    variant_label: string | null; unit_price: number; quantity: number; line_total: number;
  }[] = [];
  let subtotal = 0;
  let discountTotal = 0;

  for (const line of payload.lines) {
    const p = products.get(line.productId);
    if (!p || !p.is_active) {
      return { accessCode: null, error: "One of the items is no longer available." };
    }
    const qty = Math.max(1, Math.round(line.quantity));
    const listPrice = Number(p.price) || 0;
    const variant = line.variantId
      ? (p.product_variants ?? []).find((v) => v.id === line.variantId)
      : undefined;

    if (line.variantId && (!variant || !variant.is_active)) {
      return { accessCode: null, error: `That size of ${p.name} is no longer available.` };
    }

    // Stock is checked but NOT decremented. A pending order is a claim, not a
    // sale — the committee still has to see the payment — and silently holding
    // stock for orders that are never paid for empties the shop on paper.
    const available = variant ? variant.stock : p.stock;
    if (available !== null && available !== undefined && qty > available) {
      return {
        accessCode: null,
        error: available === 0
          ? `${p.name}${variant ? ` (${variant.label})` : ""} has sold out.`
          : `Only ${available} left of ${p.name}${variant ? ` (${variant.label})` : ""}.`,
      };
    }

    const delta = variant ? Number(variant.price_delta) || 0 : 0;
    const unit  = unitPriceOf(listPrice, p.discount_percent ?? 0, delta);
    const full  = Math.round((listPrice + delta) * 100) / 100;

    subtotal      += full * qty;
    discountTotal += (full - unit) * qty;

    items.push({
      product_id:    p.id,
      variant_id:    variant?.id ?? null,
      product_name:  p.name,
      variant_label: variant?.label ?? null,
      unit_price:    unit,
      quantity:      qty,
      line_total:    Math.round(unit * qty * 100) / 100,
    });
  }

  const total = Math.round((subtotal - discountTotal) * 100) / 100;

  // A signed-in buyer's order is attached to their account so it shows on
  // their profile without them needing to keep the code.
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();

  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateCode("order");
    const { data: order, error } = await admin.from("shop_orders").insert({
      user_id:                user?.id ?? null,
      access_code:            accessCode,
      full_name:              payload.fullName.trim(),
      phone:                  payload.phone.trim(),
      email:                  payload.email?.trim() || user?.email || null,
      delivery_address:       payload.deliveryAddress?.trim() || null,
      notes:                  payload.notes?.trim() || null,
      subtotal:               Math.round(subtotal * 100) / 100,
      discount_total:         Math.round(discountTotal * 100) / 100,
      total,
      payment_reference:      payload.paymentReference?.trim() || null,
      payment_screenshot_url: payload.paymentScreenshotUrl || null,
      status:                 "pending",
    }).select("id").single();

    if (error) {
      if ((error as { code?: string }).code === "23505") continue;  // code clash
      return { accessCode: null, error: error.message };
    }

    const orderId = (order as { id: string }).id;
    const { error: itemError } = await admin
      .from("shop_order_items")
      .insert(items.map((i) => ({ ...i, order_id: orderId })));

    if (itemError) {
      // An order with no lines is worse than no order: the committee would see
      // a payment for nothing and have no way to tell what it was for.
      await admin.from("shop_orders").delete().eq("id", orderId);
      return { accessCode: null, error: itemError.message };
    }

    revalidatePath("/admin/shop");
    return { accessCode, error: null };
  }

  return { accessCode: null, error: "Could not generate a unique code. Please try again." };
}

/**
 * Admin: approve an order, which is also the moment stock comes off the shelf.
 * Doing it here rather than at submission means unpaid orders never quietly
 * empty the shop, and the count only moves when a human has seen the payment.
 */
export async function approveShopOrder(id: string): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: order, error: fetchError } = await admin
    .from("shop_orders").select("id, status, shop_order_items(*)").eq("id", id).maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!order)     return { error: "Order not found." };

  const row = order as {
    status: string;
    shop_order_items: { product_id: string | null; variant_id: string | null; quantity: number }[] | null;
  };
  if (row.status === "approved" || row.status === "fulfilled") {
    return { error: "That order is already approved." };
  }

  for (const item of row.shop_order_items ?? []) {
    if (item.variant_id) {
      const { data: v } = await admin
        .from("product_variants").select("stock").eq("id", item.variant_id).maybeSingle();
      const stock = (v as { stock?: number } | null)?.stock;
      if (typeof stock === "number") {
        await admin.from("product_variants")
          .update({ stock: Math.max(0, stock - item.quantity) })
          .eq("id", item.variant_id);
      }
    } else if (item.product_id) {
      const { data: p } = await admin
        .from("products").select("stock").eq("id", item.product_id).maybeSingle();
      const stock = (p as { stock?: number | null } | null)?.stock;
      // null means this product does not track stock, so leave it alone.
      if (typeof stock === "number") {
        await admin.from("products")
          .update({ stock: Math.max(0, stock - item.quantity) })
          .eq("id", item.product_id);
      }
    }
  }

  const { error } = await admin.from("shop_orders")
    .update({ status: "approved", approved_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", id);
  if (error) return { error: error.message };

  // Same moment as the stock coming off: a human has seen the payment.
  await awardForShopOrder(id);

  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  return { error: null };
}

/**
 * Pay a buyer for an approved order. Points are summed across the lines, each
 * item's own value multiplied by how many of it were bought, so a jacket worth
 * 200 and two stickers worth 10 each pay 220 before the tier factor.
 */
async function awardForShopOrder(orderId: string): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data } = await admin
    .from("shop_orders")
    .select("user_id, shop_order_items(quantity, products(name, loyalty_points))")
    .eq("id", orderId)
    .maybeSingle();

  const row = data as {
    user_id: string | null;
    shop_order_items: {
      quantity: number;
      products: { name: string; loyalty_points: number | null } | null;
    }[] | null;
  } | null;

  if (!row?.user_id) return;   // a signed-out buyer has nowhere to put points

  const base = (row.shop_order_items ?? []).reduce(
    (n, i) => n + (i.products?.loyalty_points ?? 0) * (i.quantity ?? 1), 0,
  );
  if (base <= 0) return;

  const {
    loadMembershipSettings, loadTierForUser, awardPoints,
  } = await import("@/lib/membership/loyalty");

  const membership = await loadMembershipSettings();
  const tier = await loadTierForUser(row.user_id, membership.tiersEnabled);

  await awardPoints({
    userId:         row.user_id,
    basePoints:     base,
    tier,
    tiersEnabled:   membership.tiersEnabled,
    loyaltyEnabled: membership.loyaltyEnabled,
    reason:         "Shop order",
    sourceType:     "order",
    sourceId:       orderId,
  });
}

export async function fulfilShopOrder(id: string): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await createAdminClient().from("shop_orders")
    .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/shop");
  return { error: null };
}

export async function rejectShopOrder(
  id: string, reason: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };
  if (!reason.trim()) return { error: "Give a reason — the buyer sees it." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { error } = await admin.from("shop_orders")
    .update({ status: "rejected", rejection_reason: reason.trim() })
    .eq("id", id);

  if (error) return { error: error.message };

  const { data: order } = await admin
    .from("shop_orders").select("user_id").eq("id", id).maybeSingle();
  const buyerId = (order as { user_id?: string | null } | null)?.user_id;
  if (buyerId) {
    const { reversePoints } = await import("@/lib/membership/loyalty");
    await reversePoints({
      userId: buyerId, sourceType: "order", sourceId: id,
      reason: "Order cancelled",
    });
  }

  revalidatePath("/admin/shop");
  return { error: null };
}

/**
 * Public — re-price a basket against live data.
 *
 * The basket holds ids and quantities; this is what turns it into money and
 * availability. Called on every basket render so a sold-out size is caught on
 * the page rather than at the end of the checkout.
 */
export async function priceBasket(
  lines: { productId: string; variantId: string | null; quantity: number }[],
): Promise<{
  lines: {
    productId: string; variantId: string | null; name: string; variantLabel: string | null;
    imageUrl: string | null; unitPrice: number; fullPrice: number; quantity: number;
    lineTotal: number; available: number | null; problem: string | null;
  }[];
  subtotal: number; discountTotal: number; total: number;
}> {
  const empty = { lines: [], subtotal: 0, discountTotal: 0, total: 0 };
  if (!lines.length) return empty;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data } = await admin
    .from("products").select("*, product_variants(*)")
    .in("id", [...new Set(lines.map((l) => l.productId))]);

  const products = new Map(
    ((data ?? []) as {
      id: string; name: string; price: number | string; discount_percent: number;
      image_urls: string[] | null; is_active: boolean; stock: number | null;
      product_variants: { id: string; label: string; price_delta: number | string; stock: number; is_active: boolean }[] | null;
    }[]).map((p) => [p.id, p]),
  );

  const out: Awaited<ReturnType<typeof priceBasket>>["lines"] = [];
  let subtotal = 0, discountTotal = 0;

  for (const line of lines) {
    const p = products.get(line.productId);
    if (!p) continue;   // deleted since it went in the basket
    const variant = line.variantId
      ? (p.product_variants ?? []).find((v) => v.id === line.variantId)
      : undefined;

    const qty       = Math.max(1, Math.round(line.quantity));
    const delta     = variant ? Number(variant.price_delta) || 0 : 0;
    const listPrice = Number(p.price) || 0;
    const fullPrice = Math.round((listPrice + delta) * 100) / 100;
    const unitPrice = unitPriceOf(listPrice, p.discount_percent ?? 0, delta);
    const available = variant ? variant.stock : p.stock;

    let problem: string | null = null;
    if (!p.is_active)                       problem = "No longer available";
    else if (line.variantId && !variant)    problem = "That size has gone";
    else if (variant && !variant.is_active) problem = "That size has gone";
    else if (available === 0)               problem = "Sold out";
    else if (available !== null && available !== undefined && qty > available) {
      problem = `Only ${available} left`;
    }

    if (!problem) {
      subtotal      += fullPrice * qty;
      discountTotal += (fullPrice - unitPrice) * qty;
    }

    out.push({
      productId:    p.id,
      variantId:    variant?.id ?? null,
      name:         p.name,
      variantLabel: variant?.label ?? null,
      imageUrl:     p.image_urls?.[0] ?? null,
      unitPrice, fullPrice, quantity: qty,
      lineTotal:    Math.round(unitPrice * qty * 100) / 100,
      available:    available ?? null,
      problem,
    });
  }

  return {
    lines: out,
    subtotal:      Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    total:         Math.round((subtotal - discountTotal) * 100) / 100,
  };
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

  const { CARD_SOURCE_COLUMNS, missingCardFields } =
    await import("@/lib/membership/issue");

  const { data: row, error: profileError } = await admin
    .from("profiles")
    .select(CARD_SOURCE_COLUMNS)
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

  const missing = missingCardFields(p);
  if (missing.length) {
    return { accessCode: null, missing, error: null };
  }

  // One live card per account. Neither a rejected application nor a revoked
  // card blocks a fresh attempt — which is the whole point of keeping those
  // rows rather than deleting them.
  const { data: existing } = await admin
    .from("member_cards")
    .select("id, status, access_code")
    .eq("user_id", user.id)
    .not("status", "in", "(rejected,revoked)")
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

  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateCode("member");
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
      // No inference involved — the rider was signed in when they asked.
      linked_by:        "self",
      linked_at:        new Date().toISOString(),
      status:           "pending",
    });

    if (!error) {
      // A committee member is the person who would approve this. Queuing their
      // own card for their own approval is a loop with one participant, so
      // theirs is issued on the spot — through the same issuer as everyone
      // else's, so it gets its number from the same place.
      if (p.is_admin) await (await import("@/lib/membership/issue")).issueCardForUser(user.id);

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

// =============================================================================
// Admin — merging walk-in applications into accounts
//
// The automatic matcher deliberately refuses the close calls: two applications
// that both look like one account are left alone rather than guessed between.
// These three actions are where a human resolves what it would not.
// =============================================================================

/** Admin: rank every account by how much it looks like this application. */
export async function suggestAccountsForCard(
  cardId: string,
  query?: string,
): Promise<{
  linked:     AccountCandidate | null;
  candidates: AccountCandidate[];
  error:      string | null;
}> {
  const denied = await requireAdmin();
  if (denied) return { linked: null, candidates: [], error: denied };

  const { candidatesForCard } = await import("@/lib/membership/link");
  return candidatesForCard(cardId, query);
}

/** Admin: attach an application to an account by hand. */
export async function mergeCardIntoAccount(
  cardId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { linkCardToAccount } = await import("@/lib/membership/link");
  const res = await linkCardToAccount(cardId, userId);

  if (!res.error) {
    revalidatePath(ROUTES.adminMembers);
    revalidatePath(ROUTES.profile);
  }
  return res;
}

/** Admin: detach an application linked to the wrong account. */
export async function unlinkCardFromAccount(
  cardId: string,
): Promise<{ error: string | null }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const { unlinkCard } = await import("@/lib/membership/link");
  const res = await unlinkCard(cardId);

  if (!res.error) {
    revalidatePath(ROUTES.adminMembers);
    revalidatePath(ROUTES.profile);
  }
  return res;
}
