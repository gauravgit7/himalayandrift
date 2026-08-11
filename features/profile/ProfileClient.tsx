"use client";

import { useState, useCallback } from "react";
import {
  User, Phone, MapPin, Shield, Save, AlertCircle,
  CheckCircle2, Clock, XCircle, Bike, Calendar, FileText, Home,
} from "lucide-react";
import { cn }            from "@/utils/cn";
import { updateProfile } from "@/lib/supabase/actions";
import { ImageUpload }   from "@/components/ui/ImageUpload";
import { APP_META }      from "@/lib/constants";
import type { UserProfileWithEmail, MemberRegistrationStatus } from "@/types";

interface Props {
  profile: UserProfileWithEmail;
}

function StatusBadge({ status, adminNotes }: { status: MemberRegistrationStatus; adminNotes: string | null }) {
  if (status === "approved") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">Account Approved</p>
          <p className="text-xs text-emerald-600">You are a verified {APP_META.name} member.</p>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-tvs-red-950/40 border border-tvs-red-800/40">
        <XCircle className="size-4 text-tvs-red-400 shrink-0 mt-px" />
        <div>
          <p className="text-sm font-semibold text-tvs-red-300">Account Not Approved</p>
          {adminNotes && <p className="text-xs text-tvs-red-400 mt-0.5">{adminNotes}</p>}
          <p className="text-xs text-tvs-red-600 mt-1">Contact admin to resolve this or update your details below.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-800/30">
      <Clock className="size-4 text-amber-400 shrink-0 mt-px" />
      <div>
        <p className="text-sm font-semibold text-amber-300">Pending Admin Approval</p>
        <p className="text-xs text-amber-600 mt-0.5">
          Upload a clear photo below — it helps admin verify your identity faster.
        </p>
      </div>
    </div>
  );
}

export function ProfileClient({ profile }: Props) {
  const [fullName,       setFullName]       = useState(profile.fullName);
  const [phone,          setPhone]          = useState(profile.phone ?? "");
  const [address,        setAddress]        = useState(profile.address ?? "");
  const [bikeModel,      setBikeModel]      = useState(profile.bikeModel ?? "");
  const [dateOfBirth,    setDateOfBirth]    = useState(profile.dateOfBirth ?? "");
  const [licenseNumber,  setLicenseNumber]  = useState(profile.licenseNumber ?? "");
  const [avatarUrl,      setAvatarUrl]      = useState(profile.avatarUrl);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [saved,          setSaved]          = useState(false);

  const initials = fullName
    ? fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const handleSave = useCallback(async () => {
    setSaving(true); setError(null); setSaved(false);
    const result = await updateProfile({
      fullName,
      phone:         phone         || null,
      avatarUrl,
      address:       address       || null,
      bikeModel:     bikeModel     || null,
      dateOfBirth:   dateOfBirth   || null,
      licenseNumber: licenseNumber || null,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [fullName, phone, avatarUrl, address, bikeModel, dateOfBirth, licenseNumber]);

  const inputClass = cn(
    "w-full h-10 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-sm transition-colors",
    "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
    "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40",
    "disabled:opacity-50",
  );
  const labelClass = "text-xs font-medium text-tvs-charcoal-400 uppercase tracking-wide flex items-center gap-1.5";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-tvs-charcoal-50">My Profile</h1>
        <p className="text-sm text-tvs-charcoal-500 mt-0.5">
          Member since {fmtDate(profile.createdAt)}
        </p>
      </div>

      {/* Status banner */}
      <StatusBadge status={profile.memberStatus} adminNotes={profile.adminNotes} />

      {/* Avatar + account info */}
      <div className="gradient-card rounded-2xl border border-tvs-charcoal-700 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={fullName}
              className="size-24 rounded-full object-cover border-2 border-tvs-charcoal-700"
            />
          ) : (
            <div className="size-24 rounded-full bg-tvs-red-600 flex items-center justify-center border-2 border-tvs-charcoal-700">
              <span className="text-2xl font-black text-white">{initials}</span>
            </div>
          )}
          <ImageUpload
            bucket="rider-avatars"
            currentUrl={avatarUrl}
            onUpload={(url) => setAvatarUrl(url)}
            cropAspect={1}
            compressMaxPx={400}
          />
          {!avatarUrl && (
            <p className="text-[10px] text-amber-500 text-center max-w-[120px] leading-tight">
              Upload your photo for identity verification
            </p>
          )}
        </div>

        {/* Account info (read-only) */}
        <div className="flex-1 space-y-3 w-full">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-tvs-charcoal-500 mb-0.5">Email</p>
            <p className="text-sm font-medium text-tvs-charcoal-200">{profile.email}</p>
          </div>
          {profile.approvedAt && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-tvs-charcoal-500 mb-0.5">Approved</p>
              <p className="text-sm text-emerald-400">{fmtDate(profile.approvedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Editable fields */}
      <div className="gradient-card rounded-2xl border border-tvs-charcoal-700 p-6 space-y-5">
        <h2 className="text-sm font-bold text-tvs-charcoal-300 uppercase tracking-widest">
          Profile Details
        </h2>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40">
            <AlertCircle className="size-4 text-tvs-red-400 shrink-0 mt-px" />
            <p className="text-sm text-tvs-red-300">{error}</p>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">Profile saved.</p>
          </div>
        )}

        {/* Full name */}
        <div className="space-y-1.5">
          <label className={labelClass}><User className="size-3" /> Full Name</label>
          <input
            type="text" value={fullName} required
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name" disabled={saving}
            className={inputClass}
          />
        </div>

        {/* DOB + License */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}><Calendar className="size-3" /> Date of Birth</label>
            <input
              type="date" value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={saving} className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}><FileText className="size-3" /> License Number</label>
            <input
              type="text" value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="BAG-12-12345" disabled={saving} className={inputClass}
            />
          </div>
        </div>

        {/* Bike model */}
        <div className="space-y-1.5">
          <label className={labelClass}><Bike className="size-3" /> TVS Model</label>
          <input
            type="text" value={bikeModel}
            onChange={(e) => setBikeModel(e.target.value)}
            placeholder="e.g. Apache RTR 200 4V, Ronin 225…"
            disabled={saving} className={inputClass}
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className={labelClass}><Home className="size-3" /> Address</label>
          <input
            type="text" value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="City / District" disabled={saving} className={inputClass}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className={labelClass}><Phone className="size-3" /> Phone</label>
          <input
            type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+977 98XXXXXXXX" disabled={saving}
            className={inputClass}
          />
        </div>

        {/* Save */}
        <button
          type="button" onClick={handleSave} disabled={saving || !fullName.trim()}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
            saving || !fullName.trim()
              ? "bg-tvs-charcoal-700 cursor-not-allowed opacity-60"
              : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red active:scale-[0.98]"
          )}
        >
          {saving
            ? <><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
            : <><Save className="size-4" />Save Changes</>}
        </button>
      </div>
    </div>
  );
}
