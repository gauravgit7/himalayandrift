// =============================================================================
// MyMembershipPanel — what /membership shows to someone who is signed in
//
// The apply form on this page was written for a walk-up visitor, and it kept
// being shown to riders who had already been through it: a card holder was
// invited to apply for a card, and a rider whose details were all on file was
// asked to type them again. Neither has anything to do with the form itself —
// the page simply had no idea who was reading it.
//
// So a signed-in rider gets the state they are actually in. The form stays
// exactly as it was for everyone else.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import Link                      from "next/link";
import { CreditCard, Printer, Clock, XCircle,
         AlertCircle, Loader2, UserCog } from "lucide-react";
import { cn }                            from "@/utils/cn";
import { CardRenderer }                  from "@/features/membership/CardRenderer";
import { requestMemberCard }             from "@/lib/supabase/actions";
import { ROUTES, CARD_REQUIREMENT_LABELS } from "@/lib/constants";
import type { MemberCard, CardSettings, BrandLogos, CardRequirement } from "@/types";

interface Props {
  card:       MemberCard | null;
  settings:   CardSettings;
  brandLogos: BrandLogos | null;
  fullName:   string;
  isAdmin:    boolean;
}

export function MyMembershipPanel({
  card: initialCard, settings, brandLogos, fullName, isAdmin,
}: Props) {
  const [card,    setCard]    = useState(initialCard);
  const [busy,    setBusy]    = useState(false);
  const [missing, setMissing] = useState<CardRequirement[]>([]);
  const [error,   setError]   = useState<string | null>(null);

  const request = useCallback(async () => {
    setBusy(true); setError(null); setMissing([]);
    const res = await requestMemberCard();
    setBusy(false);
    if (res.missing.length) { setMissing(res.missing); return; }
    if (res.error)          { setError(res.error); return; }
    // The server has the authoritative row; this is enough to change what the
    // panel says until the page is next fetched.
    setCard((c) => c ?? {
      status: isAdmin ? "approved" : "pending",
      accessCode: res.accessCode ?? "",
    } as MemberCard);
  }, [isAdmin]);

  // ── Has a card ───────────────────────────────────────────────────────────
  if (card?.status === "approved" && card.cardNumber) {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-emerald-400">
            You are a card-carrying member.
          </p>
          <p className="text-xs text-hd-ink-500">
            Card <span className="font-mono text-hd-ember-400">{card.cardNumber}</span>
          </p>
        </div>

        <div className="flex justify-center">
          <CardRenderer card={card} settings={settings} brandLogos={brandLogos} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href={ROUTES.memberCard(card.accessCode)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-hd-ink-800 hover:bg-hd-ink-700 border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-100 transition-colors"
          >
            <Printer className="size-4" /> Download or print
          </Link>
          <Link
            href={ROUTES.profile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
          >
            <UserCog className="size-4" /> Manage in your profile
          </Link>
        </div>
      </div>
    );
  }

  // ── Waiting on the committee ─────────────────────────────────────────────
  if (card?.status === "pending") {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/30 border border-amber-800/30">
          <Clock className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">Your request is in</p>
            <p className="text-xs text-amber-600/90 mt-1 leading-relaxed">
              The committee is checking it. Your card appears here — and on your
              profile — once it is approved.
            </p>
            {card.accessCode && (
              <p className="text-[11px] font-mono text-hd-ink-500 mt-2">{card.accessCode}</p>
            )}
          </div>
        </div>
        <Link
          href={ROUTES.profile}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
        >
          <UserCog className="size-4" /> Go to your profile
        </Link>
      </div>
    );
  }

  // ── No card yet — everything needed is already on file ───────────────────
  return (
    <div className="max-w-md mx-auto space-y-4">
      {card?.status === "rejected" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-hd-ember-950/40 border border-hd-ember-800/40">
          <XCircle className="size-5 text-hd-ember-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-hd-ember-300">Last request was declined</p>
            {card.rejectionReason && (
              <p className="text-xs text-hd-ember-400 mt-1">{card.rejectionReason}</p>
            )}
            <p className="text-xs text-hd-ember-600 mt-1.5">
              Put that right on your profile, then ask again below.
            </p>
          </div>
        </div>
      )}

      <div className="p-5 rounded-2xl gradient-card border border-hd-ink-700 space-y-3">
        <p className="text-sm text-hd-ink-200 leading-relaxed">
          {fullName ? `${fullName}, your` : "Your"} card is built from the details
          already on your account — photo, name, date of birth, blood group,
          emergency contact and licence. Nothing to type again.{" "}
          {isAdmin
            ? "As a committee member, yours is issued on the spot."
            : "One tap sends it to the committee."}
        </p>

        {missing.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/30 space-y-1.5">
            <p className="text-sm font-semibold text-amber-300">
              A few things are still needed
            </p>
            <ul className="text-xs text-amber-600/90 space-y-0.5">
              {missing.map((m) => <li key={m}>· {CARD_REQUIREMENT_LABELS[m]}</li>)}
            </ul>
            <Link
              href={ROUTES.profile}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 pt-1"
            >
              Add them on your profile →
            </Link>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
            <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
            <p className="text-sm text-hd-ember-300">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={request}
          disabled={busy}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all",
            busy
              ? "bg-hd-ink-700 cursor-not-allowed opacity-60"
              : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.98]",
          )}
        >
          {busy
            ? <><Loader2 className="size-4 animate-spin" /> {isAdmin ? "Issuing…" : "Sending…"}</>
            : <><CreditCard className="size-4" />
                {isAdmin ? "Issue my membership card" : "Request my membership card"}</>}
        </button>
      </div>
    </div>
  );
}
