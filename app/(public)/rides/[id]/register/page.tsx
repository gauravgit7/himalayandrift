// =============================================================================
// /rides/[id]/register — sign up for one ride
//
// Server-rendered so the gate (is registration open? is it full? has the ride
// happened?) is decided before anything is shown. The form itself re-checks on
// submit, because a page can sit open while the last seat goes.
// =============================================================================

import type { Metadata } from "next";
import Link              from "next/link";
import { notFound }      from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Lock, Users, Flag } from "lucide-react";

import {
  getRide, getPaymentSettings, getRideRegistrationCount, getProfile, getMembershipSettings, getMembershipTiers, resolveTier,
} from "@/lib/supabase/queries";
import {
  resolvePaymentDetails, seatsRemaining, registrationClosedReason,
} from "@/utils/ride";
import { formatRideDateRange } from "@/utils/date";
import { RegistrationForm, type RegistrationPrefill } from "@/features/rides/RegistrationForm";
import { ROUTES }           from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const ride   = await getRide(id);
  if (!ride) return { title: "Ride Not Found" };
  return {
    title:       `Register — ${ride.title}`,
    description: `Register for ${ride.title}.`,
    // A sign-up form has nothing to offer a search engine, and indexing it
    // competes with the ride page itself.
    robots:      { index: false, follow: true },
  };
}

const CLOSED_COPY = {
  not_open:  {
    title: "Registration is not open yet",
    body:  "Sign-ups for this ride have not opened. Keep an eye on the ride page.",
  },
  full:      {
    title: "This ride is full",
    body:  "Every place has been taken. Places sometimes free up, so it is worth checking back.",
  },
  ride_over: {
    title: "This ride has already happened",
    body:  "Registration closed when the ride finished.",
  },
  cancelled: {
    title: "This ride was cancelled",
    body:  "Registration is closed. Check the calendar for what is coming up next.",
  },
} as const;

export default async function RideRegisterPage({ params }: PageProps) {
  const { id } = await params;

  const ride = await getRide(id);
  if (!ride) notFound();

  const [paymentSettings, taken, profile, membership, tiers] = await Promise.all([
    getPaymentSettings(),
    getRideRegistrationCount(ride.id),
    getProfile(),          // null when signed out
    getMembershipSettings(),
    getMembershipTiers(),
  ]);

  const closed  = registrationClosedReason(ride, taken);
  // A signed-out visitor has no tier and sees the standard price. Nobody, at
  // any point, is shown what somebody else would pay.
  const myTier  = membership.tiersEnabled
    ? resolveTier(tiers, profile?.tierId ?? null)
    : null;
  const payment = resolvePaymentDetails(ride, paymentSettings, myTier, membership);
  const left    = seatsRemaining(ride, taken);

  const prefill: RegistrationPrefill | null = profile && {
    fullName:  profile.fullName,
    phone:     profile.phone     ?? "",
    email:     profile.email,
    bikeModel: profile.bikeModel ?? "",
  };

  return (
    <main className="min-h-dvh pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        <Link
          href={ROUTES.ride(ride.slug || ride.id)}
          className="inline-flex items-center gap-1.5 text-sm text-hd-ink-400 hover:text-hd-ink-100 transition-colors mb-6"
        >
          <ArrowLeft className="size-4" /> Back to the ride
        </Link>

        {/* ── Ride summary ── */}
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-hd-ember-500 font-semibold mb-2">
            Ride registration
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-hd-ink-50 leading-tight">
            {ride.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-hd-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-hd-ink-500" />
              {formatRideDateRange(ride.startDate, ride.endDate)}
            </span>
            {ride.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-hd-ink-500" />
                {ride.location}
              </span>
            )}
            {left !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4 text-hd-ink-500" />
                {left} of {ride.registrationCapacity} left
              </span>
            )}
          </div>
        </header>

        {closed ? (
          <div className="gradient-card rounded-2xl border border-hd-ink-700 p-8 text-center">
            <div className="size-12 rounded-full bg-hd-ink-800 flex items-center justify-center mx-auto mb-4">
              {closed === "full"
                ? <Users className="size-5 text-hd-ink-400" />
                : <Lock className="size-5 text-hd-ink-400" />}
            </div>
            <h2 className="text-lg font-bold text-hd-ink-100">
              {CLOSED_COPY[closed].title}
            </h2>
            <p className="text-sm text-hd-ink-400 mt-2 max-w-sm mx-auto leading-relaxed">
              {CLOSED_COPY[closed].body}
            </p>

            {/* An external form is the fallback when the built-in one is off. */}
            {closed === "not_open" && ride.registrationLink && (
              <a
                href={ride.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-colors"
              >
                <Flag className="size-4" /> Open the sign-up form
              </a>
            )}

            <div className="mt-6">
              <Link
                href={ROUTES.calendar}
                className="text-sm text-hd-ember-400 hover:text-hd-ember-300 font-semibold transition-colors"
              >
                See what else is coming up →
              </Link>
            </div>
          </div>
        ) : (
          <RegistrationForm
            rideId={ride.id}
            rideTitle={ride.title}
            payment={payment}
            seatsLeft={left}
            prefill={prefill}
          />
        )}
      </div>
    </main>
  );
}
