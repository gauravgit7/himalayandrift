// =============================================================================
// RegistrationsAdmin — review ride sign-ups
// 'use client' — filtering, approve/reject, screenshot viewer
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Image                 from "next/image";
import {
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Search,
  Phone, Mail, Bike, Users, ShieldAlert, Wallet, Receipt, Trash2,
  AlertCircle, Save, X, StickyNote, ExternalLink, ClipboardList,
  BadgeCheck,
} from "lucide-react";

import { cn } from "@/utils/cn";
import {
  approveRideRegistration,
  rejectRideRegistration,
  updateRideRegistrationNotes,
  deleteRideRegistration,
} from "@/lib/supabase/actions";
import type { RideRegistrationWithRide, RideRegistrationStatus } from "@/types";

type FilterStatus = RideRegistrationStatus | "all";

const STATUS_STYLE: Record<RideRegistrationStatus, string> = {
  pending:  "text-amber-400   bg-amber-950/40    border-amber-800/40",
  approved: "text-emerald-400 bg-emerald-950/40  border-emerald-800/40",
  rejected: "text-hd-ember-400 bg-hd-ember-950/40 border-hd-ember-800/40",
};

const STATUS_LABEL: Record<RideRegistrationStatus, string> = {
  pending: "Pending", approved: "Approved", rejected: "Rejected",
};

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-hd-ink-900 border border-hd-ink-600 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600",
);

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// One registration
// ---------------------------------------------------------------------------

function RegistrationCard({
  registration,
  onChanged,
  onDeleted,
}: {
  registration: RideRegistrationWithRide;
  onChanged: (id: string, status: RideRegistrationStatus, reason?: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason,    setReason]    = useState("");
  const [notes,     setNotes]     = useState(registration.adminNotes ?? "");
  const [notesOpen, setNotesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const r = registration;

  const run = async (fn: () => Promise<{ error: string | null }>, after?: () => void) => {
    setLoading(true); setError(null);
    const res = await fn();
    setLoading(false);
    if (res.error) { setError(res.error); return false; }
    after?.();
    return true;
  };

  return (
    <div className="gradient-card rounded-xl border border-hd-ink-700 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-hd-ink-800/30 transition-colors"
        onClick={() => { setExpanded(!expanded); setRejecting(false); setConfirmDelete(false); }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-hd-ink-100 truncate">{r.fullName}</p>
            {r.pillionCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-hd-slate-900/60 text-hd-slate-300 border border-hd-slate-700/50">
                <Users className="size-2.5" />+{r.pillionCount}
              </span>
            )}
            {/* The tier they were on when they registered, copied at the time
                so the roster still reads correctly after a promotion. Nothing
                to verify: the committee assigned it. */}
            {r.tierLabel && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-hd-ember-950/40 text-hd-ember-400 border-hd-ember-900/40">
                <BadgeCheck className="size-2.5" />
                {r.tierLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-hd-ink-500 truncate mt-0.5">
            {r.ride?.title ?? "Ride deleted"} · {r.phone}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {r.amountPaid !== null && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-hd-ink-400">
              <Wallet className="size-3" />
              {r.amountPaid.toLocaleString()}
            </span>
          )}
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
            STATUS_STYLE[r.status],
          )}>
            {r.status === "pending"  && <Clock className="size-3" />}
            {r.status === "approved" && <CheckCircle2 className="size-3" />}
            {r.status === "rejected" && <XCircle className="size-3" />}
            {STATUS_LABEL[r.status]}
          </span>
          <span className="text-[11px] text-hd-ink-600 hidden md:block font-mono">
            {r.accessCode}
          </span>
          {expanded
            ? <ChevronUp className="size-4 text-hd-ink-500" />
            : <ChevronDown className="size-4 text-hd-ink-500" />}
        </div>
      </div>

      {/* Detail */}
      {expanded && (
        <div className="border-t border-hd-ink-800 px-4 pb-4 pt-3 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
              <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
              <p className="text-sm text-hd-ember-300">{error}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-[1fr_auto] gap-5">
            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail icon={<Phone className="size-3" />}       label="Phone"     value={r.phone} />
              <Detail icon={<Mail className="size-3" />}        label="Email"     value={r.email} />
              <Detail icon={<Bike className="size-3" />}        label="Bike"      value={r.bikeModel} />
              <Detail icon={<Clock className="size-3" />}       label="Submitted" value={fmtDate(r.createdAt)} />
              <Detail icon={<ShieldAlert className="size-3" />} label="Emergency"
                value={[r.emergencyName, r.emergencyPhone].filter(Boolean).join(" · ") || null} />
              {r.paymentReference && (
                <Detail icon={<Receipt className="size-3" />} label="Txn ID" value={r.paymentReference} />
              )}
              {r.notes && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 mb-0.5">
                    Rider notes
                  </p>
                  <p className="text-sm text-hd-ink-300">{r.notes}</p>
                </div>
              )}
            </div>

            {/* Payment screenshot */}
            {r.paymentScreenshotUrl && (
              <a
                href={r.paymentScreenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block shrink-0 mx-auto sm:mx-0"
                title="Open full size"
              >
                <div className="relative size-32 rounded-lg overflow-hidden border border-hd-ink-700 bg-hd-ink-900">
                  <Image
                    src={r.paymentScreenshotUrl}
                    alt="Payment screenshot"
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-[10px] text-hd-ink-500 mt-1.5 text-center inline-flex items-center gap-1 w-full justify-center">
                  <ExternalLink className="size-2.5" /> Payment proof
                </p>
              </a>
            )}
          </div>

          {r.rejectionReason && (
            <div className="p-3 rounded-lg bg-hd-ember-950/40 border border-hd-ember-800/40">
              <p className="text-[10px] uppercase tracking-widest text-hd-ember-500 mb-1">
                Rejection reason
              </p>
              <p className="text-sm text-hd-ember-300">{r.rejectionReason}</p>
            </div>
          )}

          {/* Admin notes */}
          {notesOpen ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Internal note…"
                className={cn(inputCls, "h-auto py-2 resize-none")}
              />
              <div className="flex gap-2">
                <button
                  type="button" disabled={loading}
                  onClick={() => run(
                    () => updateRideRegistrationNotes(r.id, notes),
                    () => setNotesOpen(false),
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  <Save className="size-3" /> Save note
                </button>
                <button
                  type="button" onClick={() => setNotesOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hd-ink-700 text-hd-ink-300 text-xs transition-colors"
                >
                  <X className="size-3" /> Cancel
                </button>
              </div>
            </div>
          ) : r.adminNotes ? (
            <button
              type="button" onClick={() => setNotesOpen(true)}
              className="w-full text-left p-3 rounded-lg bg-hd-ink-800/50 border border-hd-ink-700 hover:border-hd-ink-500 transition-colors"
            >
              <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 mb-1">
                Admin note
              </p>
              <p className="text-sm text-hd-ink-300">{r.adminNotes}</p>
            </button>
          ) : null}

          {/* Reject reason entry */}
          {rejecting && (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Why is this being rejected? The rider sees this."
                className={cn(inputCls, "h-auto py-2 resize-none")}
              />
              <div className="flex gap-2">
                <button
                  type="button" disabled={loading || !reason.trim()}
                  onClick={() => run(
                    () => rejectRideRegistration(r.id, reason),
                    () => { onChanged(r.id, "rejected", reason); setRejecting(false); },
                  )}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-hd-ember-700 hover:bg-hd-ember-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <XCircle className="size-3.5" /> Confirm reject
                </button>
                <button
                  type="button" onClick={() => setRejecting(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-hd-ink-700 text-hd-ink-300 text-sm transition-colors"
                >
                  <X className="size-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delete confirm */}
          {confirmDelete && (
            <div className="p-3 rounded-lg bg-hd-ember-950/50 border border-hd-ember-800/40 space-y-2">
              <p className="text-sm text-hd-ember-300">
                Delete this registration for good? Rejecting keeps the record and
                frees the place; deleting removes it entirely.
              </p>
              <div className="flex gap-2">
                <button
                  type="button" disabled={loading}
                  onClick={() => run(
                    () => deleteRideRegistration(r.id),
                    () => onDeleted(r.id),
                  )}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-hd-ember-700 hover:bg-hd-ember-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
                <button
                  type="button" onClick={() => setConfirmDelete(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-hd-ink-700 text-hd-ink-300 text-sm transition-colors"
                >
                  <X className="size-3.5" /> Keep it
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!rejecting && !confirmDelete && (
            <div className="flex items-center gap-2 flex-wrap">
              {r.status !== "approved" && (
                <button
                  type="button" disabled={loading}
                  onClick={() => run(
                    () => approveRideRegistration(r.id),
                    () => onChanged(r.id, "approved"),
                  )}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="size-3.5" /> Approve
                </button>
              )}
              {r.status !== "rejected" && (
                <button
                  type="button" disabled={loading}
                  onClick={() => { setRejecting(true); setError(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-hd-ember-950/60 hover:bg-hd-ember-900/60 border border-hd-ember-800/40 text-hd-ember-300 text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <XCircle className="size-3.5" /> Reject
                </button>
              )}
              {!r.adminNotes && !notesOpen && (
                <button
                  type="button" onClick={() => setNotesOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-400 text-sm transition-colors"
                >
                  <StickyNote className="size-3.5" /> Add note
                </button>
              )}
              <button
                type="button" onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-hd-ink-500 hover:text-hd-ember-400 text-sm transition-colors ml-auto"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 flex items-center gap-1 mb-0.5">
        {icon}{label}
      </p>
      <p className="text-sm text-hd-ink-200 break-words">{value || "—"}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Props {
  initialRegistrations: RideRegistrationWithRide[];
}

export function RegistrationsAdmin({ initialRegistrations }: Props) {
  const [items,  setItems]  = useState(initialRegistrations);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [rideId, setRideId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => ({
    all:      items.length,
    pending:  items.filter((r) => r.status === "pending").length,
    approved: items.filter((r) => r.status === "approved").length,
    rejected: items.filter((r) => r.status === "rejected").length,
  }), [items]);

  // Rides that actually have registrations — no point listing the rest.
  const rides = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of items) if (r.ride) seen.set(r.ride.id, r.ride.title);
    return [...seen.entries()].map(([id, title]) => ({ id, title }));
  }, [items]);

  const displayed = useMemo(() => {
    let list = items;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    if (rideId !== "all") list = list.filter((r) => r.ride?.id === rideId);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        r.accessCode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, rideId, search]);

  const handleChanged = (id: string, status: RideRegistrationStatus, reason?: string) => {
    setItems((prev) => prev.map((r) => r.id !== id ? r : {
      ...r,
      status,
      ...(status === "approved"
        ? { approvedAt: new Date().toISOString(), rejectedAt: null, rejectionReason: null }
        : {}),
      ...(status === "rejected"
        ? { rejectedAt: new Date().toISOString(), approvedAt: null, rejectionReason: reason ?? r.rejectionReason }
        : {}),
    }));
  };

  const handleDeleted = (id: string) =>
    setItems((prev) => prev.filter((r) => r.id !== id));

  const tabs: { key: FilterStatus; label: string }[] = [
    { key: "all",      label: `All (${counts.all})` },
    { key: "pending",  label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex items-center gap-1 bg-hd-ink-900 rounded-xl p-1 flex-wrap">
          {tabs.map(({ key, label }) => (
            <button
              key={key} type="button" onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === key
                  ? "bg-hd-ember-600 text-white"
                  : "text-hd-ink-400 hover:text-hd-ink-200",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {rides.length > 1 && (
          <select
            value={rideId}
            onChange={(e) => setRideId(e.target.value)}
            className="h-9 px-3 rounded-xl bg-hd-ink-900 border border-hd-ink-700 text-sm text-hd-ink-200 focus:outline-none focus:border-hd-ember-600 cursor-pointer"
          >
            <option value="all" className="bg-hd-ink-900">All rides</option>
            {rides.map((r) => (
              <option key={r.id} value={r.id} className="bg-hd-ink-900">{r.title}</option>
            ))}
          </select>
        )}

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-hd-ink-500" />
          <input
            type="search" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone, email or code…"
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-hd-ink-900 border border-hd-ink-700 text-sm text-hd-ink-200 placeholder:text-hd-ink-600 focus:outline-none focus:border-hd-ember-600"
          />
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16 text-hd-ink-500">
          <ClipboardList className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {items.length === 0
              ? "No registrations yet. Turn registration on for a ride to start collecting them."
              : "Nothing matches these filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((r) => (
            <RegistrationCard
              key={r.id}
              registration={r}
              onChanged={handleChanged}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
