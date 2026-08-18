"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  Shield, Phone, MapPin, Bike, Calendar, FileText, Home,
  Edit2, Save, X, AlertCircle, Search, User, Award,
} from "lucide-react";
import { cn }                         from "@/utils/cn";
import {
  approveRegistration,
  rejectRegistration,
  updateRegistrationByAdmin,
  assignMemberTier,
} from "@/lib/supabase/actions";
import type {
  UserProfile, MemberRegistrationStatus, MembershipTier,
} from "@/types";

type FilterStatus = MemberRegistrationStatus | "all";

const STATUS_LABELS: Record<MemberRegistrationStatus, string> = {
  pending:  "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

interface RegistrationCardProps {
  member: UserProfile;
  tiers:  MembershipTier[];
  tiersEnabled: boolean;
  onStatusChange: (id: string, status: MemberRegistrationStatus, notes?: string) => void;
  onTierChange: (id: string, tierId: string | null) => void;
}

function RegistrationCard({
  member, tiers, tiersEnabled, onStatusChange, onTierChange,
}: RegistrationCardProps) {
  const [expanded,      setExpanded]      = useState(false);
  const [editing,       setEditing]       = useState(false);
  const [rejecting,     setRejecting]     = useState(false);
  const [rejectReason,  setRejectReason]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Edit state
  const [editName,     setEditName]     = useState(member.fullName);
  const [editPhone,    setEditPhone]    = useState(member.phone ?? "");
  const [editAddress,  setEditAddress]  = useState(member.address ?? "");
  const [editBike,     setEditBike]     = useState(member.bikeModel ?? "");
  const [editDob,      setEditDob]      = useState(member.dateOfBirth ?? "");
  const [editLicense,  setEditLicense]  = useState(member.licenseNumber ?? "");
  const [editNotes,    setEditNotes]    = useState(member.adminNotes ?? "");

  // The tier as it stands, falling back to the default so a member is never
  // shown as tierless when the club has a default set.
  const myTier = tiersEnabled
    ? (tiers.find((t) => t.id === member.tierId)
       ?? tiers.find((t) => t.isDefault && t.isActive)
       ?? null)
    : null;

  const [savingTier, setSavingTier] = useState(false);
  const assign = async (tierId: string | null) => {
    setSavingTier(true); setError(null);
    const res = await assignMemberTier(member.id, tierId);
    setSavingTier(false);
    if (res.error) { setError(res.error); return; }
    onTierChange(member.id, tierId);
  };

  const initials = member.fullName
    ? member.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleApprove = async () => {
    setLoading(true); setError(null);
    const res = await approveRegistration(member.id);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onStatusChange(member.id, "approved");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setError("Please enter a reason for rejection."); return; }
    setLoading(true); setError(null);
    const res = await rejectRegistration(member.id, rejectReason);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onStatusChange(member.id, "rejected", rejectReason);
    setRejecting(false);
    setRejectReason("");
  };

  const handleSaveEdit = async () => {
    setLoading(true); setError(null);
    const res = await updateRegistrationByAdmin(member.id, {
      fullName:     editName,
      phone:        editPhone     || null,
      address:      editAddress   || null,
      bikeModel:    editBike      || null,
      dateOfBirth:  editDob       || null,
      licenseNumber: editLicense  || null,
      adminNotes:   editNotes     || null,
    });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setEditing(false);
  };

  const statusColor: Record<MemberRegistrationStatus, string> = {
    pending:  "text-amber-400  bg-amber-950/40  border-amber-800/40",
    approved: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",
    rejected: "text-hd-ember-400 bg-hd-ember-950/40 border-hd-ember-800/40",
  };

  const inputClass = cn(
    "w-full h-9 px-3 rounded-lg bg-hd-ink-900 border border-hd-ink-600 text-sm",
    "text-hd-ink-100 placeholder:text-hd-ink-600",
    "focus:outline-none focus:border-hd-ember-600",
  );

  return (
    <div className="gradient-card rounded-xl border border-hd-ink-700 overflow-hidden">
      {/* Card header — always visible */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-hd-ink-800/30 transition-colors"
        onClick={() => { setExpanded(!expanded); setEditing(false); setRejecting(false); }}
      >
        {/* Avatar */}
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt={member.fullName}
            className="size-11 rounded-full object-cover border border-hd-ink-700 shrink-0"
          />
        ) : (
          <div className="size-11 rounded-full bg-hd-ember-600/80 flex items-center justify-center shrink-0 border border-hd-ink-700">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-2">
            <span className="font-semibold text-hd-ink-100 truncate">{member.fullName}</span>
            {myTier && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0"
                style={{
                  color:       myTier.colour || "#f09020",
                  borderColor: `${myTier.colour || "#f09020"}66`,
                  background:  `${myTier.colour || "#f09020"}1a`,
                }}
              >
                <Award className="size-2" /> {myTier.name}
              </span>
            )}
          </p>
          <p className="text-xs text-hd-ink-500 truncate">{member.email}</p>
        </div>

        {/* Status + expand */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
            statusColor[member.memberStatus],
          )}>
            {member.memberStatus === "pending"  && <Clock className="size-3" />}
            {member.memberStatus === "approved" && <CheckCircle2 className="size-3" />}
            {member.memberStatus === "rejected" && <XCircle className="size-3" />}
            {STATUS_LABELS[member.memberStatus]}
          </span>
          <p className="text-[11px] text-hd-ink-600 hidden sm:block">{fmtDate(member.createdAt)}</p>
          {expanded ? <ChevronUp className="size-4 text-hd-ink-500" /> : <ChevronDown className="size-4 text-hd-ink-500" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-hd-ink-800 px-4 pb-4 pt-3 space-y-4">
          {/* Tier — assigned by hand, always. There is deliberately no rule
              that promotes anybody: who counts as a veteran is a judgement,
              and a formula would turn it into an entitlement. */}
          {tiersEnabled && tiers.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-hd-ink-900/60 border border-hd-ink-800">
              <Award className="size-4 text-hd-ember-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-hd-ink-300 uppercase tracking-wide">
                  Membership tier
                </p>
                <p className="text-[11px] text-hd-ink-500 mt-0.5">
                  Sets what they pay for a ride and how fast they earn points.
                </p>
              </div>
              <select
                value={member.tierId ?? ""}
                disabled={savingTier}
                onChange={(e) => assign(e.target.value || null)}
                onClick={(e) => e.stopPropagation()}
                className={cn(inputClass, "w-40 cursor-pointer")}
              >
                <option value="" className="bg-hd-ink-900">Default</option>
                {tiers.filter((t) => t.isActive).map((t) => (
                  <option key={t.id} value={t.id} className="bg-hd-ink-900">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
              <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
              <p className="text-sm text-hd-ember-300">{error}</p>
            </div>
          )}

          {editing ? (
            /* ── Edit mode ── */
            <div className="space-y-3">
              <p className="text-xs font-semibold text-hd-ink-400 uppercase tracking-widest">Editing Details</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-hd-ink-500">Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-hd-ink-500">Phone</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+977 98XXXXXXXX" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-hd-ink-500">Date of Birth</label>
                  <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-hd-ink-500">License Number</label>
                  <input type="text" value={editLicense} onChange={(e) => setEditLicense(e.target.value)} placeholder="BAG-12-12345" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-hd-ink-500">Bike Model</label>
                  <input type="text" value={editBike} onChange={(e) => setEditBike(e.target.value)} placeholder="Royal Enfield Himalayan 450" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-hd-ink-500">Address</label>
                  <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="City / District" className={inputClass} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wide text-hd-ink-500">Admin Notes</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  rows={2} placeholder="Internal notes…"
                  className={cn(inputClass, "h-auto py-2 resize-none")} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button" onClick={handleSaveEdit} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <Save className="size-3.5" />
                  {loading ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button" onClick={() => setEditing(false)} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-300 text-sm transition-colors"
                >
                  <X className="size-3.5" /> Cancel
                </button>
              </div>
            </div>

          ) : rejecting ? (
            /* ── Reject mode ── */
            <div className="space-y-3">
              <p className="text-sm font-semibold text-hd-ember-300">Reason for Rejection</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why this registration is being rejected…"
                className={cn(
                  "w-full px-3 py-2 rounded-lg bg-hd-ink-900 border border-hd-ink-600 text-sm",
                  "text-hd-ink-100 placeholder:text-hd-ink-600 focus:outline-none focus:border-hd-ember-600 resize-none",
                )}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button" onClick={handleReject} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-hd-ember-700 hover:bg-hd-ember-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <XCircle className="size-3.5" />
                  {loading ? "Rejecting…" : "Confirm Reject"}
                </button>
                <button
                  type="button" onClick={() => setRejecting(false)} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-300 text-sm transition-colors"
                >
                  <X className="size-3.5" /> Cancel
                </button>
              </div>
            </div>

          ) : (
            /* ── View mode ── */
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <Detail icon={<Calendar className="size-3" />} label="Date of Birth" value={fmtDate(member.dateOfBirth)} />
                <Detail icon={<FileText className="size-3" />} label="License No." value={member.licenseNumber} />
                <Detail icon={<Phone className="size-3" />} label="Phone" value={member.phone} />
                <Detail icon={<Bike className="size-3" />} label="Bike Model" value={member.bikeModel} />
                <Detail icon={<Home className="size-3" />} label="Address" value={member.address} />
                <Detail icon={<Calendar className="size-3" />} label="Registered" value={fmtDate(member.createdAt)} />
                {member.approvedAt && <Detail icon={<CheckCircle2 className="size-3 text-emerald-400" />} label="Approved" value={fmtDate(member.approvedAt)} />}
              </div>

              {member.adminNotes && (
                <div className="p-3 rounded-lg bg-hd-ink-800/50 border border-hd-ink-700">
                  <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 mb-1">Admin Notes</p>
                  <p className="text-sm text-hd-ink-300">{member.adminNotes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {member.memberStatus !== "approved" && (
                  <button
                    type="button" onClick={handleApprove} disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 className="size-3.5" />
                    {loading ? "Approving…" : "Approve"}
                  </button>
                )}
                {member.memberStatus !== "rejected" && (
                  <button
                    type="button" onClick={() => { setRejecting(true); setError(null); }} disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-hd-ember-950/60 hover:bg-hd-ember-900/60 border border-hd-ember-800/40 text-hd-ember-300 text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="size-3.5" /> Reject
                  </button>
                )}
                <button
                  type="button" onClick={() => { setEditing(true); setError(null); }} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-300 text-sm transition-colors ml-auto"
                >
                  <Edit2 className="size-3.5" /> Edit
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 flex items-center gap-1 mb-0.5">
        {icon}{label}
      </p>
      <p className="text-sm text-hd-ink-200 truncate">{value || "—"}</p>
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================

interface Props {
  initialMembers: UserProfile[];
  tiers:          MembershipTier[];
  /** Off means the tier control is hidden rather than shown doing nothing. */
  tiersEnabled:   boolean;
}

export function UserRegistrationsAdmin({ initialMembers, tiers, tiersEnabled }: Props) {
  const [members,  setMembers]  = useState(initialMembers);

  const handleTierChange = (id: string, tierId: string | null) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, tierId } : m)));
  const [filter,   setFilter]   = useState<FilterStatus>("all");
  const [search,   setSearch]   = useState("");

  const counts = useMemo(() => ({
    all:      members.length,
    pending:  members.filter((m) => m.memberStatus === "pending").length,
    approved: members.filter((m) => m.memberStatus === "approved").length,
    rejected: members.filter((m) => m.memberStatus === "rejected").length,
  }), [members]);

  const displayed = useMemo(() => {
    let list = filter === "all" ? members : members.filter((m) => m.memberStatus === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [members, filter, search]);

  const handleStatusChange = (id: string, status: MemberRegistrationStatus, notes?: string) => {
    setMembers((prev) =>
      prev.map((m) => m.id !== id ? m : {
        ...m,
        memberStatus: status,
        ...(status === "approved" ? { approvedAt: new Date().toISOString(), rejectedAt: null } : {}),
        ...(status === "rejected" ? { rejectedAt: new Date().toISOString(), approvedAt: null, adminNotes: notes ?? m.adminNotes } : {}),
      })
    );
  };

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "all",      label: `All (${counts.all})` },
    { key: "pending",  label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-hd-ink-900 rounded-xl p-1 flex-wrap">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === key
                  ? "bg-hd-ember-600 text-white"
                  : "text-hd-ink-400 hover:text-hd-ink-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-hd-ink-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-hd-ink-900 border border-hd-ink-700 text-sm text-hd-ink-200 placeholder:text-hd-ink-600 focus:outline-none focus:border-hd-ember-600"
          />
        </div>
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 text-hd-ink-500">
          <User className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? "No members match your search." : "No registrations in this category."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((m) => (
            <RegistrationCard
              key={m.id}
              member={m}
              tiers={tiers}
              tiersEnabled={tiersEnabled}
              onStatusChange={handleStatusChange}
              onTierChange={handleTierChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
