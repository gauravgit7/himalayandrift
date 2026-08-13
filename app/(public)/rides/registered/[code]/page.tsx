// =============================================================================
// /rides/registered/[code] — registration confirmation and status check
//
// Doubles as the status page: the code is the only thing a signed-out rider
// has, so this URL is what they keep. Deliberately noindex.
// =============================================================================

import type { Metadata } from "next";
import Link              from "next/link";
import { notFound }      from "next/navigation";
import {
  CheckCircle2, Clock, XCircle, CalendarDays, Copy, Wallet,
} from "lucide-react";

import { getRegistrationByAccessCode } from "@/lib/supabase/queries";
import { formatRideDate }              from "@/utils/date";
import { ROUTES, APP_META }            from "@/lib/constants";

export const metadata: Metadata = {
  title:  "Your registration",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ code: string }>;
}

const STATUS_UI = {
  pending: {
    icon:   Clock,
    tone:   "text-amber-300",
    ring:   "bg-amber-950/40 border-amber-800/40",
    title:  "Registration received",
    body:   "An admin will check it shortly. Keep the code below — it is how you check back.",
  },
  approved: {
    icon:   CheckCircle2,
    tone:   "text-emerald-300",
    ring:   "bg-emerald-950/40 border-emerald-800/40",
    title:  "You are on the ride",
    body:   "Your place is confirmed. See you at the start point.",
  },
  rejected: {
    icon:   XCircle,
    tone:   "text-hd-ember-300",
    ring:   "bg-hd-ember-950/40 border-hd-ember-800/40",
    title:  "Registration not accepted",
    body:   "Get in touch with a marshal if you think this is a mistake.",
  },
} as const;

export default async function RegistrationConfirmedPage({ params }: PageProps) {
  const { code } = await params;
  const registration = await getRegistrationByAccessCode(code);
  if (!registration) notFound();

  const ui   = STATUS_UI[registration.status];
  const Icon = ui.icon;

  return (
    <main className="min-h-dvh pt-24 pb-20">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        <div className={`rounded-2xl border p-6 sm:p-8 text-center ${ui.ring}`}>
          <Icon className={`size-12 mx-auto ${ui.tone}`} />
          <h1 className="text-2xl font-black text-hd-ink-50 mt-4">{ui.title}</h1>
          <p className="text-sm text-hd-ink-300 mt-2 leading-relaxed">{ui.body}</p>

          {registration.status === "rejected" && registration.rejectionReason && (
            <p className="text-sm text-hd-ember-300 mt-4 px-4 py-2.5 rounded-lg bg-hd-ember-950/50 border border-hd-ember-800/40">
              {registration.rejectionReason}
            </p>
          )}
        </div>

        {/* ── Reference code ── */}
        <div className="mt-5 gradient-card rounded-2xl border border-hd-ink-700 p-5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 mb-2">
            Your reference code
          </p>
          <p className="text-2xl font-black tracking-[0.2em] text-hd-ember-400 font-mono">
            {registration.accessCode}
          </p>
          <p className="text-[11px] text-hd-ink-500 mt-3 inline-flex items-center gap-1.5">
            <Copy className="size-3" />
            Bookmark this page to check your status later
          </p>
        </div>

        {/* ── What they registered for ── */}
        <div className="mt-5 gradient-card rounded-2xl border border-hd-ink-700 p-5 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-hd-ink-500">
            Registration
          </p>

          {registration.ride && (
            <div>
              <Link
                href={ROUTES.ride(registration.ride.slug || registration.ride.id)}
                className="text-base font-bold text-hd-ink-50 hover:text-hd-ember-400 transition-colors"
              >
                {registration.ride.title}
              </Link>
              <p className="text-sm text-hd-ink-400 mt-1 inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-hd-ink-500" />
                {formatRideDate(registration.ride.startDate)}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-hd-ink-800 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-hd-ink-500">Name</dt>
              <dd className="text-hd-ink-200 mt-0.5">{registration.fullName}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-hd-ink-500">Phone</dt>
              <dd className="text-hd-ink-200 mt-0.5">{registration.phone}</dd>
            </div>
            {registration.pillionCount > 0 && (
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-hd-ink-500">Pillion</dt>
                <dd className="text-hd-ink-200 mt-0.5">{registration.pillionCount}</dd>
              </div>
            )}
            {registration.amountPaid !== null && (
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-hd-ink-500 inline-flex items-center gap-1">
                  <Wallet className="size-3" /> Paid
                </dt>
                <dd className="text-hd-ink-200 mt-0.5">
                  {registration.amountPaid.toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={ROUTES.calendar}
            className="text-sm text-hd-ember-400 hover:text-hd-ember-300 font-semibold transition-colors"
          >
            Back to the {APP_META.name} calendar →
          </Link>
        </div>
      </div>
    </main>
  );
}
