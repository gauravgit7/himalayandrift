// =============================================================================
// /validate/[cardNumber] — Public QR validation page
// Accessible to anyone who scans the QR on the card
// =============================================================================

import type { Metadata }       from "next";
import { notFound }            from "next/navigation";
import Link                    from "next/link";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { getMemberCardByCardNumber, getBrandLogos } from "@/lib/supabase/queries";
import { cn }                  from "@/utils/cn";
import { APP_META }            from "@/lib/constants";

interface PageProps {
  params: Promise<{ cardNumber: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cardNumber } = await params;
  return { title: `Validate ${decodeURIComponent(cardNumber)} | TVS Nepal` };
}

export default async function ValidatePage({ params }: PageProps) {
  const { cardNumber } = await params;
  const number = decodeURIComponent(cardNumber).toUpperCase();

  const [card, brandLogos] = await Promise.all([
    getMemberCardByCardNumber(number),
    getBrandLogos(),
  ]);

  if (!card) notFound();

  const isValid   = card.status === "approved";
  const isExpired = card.validUntil
    ? new Date(card.validUntil) < new Date()
    : false;
  const effectivelyValid = isValid && !isExpired;

  const fmtDate = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Status icon */}
        <div className={cn(
          "size-20 rounded-full flex items-center justify-center mx-auto border-2",
          effectivelyValid
            ? "bg-emerald-900/30 border-emerald-700/50"
            : "bg-tvs-red-950/40 border-tvs-red-800/40",
        )}>
          {effectivelyValid
            ? <CheckCircle2 className="size-10 text-emerald-400" />
            : <XCircle      className="size-10 text-tvs-red-400" />}
        </div>

        {/* Status text */}
        <div>
          <h1 className={cn(
            "text-2xl font-black",
            effectivelyValid ? "text-emerald-300" : "text-tvs-red-300",
          )}>
            {effectivelyValid ? "Valid Member" : isExpired ? "Membership Expired" : "Invalid Card"}
          </h1>
          <p className="text-sm text-tvs-charcoal-400 mt-1">{APP_META.name}</p>
        </div>

        {/* Member details card */}
        <div className="rounded-2xl gradient-card border border-tvs-charcoal-700/60 overflow-hidden text-left">

          {/* Photo + name */}
          <div className="flex items-center gap-4 p-5 border-b border-tvs-charcoal-800/60">
            <div
              className="size-16 rounded-full overflow-hidden shrink-0 border-2"
              style={{ borderColor: effectivelyValid ? "#059669" : "#991b1b" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.photoUrl}
                alt={card.fullName}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <p className="font-black text-tvs-charcoal-50 text-lg leading-tight">{card.fullName}</p>
              <p className="text-xs text-tvs-charcoal-500 mt-0.5">{card.chapter} Chapter</p>
            </div>
          </div>

          {/* Details */}
          <div className="p-5 space-y-2.5 text-sm">
            <Row label="Card Number" value={card.cardNumber ?? "—"} mono />
            {card.validUntil && (
              <Row
                label="Valid Through"
                value={fmtDate(card.validUntil)}
                highlight={isExpired ? "expired" : "ok"}
              />
            )}
            {card.approvedAt && (
              <Row label="Issued" value={fmtDate(card.approvedAt)} />
            )}
          </div>
        </div>

        {/* Shield note */}
        <div className="flex items-start gap-2 text-left">
          <ShieldCheck className="size-4 text-tvs-charcoal-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-tvs-charcoal-600 leading-relaxed">
            This page confirms the authenticity of a {APP_META.name} membership card.
            Verified by the {APP_META.name} operations platform.
          </p>
        </div>

        <Link
          href="/"
          className="text-xs text-tvs-charcoal-500 hover:text-tvs-charcoal-300 transition-colors"
        >
          ← TVS Nepal Home
        </Link>
      </div>
    </main>
  );
}

function Row({
  label, value, mono = false,
  highlight,
}: {
  label: string; value: string; mono?: boolean;
  highlight?: "ok" | "expired";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-tvs-charcoal-500 text-xs">{label}</span>
      <span className={cn(
        "font-semibold text-right",
        mono && "font-mono text-xs tracking-wider",
        highlight === "expired" && "text-tvs-red-400",
        highlight === "ok"      && "text-emerald-400",
        !highlight              && "text-tvs-charcoal-100",
      )}>
        {value}
      </span>
    </div>
  );
}
