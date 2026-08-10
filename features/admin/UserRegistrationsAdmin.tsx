"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  Shield, Phone, MapPin, Bike, Calendar, FileText, Home,
  Edit2, Save, X, AlertCircle, Search, User,
} from "lucide-react";
import { cn }                         from "@/utils/cn";
import {
  approveRegistration,
  rejectRegistration,
  updateRegistrationByAdmin,
} from "@/lib/supabase/actions";
import type { UserProfile, MemberRegistrationStatus, MemberCommunity } from "@/types";

const CHAPTERS = [
  "Bagmati","Narayani","Gandaki","Lumbini",
  "Rapti","Bheri","Mahakali","Koshi","Mechi",
] as const;

type FilterStatus = MemberRegistrationStatus | "all";

const STATUS_LABELS: Record<MemberRegistrationStatus, string> = {
  pending:  "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

interface RegistrationCardProps {
  member: UserProfile;
  onStatusChange: (id: string, status: MemberRegistrationStatus, notes?: string) => void;
}

function RegistrationCard({ member, onStatusChange }: RegistrationCardProps) {
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
  const [editCommunity,setEditCommunity]= useState<MemberCommunity | "">(member.community ?? "");
  const [editChapter,  setEditChapter]  = useState(member.chapter ?? "");
  const [editNotes,    setEditNotes]    = useState(member.adminNotes ?? "");

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
      community:    editCommunity || null,
      chapter:      editChapter   || null,
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
    rejected: "text-tvs-red-400 bg-tvs-red-950/40 border-tvs-red-800/40",
  };

  const inputClass = cn(
    "w-full h-9 px-3 rounded-lg bg-tvs-charcoal-900 border border-tvs-charcoal-600 text-sm",
    "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
    "focus:outline-none focus:border-tvs-red-600",
  );

  return (
    <div className="gradient-card rounded-xl border border-tvs-charcoal-700 overflow-hidden">
      {/* Card header — always visible */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-tvs-charcoal-800/30 transition-colors"
        onClick={() => { setExpanded(!expanded); setEditing(false); setRejecting(false); }}
      >
        {/* Avatar */}
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt={member.fullName}
            className="size-11 rounded-full object-cover border border-tvs-charcoal-700 shrink-0"
          />
        ) : (
          <div className="size-11 rounded-full bg-tvs-red-600/80 flex items-center justify-center shrink-0 border border-tvs-charcoal-700">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-tvs-charcoal-100 truncate">{member.fullName}</p>
          <p className="text-xs text-tvs-charcoal-500 truncate">{member.email}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {member.community && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-tvs-charcoal-400">
                {member.community}
              </span>
            )}
            {member.chapter && (
              <span className="text-[10px] text-tvs-charcoal-500">{member.chapter}</span>
            )}
          </div>
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
          <p className="text-[11px] text-tvs-charcoal-600 hidden sm:block">{fmtDate(member.createdAt)}</p>
          {expanded ? <ChevronUp className="size-4 text-tvs-charcoal-500" /> : <ChevronDown className="size-4 text-tvs-charcoal-500" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-tvs-charcoal-800 px-4 pb-4 pt-3 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40">
              <AlertCircle className="size-4 text-tvs-red-400 shrink-0 mt-px" />
              <p className="text-sm text-tvs-red-300">{error}</p>
            </div>
          )}

          {editing ? (
            /* ── Edit mode ── */
            <div className="space-y-3">
              <p className="text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-widest">Editing Details</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">Phone</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+977 98XXXXXXXX" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">Date of Birth</label>
                  <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">License Number</label>
                  <input type="text" value={editLicense} onChange={(e) => setEditLicense(e.target.value)} placeholder="BAG-12-12345" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">TVS Model</label>
                  <input type="text" value={editBike} onChange={(e) => setEditBike(e.target.value)} placeholder="Apache RTR 200 4V" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">Address</label>
                  <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="City / District" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">Community</label>
                  <select value={editCommunity} onChange={(e) => setEditCommunity(e.target.value as MemberCommunity | "")}
                    className={cn(inputClass, "cursor-pointer")}>
                    <option value="">Not selected</option>
                    <option value="AOG">AOG</option>
                    <option value="CULT">CULT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">Chapter</label>
                  <select value={editChapter} onChange={(e) => setEditChapter(e.target.value)}
                    className={cn(inputClass, "cursor-pointer")}>
                    <option value="">Not selected</option>
                    {CHAPTERS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wide text-tvs-charcoal-500">Admin Notes</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  rows={2} placeholder="Internal notes…"
                  className={cn(inputClass, "h-auto py-2 resize-none")} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button" onClick={handleSaveEdit} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tvs-red-600 hover:bg-tvs-red-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <Save className="size-3.5" />
                  {loading ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button" onClick={() => setEditing(false)} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 text-sm transition-colors"
                >
                  <X className="size-3.5" /> Cancel
                </button>
              </div>
            </div>

          ) : rejecting ? (
            /* ── Reject mode ── */
            <div className="space-y-3">
              <p className="text-sm font-semibold text-tvs-red-300">Reason for Rejection</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why this registration is being rejected…"
                className={cn(
                  "w-full px-3 py-2 rounded-lg bg-tvs-charcoal-900 border border-tvs-charcoal-600 text-sm",
                  "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600 focus:outline-none focus:border-tvs-red-600 resize-none",
                )}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button" onClick={handleReject} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tvs-red-700 hover:bg-tvs-red-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <XCircle className="size-3.5" />
                  {loading ? "Rejecting…" : "Confirm Reject"}
                </button>
                <button
                  type="button" onClick={() => setRejecting(false)} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 text-sm transition-colors"
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
                <Detail icon={<Bike className="size-3" />} label="TVS Model" value={member.bikeModel} />
                <Detail icon={<Home className="size-3" />} label="Address" value={member.address} />
                <Detail icon={<MapPin className="size-3" />} label="Chapter" value={member.chapter} />
                <Detail icon={<Shield className="size-3" />} label="Community" value={member.community} />
                <Detail icon={<Calendar className="size-3" />} label="Registered" value={fmtDate(member.createdAt)} />
                {member.approvedAt && <Detail icon={<CheckCircle2 className="size-3 text-emerald-400" />} label="Approved" value={fmtDate(member.approvedAt)} />}
              </div>

              {member.adminNotes && (
                <div className="p-3 rounded-lg bg-tvs-charcoal-800/50 border border-tvs-charcoal-700">
                  <p className="text-[10px] uppercase tracking-widest text-tvs-charcoal-500 mb-1">Admin Notes</p>
                  <p className="text-sm text-tvs-charcoal-300">{member.adminNotes}</p>
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
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tvs-red-950/60 hover:bg-tvs-red-900/60 border border-tvs-red-800/40 text-tvs-red-300 text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="size-3.5" /> Reject
                  </button>
                )}
                <button
                  type="button" onClick={() => { setEditing(true); setError(null); }} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 text-sm transition-colors ml-auto"
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
      <p className="text-[10px] uppercase tracking-widest text-tvs-charcoal-500 flex items-center gap-1 mb-0.5">
        {icon}{label}
      </p>
      <p className="text-sm text-tvs-charcoal-200 truncate">{value || "—"}</p>
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================

interface Props {
  initialMembers: UserProfile[];
}

export function UserRegistrationsAdmin({ initialMembers }: Props) {
  const [members,  setMembers]  = useState(initialMembers);
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
        m.email.toLowerCase().includes(q) ||
        (m.chapter ?? "").toLowerCase().includes(q) ||
        (m.community ?? "").toLowerCase().includes(q)
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
        <div className="flex items-center gap-1 bg-tvs-charcoal-900 rounded-xl p-1 flex-wrap">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === key
                  ? "bg-tvs-red-600 text-white"
                  : "text-tvs-charcoal-400 hover:text-tvs-charcoal-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-tvs-charcoal-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, chapter…"
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-tvs-charcoal-900 border border-tvs-charcoal-700 text-sm text-tvs-charcoal-200 placeholder:text-tvs-charcoal-600 focus:outline-none focus:border-tvs-red-600"
          />
        </div>
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 text-tvs-charcoal-500">
          <User className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? "No members match your search." : "No registrations in this category."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((m) => (
            <RegistrationCard
              key={m.id}
              member={m}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
