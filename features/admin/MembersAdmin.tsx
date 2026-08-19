// =============================================================================
// MembersAdmin — review, approve, and reject membership card applications
// 'use client' — modal state, filter tabs
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle,
         Clock, Eye, X, Save,
         AlertCircle, Users, Link2, Link2Off,
         Search, UserPlus, Sparkles, User,
         ChevronDown, ChevronUp }   from "lucide-react";
import { cn }                       from "@/utils/cn";
import {
  approveMemberCard,
  rejectMemberCard,
  suggestAccountsForCard,
  mergeCardIntoAccount,
  unlinkCardFromAccount,
}                                   from "@/lib/supabase/actions";
import { CardRenderer }             from "@/features/membership/CardRenderer";
import { FIELD_LABELS }             from "@/lib/membership/identity";
import type { AccountCandidate }    from "@/lib/membership/identity";
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
      status === "rejected" && "bg-hd-ember-950/40 text-hd-ember-400 border-hd-ember-900/30",
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
        className="flex items-center gap-2 text-xs font-semibold text-hd-ink-400 hover:text-hd-ink-100 transition-colors"
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
// Account panel — the merge tool
//
// Most cards never need this: a rider who was signed in when they asked is
// linked from the moment the row exists, and a walk-in application is claimed
// automatically when its applicant signs up. What is left are the cases the
// matcher deliberately would not guess at — two riders who look alike on
// paper, or an applicant whose account shares almost nothing with their form.
// ---------------------------------------------------------------------------

function ScoreBar({ score, confident }: { score: number; confident: boolean }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2 shrink-0" title={`${pct}% match`}>
      <div className="w-14 h-1.5 rounded-full bg-hd-ink-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full", confident ? "bg-emerald-500" : "bg-amber-500/70")}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-bold tabular-nums w-8 text-right",
        confident ? "text-emerald-400" : "text-hd-ink-500",
      )}>
        {pct}%
      </span>
    </div>
  );
}

function CandidateRow({
  c, busy, onLink,
}: {
  c: AccountCandidate; busy: boolean; onLink: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-hd-ink-800/40 border border-hd-ink-700/40">
      {c.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.avatarUrl} alt="" className="size-8 rounded-full object-cover object-top shrink-0" />
      ) : (
        <span className="size-8 rounded-full bg-hd-ink-700 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-hd-ink-100 truncate">{c.fullName}</p>
        <p className="text-[10px] text-hd-ink-500 truncate">{c.email ?? "no email on file"}</p>
        {c.matched.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {c.matched.map((f) => (
              <span key={f} className="text-[9px] px-1.5 py-px rounded bg-emerald-950/50 text-emerald-400 border border-emerald-900/40">
                {FIELD_LABELS[f]}
              </span>
            ))}
          </div>
        )}
        {c.hasCard && (
          <p className="text-[9px] text-amber-500 mt-1">Already holds a live card</p>
        )}
      </div>

      <ScoreBar score={c.score} confident={c.confident} />

      <button
        type="button"
        onClick={onLink}
        disabled={busy}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shrink-0 transition-colors",
          busy
            ? "bg-hd-ink-700 text-hd-ink-500 cursor-not-allowed"
            : "bg-hd-ink-800 border border-hd-ink-600 text-hd-ink-200 hover:border-hd-ember-600 hover:text-white",
        )}
      >
        <Link2 className="size-3" /> Link
      </button>
    </div>
  );
}

const PROVENANCE: Record<NonNullable<MemberCard["linkedBy"]>, string> = {
  self:  "Requested from their own profile",
  auto:  "Matched automatically to their account",
  admin: "Linked by a committee member",
};

function AccountPanel({
  card, onLinkChange,
}: {
  card: MemberCard;
  onLinkChange: (userId: string | null) => void;
}) {
  const [linked,     setLinked]     = useState<AccountCandidate | null>(null);
  const [candidates, setCandidates] = useState<AccountCandidate[]>([]);
  const [query,      setQuery]      = useState("");
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true); setError(null);
    const res = await suggestAccountsForCard(card.id, q);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setLinked(res.linked);
    setCandidates(res.candidates);
  }, [card.id]);

  useEffect(() => { void load(); }, [load]);

  const link = useCallback(async (userId: string) => {
    setBusy(true); setError(null);
    const res = await mergeCardIntoAccount(card.id, userId);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    onLinkChange(userId);
    void load(query || undefined);
  }, [card.id, onLinkChange, load, query]);

  const unlink = useCallback(async () => {
    setBusy(true); setError(null);
    const res = await unlinkCardFromAccount(card.id);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    onLinkChange(null);
    void load(query || undefined);
  }, [card.id, onLinkChange, load, query]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserPlus className="size-3.5 text-hd-ink-500" />
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-hd-ink-500">
          Rider account
        </h4>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-hd-ember-950/50 border border-hd-ember-800/40 text-hd-ember-300 text-xs">
          <AlertCircle className="size-3.5 shrink-0 mt-px" />{error}
        </div>
      )}

      {loading && (
        <p className="text-xs text-hd-ink-500">Looking for matching accounts…</p>
      )}

      {/* Already linked */}
      {!loading && linked && (
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-2">
          <div className="flex items-center gap-3">
            {linked.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={linked.avatarUrl} alt="" className="size-9 rounded-full object-cover object-top shrink-0" />
            ) : (
              <span className="size-9 rounded-full bg-hd-ink-700 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-hd-ink-50 truncate">{linked.fullName}</p>
              <p className="text-[10px] text-hd-ink-500 truncate">{linked.email ?? "no email on file"}</p>
            </div>
            <button
              type="button"
              onClick={unlink}
              disabled={busy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-hd-ink-300 border border-hd-ink-600 hover:border-hd-ember-700 hover:text-hd-ember-300 transition-colors shrink-0 disabled:opacity-50"
            >
              <Link2Off className="size-3" /> Unlink
            </button>
          </div>

          <p className="text-[10px] text-hd-ink-500 flex items-center gap-1.5">
            <Sparkles className="size-3 shrink-0" />
            {card.linkedBy ? PROVENANCE[card.linkedBy] : "Linked"}
            {card.linkScore != null && card.linkedBy !== "self" && (
              <span className="text-hd-ink-400"> · {Math.round(card.linkScore * 100)}% match</span>
            )}
          </p>
        </div>
      )}

      {/* Not linked — the merge tool proper */}
      {!loading && !linked && (
        <>
          <p className="text-xs text-hd-ink-500 leading-relaxed">
            This application has no account behind it. It was submitted by someone
            who was signed out, and nothing has matched it since. Pick the rider it
            belongs to, or leave it — it will link itself if they sign up.
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-hd-ink-600" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(query || undefined)}
                placeholder="Search by name or email"
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-xs text-hd-ink-100 placeholder:text-hd-ink-600 focus:outline-none focus:border-hd-ember-600"
              />
            </div>
            <button
              type="button"
              onClick={() => load(query || undefined)}
              className="px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 hover:border-hd-ink-500 text-xs font-semibold text-hd-ink-300 transition-colors"
            >
              Search
            </button>
          </div>

          {candidates.length === 0 ? (
            <p className="text-xs text-hd-ink-600">No accounts to show.</p>
          ) : (
            <div className="space-y-1.5">
              {candidates.map((c) => (
                <CandidateRow
                  key={c.userId}
                  c={c}
                  busy={busy}
                  onLink={() => link(c.userId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------

function ApplicationModal({
  card, onClose, onAction, onLinkChange, settings, brandLogos,
}: {
  card:       MemberCard;
  onClose:    () => void;
  onAction:   (id: string, action: "approved" | "rejected", extras?: { cardNumber?: string }) => void;
  onLinkChange: (id: string, userId: string | null) => void;
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
    onAction(card.id, "approved", { cardNumber: cardNumber ?? undefined });
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
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-hd-ink-900 border border-hd-ink-700 rounded-2xl shadow-cinematic">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-hd-ink-800">
          <div>
            <h2 className="text-base font-bold text-hd-ink-50">Application Review</h2>
            <p className="text-xs text-hd-ink-500 mt-0.5">
              Submitted {fmtDate(card.createdAt)}
              {card.resubmissionCount > 0 && (
                <span className="ml-2 text-amber-500">
                  · Resubmission #{card.resubmissionCount}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-hd-ink-400 hover:text-hd-ink-100 hover:bg-hd-ink-800 transition-colors">
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
              className="size-20 rounded-xl object-cover object-top border border-hd-ink-700 shrink-0"
            />
            <div>
              <h3 className="text-lg font-black text-hd-ink-50">{card.fullName}</h3>
              <p className="text-sm text-hd-ink-400">{card.cardNumber ?? "No card number yet"}</p>
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
              <div key={label} className="p-3 rounded-lg bg-hd-ink-800/60 border border-hd-ink-700/40">
                <p className="text-[9px] uppercase tracking-wider text-hd-ink-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-hd-ink-100">{value}</p>
              </div>
            ))}
          </div>

          {/* Card preview */}
          <CardPreview card={card} settings={settings} brandLogos={brandLogos} />

          {/* Which rider this belongs to */}
          <div className="pt-1 border-t border-hd-ink-800">
            <div className="pt-4">
              <AccountPanel
                card={card}
                onLinkChange={(userId) => onLinkChange(card.id, userId)}
              />
            </div>
          </div>

          {/* Rejection reason (existing) */}
          {card.status === "rejected" && card.rejectionReason && (
            <div className="p-3 rounded-lg bg-hd-ember-950/40 border border-hd-ember-900/30">
              <p className="text-[9px] uppercase tracking-wider text-hd-ember-600 mb-1">Previous Rejection Reason</p>
              <p className="text-xs text-hd-ember-300">{card.rejectionReason}</p>
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
            <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/50 border border-hd-ember-800/40 text-hd-ember-300 text-sm">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />{error}
            </div>
          )}

          {/* Reject form */}
          {showReject && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
                Rejection Reason <span className="text-hd-ember-500">*</span>
              </label>
              <textarea
                value={rejReason}
                onChange={(e) => setRejReason(e.target.value)}
                rows={3}
                placeholder="e.g. Photo is unclear, please resubmit with a clearer face photo."
                className="w-full px-3 py-2 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm text-hd-ink-100 placeholder:text-hd-ink-600 focus:outline-none focus:border-hd-ember-600 resize-none"
              />
            </div>
          )}
        </div>

        {/* Actions.
            An application attached to an account is not approved here. That
            person has a row in the register, and approving them there is what
            issues this card — the whole point of merging the two queues. Two
            buttons that both say Approve, on two screens, is how you end up
            with an approved card belonging to an unapproved member. */}
        {card.status === "pending" && card.userId ? (
          <div className="flex items-center gap-3 p-5 border-t border-hd-ink-800">
            <User className="size-4 text-hd-ink-500 shrink-0" />
            <p className="text-sm text-hd-ink-400 flex-1">
              Linked to an account. Approve them in the register and this card
              is issued with them.
            </p>
            <a
              href="/admin/members"
              className="px-3 py-2 rounded-lg bg-hd-ink-700 hover:bg-hd-ink-600 text-hd-ink-100 text-xs font-semibold transition-colors shrink-0"
            >
              Open register
            </a>
          </div>
        ) : card.status === "pending" && (
          <div className="flex items-center gap-2 p-5 border-t border-hd-ink-800">
            {!showReject ? (
              <>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-hd-ember-800/60 text-hd-ember-400 hover:bg-hd-ember-950/40 text-sm font-semibold transition-all"
                >
                  <XCircle className="size-4" /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all",
                    saving ? "bg-hd-ink-700 cursor-not-allowed" : "bg-emerald-700 hover:bg-emerald-600",
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
                  className="px-4 py-2.5 rounded-xl border border-hd-ink-700 text-hd-ink-300 hover:text-hd-ink-100 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={saving}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all",
                    saving ? "bg-hd-ink-700 cursor-not-allowed" : "bg-hd-ember-600 hover:bg-hd-ember-500",
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

type Filter = "all" | "pending" | "approved" | "rejected" | "revoked" | "unlinked";

export function MembersAdmin({
  initialCards, settings, brandLogos, onlyUnlinked = false,
}: {
  initialCards: MemberCard[];
  settings:     CardSettings;
  brandLogos?:  BrandLogos | null;
  /** Show only walk-in applications with nobody behind them, without the
   *  filter tiles. Everything else on this screen now belongs to the register:
   *  approving a member issues their card, so a separate queue of cards would
   *  be a second place to make the same decision. What is left here is the one
   *  case the register cannot show — an application with no account to be a
   *  row of. */
  onlyUnlinked?: boolean;
}) {
  const [cards,    setCards]    = useState(initialCards);
  const [filter,   setFilter]   = useState<Filter>(onlyUnlinked ? "unlinked" : "pending");
  const [viewing,  setViewing]  = useState<MemberCard | null>(null);

  // An unlinked card is not a status — it is an application with nobody behind
  // it. Worth its own tab: these are the ones that need a human.
  const isUnlinked = (c: MemberCard) =>
    !c.userId && c.status !== "rejected" && c.status !== "revoked";

  const counts = {
    all:      cards.length,
    pending:  cards.filter((c) => c.status === "pending").length,
    approved: cards.filter((c) => c.status === "approved").length,
    rejected: cards.filter((c) => c.status === "rejected").length,
    revoked:  cards.filter((c) => c.status === "revoked").length,
    unlinked: cards.filter(isUnlinked).length,
  };

  const displayed =
    filter === "all"      ? cards
    : filter === "unlinked" ? cards.filter(isUnlinked)
    : cards.filter((c) => c.status === filter);

  const handleAction = useCallback((id: string, action: "approved" | "rejected", extras?: { cardNumber?: string }) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, status: action, ...(extras ?? {}) } : c));
  }, []);

  const handleLinkChange = useCallback((id: string, userId: string | null) => {
    const patch = (c: MemberCard): MemberCard => ({
      ...c,
      userId,
      linkedBy: userId ? "admin" : null,
      linkedAt: userId ? new Date().toISOString() : null,
      linkScore: userId ? c.linkScore : null,
    });
    setCards((prev) => prev.map((c) => (c.id === id ? patch(c) : c)));
    // The modal holds its own copy, so the provenance line under the linked
    // account would otherwise keep describing the previous state.
    setViewing((v) => (v && v.id === id ? patch(v) : v));
  }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      {/* Stats row */}
      {!onlyUnlinked && (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {(["all", "pending", "approved", "rejected", "revoked", "unlinked"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              filter === f
                ? "border-hd-ember-700/60 bg-hd-ember-950/20"
                : "gradient-card border-hd-ink-700/60 hover:border-hd-ink-500",
            )}
          >
            <p className={cn(
              "text-2xl font-black",
              f === "pending"  && "text-amber-400",
              f === "approved" && "text-emerald-400",
              f === "rejected" && "text-hd-ember-400",
              f === "unlinked" && "text-sky-400",
              f === "all"      && "text-hd-ink-50",
            )}>
              {counts[f]}
            </p>
            <p className="text-xs text-hd-ink-500 capitalize mt-0.5">{f}</p>
          </button>
        ))}
      </div>
      )}

      {/* Table */}
      {displayed.length === 0 ? (
        onlyUnlinked ? null : (
          <div className="py-20 text-center">
            <Users className="size-12 mx-auto mb-4 text-hd-ink-700" />
            <p className="text-sm text-hd-ink-500">No {filter !== "all" ? filter : ""} applications.</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {displayed.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-4 p-4 rounded-xl gradient-card border border-hd-ink-700/60 hover:border-hd-ink-500 transition-all"
            >
              {/* Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.photoUrl}
                alt={card.fullName}
                className="size-11 rounded-lg object-cover object-top border border-hd-ink-700 shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-hd-ink-50 text-sm truncate">{card.fullName}</p>
                <p className="text-xs text-hd-ink-500">
                  {fmtDate(card.createdAt)}
                </p>
              </div>

              {/* Status + action */}
              <div className="flex items-center gap-3 shrink-0">
                {isUnlinked(card) && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-sky-950/30 text-sky-400 border-sky-800/30">
                    <Link2Off className="size-2.5" /> No account
                  </span>
                )}
                <StatusChip status={card.status} />
                <button
                  type="button"
                  onClick={() => setViewing(card)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hd-ink-800 border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-300 hover:text-hd-ink-100 text-xs font-medium transition-colors"
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
          onLinkChange={handleLinkChange}
          settings={settings}
          brandLogos={brandLogos}
        />
      )}
    </>
  );
}
