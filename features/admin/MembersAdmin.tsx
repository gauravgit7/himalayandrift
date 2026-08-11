// =============================================================================
// MembersAdmin — review, approve, and reject membership card applications
// 'use client' — modal state, filter tabs
// =============================================================================

"use client";

import { useState, useCallback }    from "react";
import { CheckCircle2, XCircle,
         Clock, Eye, X, Save,
         AlertCircle, Users,
         ChevronDown, ChevronUp }   from "lucide-react";
import { cn }                       from "@/utils/cn";
import {
  approveMemberCard,
  rejectMemberCard,
}                                   from "@/lib/supabase/actions";
import { CardRenderer }             from "@/features/membership/CardRenderer";
import type { MemberCard, CardSettings, BrandLogos } from "@/types";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusChip({ status }: { status: MemberCard["status"] }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
      status === "pending"  && "bg-amber-900/30 text-amber-400 border-amber-800/30",
      status === "approved" && "bg-emerald-900/30 text-emerald-400 border-emerald-800/30",
      status === "rejected" && "bg-tvs-red-950/40 text-tvs-red-400 border-tvs-red-900/30",
    )}>
      {status === "pending"  && <Clock       className="size-2.5" />}
      {status === "approved" && <CheckCircle2 className="size-2.5" />}
      {status === "rejected" && <XCircle     className="size-2.5" />}
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Scaled card preview — embeds CardRenderer inside the 512px modal
// ---------------------------------------------------------------------------

const CARD_SCALE    = 0.62;
const CARD_W        = 300;
const CARD_H        = 472;
const CARD_GAP      = 16;   // gap-4 between cards in compact mode
const LABEL_H       = 20;   // approximate label height above each card

const PREVIEW_W = Math.round((CARD_W * 2 + CARD_GAP) * CARD_SCALE);   // ≈ 382px
const PREVIEW_H = Math.round((CARD_H + LABEL_H)       * CARD_SCALE);   // ≈ 304px

function CardPreview({
  card, settings, brandLogos,
}: {
  card: MemberCard; settings: CardSettings; brandLogos?: BrandLogos | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-semibold text-tvs-charcoal-400 hover:text-tvs-charcoal-100 transition-colors"
      >
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        {open ? "Hide" : "Show"} Card Preview
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-xl" style={{ background: "#0b0f1e" }}>
          {/* Scaled container */}
          <div
            className="mx-auto relative"
            style={{ width: PREVIEW_W, height: PREVIEW_H }}
          >
            <div
              style={{
                position:        "absolute",
                top:             0,
                left:            0,
                transform:       `scale(${CARD_SCALE})`,
                transformOrigin: "top left",
                width:           CARD_W * 2 + CARD_GAP,
              }}
            >
              <CardRenderer
                card={card}
                settings={settings}
                brandLogos={brandLogos}
                mode="compact"
              />
            </div>
          </div>
          {!card.cardNumber && (
            <p className="text-center text-[9px] pb-2"
              style={{ color: "rgba(255,255,255,0.2)" }}>
              Card number assigned on approval
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------

function ApplicationModal({
  card, onClose, onAction, settings, brandLogos,
}: {
  card:       MemberCard;
  onClose:    () => void;
  onAction:   (id: string, action: "approved" | "rejected", extras?: { cardNumber?: string }) => void;
  settings:   CardSettings;
  brandLogos?: BrandLogos | null;
}) {
  const [rejReason, setRejReason] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);

  const fmtDate = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const handleApprove = useCallback(async () => {
    setSaving(true); setError(null);
    const { error: err, cardNumber } = await approveMemberCard(card.id);
    setSaving(false);
    if (err) { setError(err); return; }
    onAction(card.id, "approved", { cardNumber });
    onClose();
  }, [card.id, onAction, onClose]);

  const handleReject = useCallback(async () => {
    if (!rejReason.trim()) { setError("Please provide a rejection reason."); return; }
    setSaving(true); setError(null);
    const { error: err } = await rejectMemberCard(card.id, rejReason);
    setSaving(false);
    if (err) { setError(err); return; }
    onAction(card.id, "rejected");
    onClose();
  }, [card.id, rejReason, onAction, onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-tvs-charcoal-900 border border-tvs-charcoal-700 rounded-2xl shadow-cinematic">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-tvs-charcoal-800">
          <div>
            <h2 className="text-base font-bold text-tvs-charcoal-50">Application Review</h2>
            <p className="text-xs text-tvs-charcoal-500 mt-0.5">
              Submitted {fmtDate(card.createdAt)}
              {card.resubmissionCount > 0 && (
                <span className="ml-2 text-amber-500">
                  · Resubmission #{card.resubmissionCount}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-tvs-charcoal-400 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-800 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Photo + name */}
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.photoUrl}
              alt={card.fullName}
              className="size-20 rounded-xl object-cover object-top border border-tvs-charcoal-700 shrink-0"
            />
            <div>
              <h3 className="text-lg font-black text-tvs-charcoal-50">{card.fullName}</h3>
              <p className="text-sm text-tvs-charcoal-400">{card.cardNumber ?? "No card number yet"}</p>
              <StatusChip status={card.status} />
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Date of Birth",    value: fmtDate(card.dateOfBirth) },
              { label: "Blood Group",      value: card.bloodGroup },
              { label: "Emergency Phone",  value: card.emergencyPhone },
              { label: "License Number",   value: card.licenseNumber },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-lg bg-tvs-charcoal-800/60 border border-tvs-charcoal-700/40">
                <p className="text-[9px] uppercase tracking-wider text-tvs-charcoal-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-tvs-charcoal-100">{value}</p>
              </div>
            ))}
          </div>

          {/* Card preview */}
          <CardPreview card={card} settings={settings} brandLogos={brandLogos} />

          {/* Rejection reason (existing) */}
          {card.status === "rejected" && card.rejectionReason && (
            <div className="p-3 rounded-lg bg-tvs-red-950/40 border border-tvs-red-900/30">
              <p className="text-[9px] uppercase tracking-wider text-tvs-red-600 mb-1">Previous Rejection Reason</p>
              <p className="text-xs text-tvs-red-300">{card.rejectionReason}</p>
            </div>
          )}

          {/* Card number (if approved) */}
          {card.status === "approved" && card.cardNumber && (
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/30">
              <p className="text-[9px] uppercase tracking-wider text-emerald-600 mb-1">Card Number</p>
              <p className="text-sm font-mono font-bold text-emerald-300">{card.cardNumber}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-tvs-red-950/50 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />{error}
            </div>
          )}

          {/* Reject form */}
          {showReject && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-wide">
                Rejection Reason <span className="text-tvs-red-500">*</span>
              </label>
              <textarea
                value={rejReason}
                onChange={(e) => setRejReason(e.target.value)}
                rows={3}
                placeholder="e.g. Photo is unclear, please resubmit with a clearer face photo."
                className="w-full px-3 py-2 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-sm text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600 focus:outline-none focus:border-tvs-red-600 resize-none"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {card.status === "pending" && (
          <div className="flex items-center gap-2 p-5 border-t border-tvs-charcoal-800">
            {!showReject ? (
              <>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-tvs-red-800/60 text-tvs-red-400 hover:bg-tvs-red-950/40 text-sm font-semibold transition-all"
                >
                  <XCircle className="size-4" /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all",
                    saving ? "bg-tvs-charcoal-700 cursor-not-allowed" : "bg-emerald-700 hover:bg-emerald-600",
                  )}
                >
                  {saving
                    ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <CheckCircle2 className="size-4" />}
                  Approve
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowReject(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-tvs-charcoal-700 text-tvs-charcoal-300 hover:text-tvs-charcoal-100 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={saving}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all",
                    saving ? "bg-tvs-charcoal-700 cursor-not-allowed" : "bg-tvs-red-600 hover:bg-tvs-red-500",
                  )}
                >
                  {saving
                    ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save className="size-4" />}
                  Confirm Rejection
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Filter = "all" | "pending" | "approved" | "rejected";

export function MembersAdmin({
  initialCards, settings, brandLogos,
}: {
  initialCards: MemberCard[];
  settings:     CardSettings;
  brandLogos?:  BrandLogos | null;
}) {
  const [cards,    setCards]    = useState(initialCards);
  const [filter,   setFilter]   = useState<Filter>("pending");
  const [viewing,  setViewing]  = useState<MemberCard | null>(null);

  const counts = {
    all:      cards.length,
    pending:  cards.filter((c) => c.status === "pending").length,
    approved: cards.filter((c) => c.status === "approved").length,
    rejected: cards.filter((c) => c.status === "rejected").length,
  };

  const displayed = filter === "all" ? cards : cards.filter((c) => c.status === filter);

  const handleAction = useCallback((id: string, action: "approved" | "rejected", extras?: { cardNumber?: string }) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, status: action, ...(extras ?? {}) } : c));
  }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              filter === f
                ? "border-tvs-red-700/60 bg-tvs-red-950/20"
                : "gradient-card border-tvs-charcoal-700/60 hover:border-tvs-charcoal-500",
            )}
          >
            <p className={cn(
              "text-2xl font-black",
              f === "pending"  && "text-amber-400",
              f === "approved" && "text-emerald-400",
              f === "rejected" && "text-tvs-red-400",
              f === "all"      && "text-tvs-charcoal-50",
            )}>
              {counts[f]}
            </p>
            <p className="text-xs text-tvs-charcoal-500 capitalize mt-0.5">{f}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="size-12 mx-auto mb-4 text-tvs-charcoal-700" />
          <p className="text-sm text-tvs-charcoal-500">No {filter !== "all" ? filter : ""} applications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-4 p-4 rounded-xl gradient-card border border-tvs-charcoal-700/60 hover:border-tvs-charcoal-500 transition-all"
            >
              {/* Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.photoUrl}
                alt={card.fullName}
                className="size-11 rounded-lg object-cover object-top border border-tvs-charcoal-700 shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-tvs-charcoal-50 text-sm truncate">{card.fullName}</p>
                <p className="text-xs text-tvs-charcoal-500">
                  {fmtDate(card.createdAt)}
                </p>
              </div>

              {/* Status + action */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusChip status={card.status} />
                <button
                  type="button"
                  onClick={() => setViewing(card)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 hover:text-tvs-charcoal-100 text-xs font-medium transition-colors"
                >
                  <Eye className="size-3.5" />
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {viewing && (
        <ApplicationModal
          card={viewing}
          onClose={() => setViewing(null)}
          onAction={handleAction}
          settings={settings}
          brandLogos={brandLogos}
        />
      )}
    </>
  );
}
