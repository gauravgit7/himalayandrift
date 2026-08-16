// =============================================================================
// ProfileClient — the rider's own base
// 'use client'
//
// Three things a signed-in rider should find here: what the club knows about
// them, which rides they are on, and their membership card. The card request
// re-uses the profile rather than asking for the same details a second time.
// =============================================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  User, Phone, Save, AlertCircle, CheckCircle2, Clock, XCircle,
  Bike, Calendar, FileText, Home, Droplet, ShieldAlert, CreditCard,
  Flag, ChevronRight, Loader2, Mail, Route, Trophy, Printer,
} from "lucide-react";

import { cn }              from "@/utils/cn";
import { updateProfile, requestMemberCard } from "@/lib/supabase/actions";
import { ImageUpload }     from "@/components/ui/ImageUpload";
import { CardRenderer }    from "@/features/membership/CardRenderer";
import { formatRideDate }  from "@/utils/date";
import {
  APP_META, BLOOD_GROUPS, ROUTES, STORAGE_BUCKETS, CARD_REQUIREMENT_LABELS,
} from "@/lib/constants";
import type {
  UserProfileWithEmail, MemberRegistrationStatus, MemberCard, CardSettings,
  BrandLogos, RideRegistrationWithRide, CardRequirement,
} from "@/types";

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm transition-colors",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
  "disabled:opacity-50",
);
const labelCls = "text-xs font-medium text-hd-ink-400 uppercase tracking-wide flex items-center gap-1.5";

function StatusBanner({ status, adminNotes }: {
  status: MemberRegistrationStatus; adminNotes: string | null;
}) {
  if (status === "approved") {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">Approved member</p>
          <p className="text-xs text-emerald-600/90">You are a verified {APP_META.name} rider.</p>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-hd-ember-950/40 border border-hd-ember-800/40">
        <XCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
        <div>
          <p className="text-sm font-semibold text-hd-ember-300">Not approved</p>
          {adminNotes && <p className="text-xs text-hd-ember-400 mt-0.5">{adminNotes}</p>}
          <p className="text-xs text-hd-ember-600 mt-1">Update your details below, or speak to a marshal.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-800/30">
      <Clock className="size-4 text-amber-400 shrink-0 mt-px" />
      <div>
        <p className="text-sm font-semibold text-amber-300">Waiting for approval</p>
        <p className="text-xs text-amber-600/90 mt-0.5">
          A marshal will review your account shortly. A clear photo helps.
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-hd-ink-300 uppercase tracking-widest">
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Ride list
// ---------------------------------------------------------------------------

const REG_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending",  cls: "text-amber-400 bg-amber-950/40 border-amber-800/40" },
  approved: { label: "Confirmed", cls: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40" },
  rejected: { label: "Declined", cls: "text-hd-ember-400 bg-hd-ember-950/40 border-hd-ember-800/40" },
};

function RideRow({ reg }: { reg: RideRegistrationWithRide }) {
  const s = REG_STATUS[reg.status] ?? REG_STATUS.pending;
  const inner = (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-hd-ink-900/50 border border-hd-ink-700 hover:border-hd-ink-500 transition-colors">
      <Flag className="size-4 text-hd-ember-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-hd-ink-100 truncate">
          {reg.ride?.title ?? "Ride removed"}
        </p>
        {reg.ride && (
          <p className="text-xs text-hd-ink-500 mt-0.5">
            {formatRideDate(reg.ride.startDate)}
          </p>
        )}
      </div>
      <span className={cn(
        "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        s.cls,
      )}>
        {s.label}
      </span>
      {reg.ride && <ChevronRight className="size-4 text-hd-ink-600 shrink-0" />}
    </div>
  );

  return reg.ride
    ? <Link href={ROUTES.ride(reg.ride.slug || reg.ride.id)}>{inner}</Link>
    : inner;
}

// ---------------------------------------------------------------------------
// Membership card panel
// ---------------------------------------------------------------------------

function CardPanel({
  card, settings, brandLogos, isAdmin, onRequested,
}: {
  card: MemberCard | null;
  settings: CardSettings;
  brandLogos: BrandLogos;
  isAdmin: boolean;
  onRequested: () => void;
}) {
  const [busy,    setBusy]    = useState(false);
  const [missing, setMissing] = useState<CardRequirement[]>([]);
  const [error,   setError]   = useState<string | null>(null);

  const request = useCallback(async () => {
    setBusy(true); setError(null); setMissing([]);
    const res = await requestMemberCard();
    setBusy(false);
    if (res.missing.length) { setMissing(res.missing); return; }
    if (res.error)          { setError(res.error); return; }
    onRequested();
  }, [onRequested]);

  // Approved — show the real thing.
  if (card?.status === "approved") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>Membership card</SectionTitle>
          <span className="text-xs font-mono text-hd-ember-400">{card.cardNumber}</span>
        </div>
        <CardRenderer card={card} settings={settings} brandLogos={brandLogos} mode="compact" />
        <Link
          href={ROUTES.memberCard(card.accessCode)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-hd-ink-800 hover:bg-hd-ink-700 border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-100 transition-colors"
        >
          <Printer className="size-4" /> Download or print card
        </Link>
      </div>
    );
  }

  return (
    <div className="gradient-card rounded-2xl border border-hd-ink-700 p-6 space-y-4">
      <SectionTitle>Membership card</SectionTitle>

      {card?.status === "pending" && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/30 border border-amber-800/30">
          <Clock className="size-4 text-amber-400 shrink-0 mt-px" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Request received</p>
            <p className="text-xs text-amber-600/90 mt-0.5">
              The committee is checking it. Your card appears here once approved.
            </p>
            <p className="text-[11px] font-mono text-hd-ink-500 mt-1.5">{card.accessCode}</p>
          </div>
        </div>
      )}

      {card?.status === "rejected" && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-hd-ember-950/40 border border-hd-ember-800/40">
          <XCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <div>
            <p className="text-sm font-semibold text-hd-ember-300">Card request declined</p>
            {card.rejectionReason && (
              <p className="text-xs text-hd-ember-400 mt-0.5">{card.rejectionReason}</p>
            )}
            <p className="text-xs text-hd-ember-600 mt-1">
              Fix what is noted above and ask again.
            </p>
          </div>
        </div>
      )}

      {!card && (
        <p className="text-sm text-hd-ink-400 leading-relaxed">
          Your card is built from the details already on this page — nothing else
          to fill in.{" "}
          {isAdmin
            ? "As a committee member yours is issued straight away."
            : "One click sends it to the committee."}
        </p>
      )}

      {missing.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/30 space-y-1.5">
          <p className="text-sm font-semibold text-amber-300">
            A few things are still needed
          </p>
          <ul className="text-xs text-amber-600/90 space-y-0.5">
            {missing.map((m) => (
              <li key={m}>· {CARD_REQUIREMENT_LABELS[m]}</li>
            ))}
          </ul>
          <p className="text-[11px] text-amber-700/90 pt-1">
            Add them below, save, then try again.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
          <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-sm text-hd-ember-300">{error}</p>
        </div>
      )}

      {(!card || card.status === "rejected") && (
        <button
          type="button"
          onClick={request}
          disabled={busy}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
            busy
              ? "bg-hd-ink-700 cursor-not-allowed opacity-60"
              : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.98]",
          )}
        >
          {busy
            ? <><Loader2 className="size-4 animate-spin" /> {isAdmin ? "Issuing…" : "Sending…"}</>
            : <><CreditCard className="size-4" />
                {isAdmin ? "Issue my membership card" : "Request membership card"}</>}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface Props {
  profile:       UserProfileWithEmail;
  registrations: RideRegistrationWithRide[];
  card:          MemberCard | null;
  cardSettings:  CardSettings;
  brandLogos:    BrandLogos;
}

export function ProfileClient({
  profile, registrations, card, cardSettings, brandLogos,
}: Props) {
  const initial = useMemo(() => ({
    fullName:       profile.fullName,
    phone:          profile.phone          ?? "",
    address:        profile.address        ?? "",
    bikeModel:      profile.bikeModel      ?? "",
    dateOfBirth:    profile.dateOfBirth    ?? "",
    licenseNumber:  profile.licenseNumber  ?? "",
    bloodGroup:     profile.bloodGroup     ?? "",
    emergencyName:  profile.emergencyName  ?? "",
    emergencyPhone: profile.emergencyPhone ?? "",
    avatarUrl:      profile.avatarUrl,
  }), [profile]);

  const [form,   setForm]   = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [saved,  setSaved]  = useState(false);

  // The save button used to be permanently enabled, which made it impossible
  // to tell whether anything was pending. It now reflects reality.
  const isDirty = useMemo(
    () => (Object.keys(initial) as (keyof typeof initial)[])
      .some((k) => (form[k] ?? "") !== (initial[k] ?? "")),
    [form, initial],
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const initials = form.fullName
    ? form.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const { upcoming, past, stats } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const year  = today.slice(0, 4);
    const up: RideRegistrationWithRide[] = [];
    const pa: RideRegistrationWithRide[] = [];
    for (const r of registrations) {
      if (r.ride && r.ride.startDate >= today) up.push(r); else pa.push(r);
    }

    // Only confirmed rides that have actually happened count towards the
    // totals - a pending request is not a ride you have ridden.
    const ridden = pa.filter((r) => r.status === "approved" && r.ride);
    const km = ridden.reduce(
      (sum, r) => sum + (r.ride?.routeData?.totalDistanceKm ?? 0), 0,
    );
    const thisYear = ridden.filter((r) => r.ride!.startDate.startsWith(year)).length;

    return { upcoming: up, past: pa, stats: { rides: ridden.length, km, thisYear } };
  }, [registrations]);

  const handleSave = useCallback(async () => {
    setSaving(true); setError(null); setSaved(false);
    const res = await updateProfile({
      fullName:       form.fullName,
      phone:          form.phone          || null,
      avatarUrl:      form.avatarUrl,
      address:        form.address        || null,
      bikeModel:      form.bikeModel      || null,
      dateOfBirth:    form.dateOfBirth    || null,
      licenseNumber:  form.licenseNumber  || null,
      bloodGroup:     form.bloodGroup     || null,
      emergencyName:  form.emergencyName  || null,
      emergencyPhone: form.emergencyPhone || null,
    });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); window.location.reload(); }, 900);
  }, [form]);

  const fmtJoined = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* ── Header ── */}
      <div className="gradient-card rounded-2xl border border-hd-ink-700 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="flex flex-col items-center gap-3 shrink-0">
          {form.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.avatarUrl}
              alt={form.fullName}
              className="size-24 rounded-full object-cover border-2 border-hd-ink-700"
            />
          ) : (
            <div className="size-24 rounded-full bg-hd-ember-600 flex items-center justify-center border-2 border-hd-ink-700">
              <span className="text-2xl font-black text-white">{initials}</span>
            </div>
          )}
          <ImageUpload
            bucket={STORAGE_BUCKETS.riderAvatars}
            currentUrl={form.avatarUrl}
            onUpload={(url) => set("avatarUrl", url)}
            cropAspect={1}
            compressMaxPx={600}
          />
        </div>

        <div className="flex-1 w-full space-y-3 text-center sm:text-left">
          <div>
            <h1 className="text-2xl font-black text-hd-ink-50">
              {form.fullName || "Your profile"}
            </h1>
            <p className="text-sm text-hd-ink-500 mt-0.5 inline-flex items-center gap-1.5">
              <Mail className="size-3.5" /> {profile.email}
            </p>
            <p className="text-xs text-hd-ink-600 mt-1">
              Member since {fmtJoined(profile.createdAt)}
            </p>
          </div>
          <StatusBanner status={profile.memberStatus} adminNotes={profile.adminNotes} />
        </div>
      </div>

      {/* ── Membership card ── */}
      <CardPanel
        card={card}
        settings={cardSettings}
        brandLogos={brandLogos}
        isAdmin={profile.isAdmin}
        onRequested={() => window.location.reload()}
      />

      {/* ── Stats ── */}
      {stats.rides > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Trophy, label: "Rides ridden", value: String(stats.rides) },
            { icon: Route,  label: "Distance",
              value: stats.km > 0 ? `${Math.round(stats.km).toLocaleString()} km` : "—" },
            { icon: Calendar, label: "This year", value: String(stats.thisYear) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="gradient-card rounded-xl border border-hd-ink-700 p-4 text-center">
              <Icon className="size-4 text-hd-ember-500 mx-auto mb-2" />
              <p className="text-xl font-black text-hd-ink-50 leading-none">{value}</p>
              <p className="text-[10px] uppercase tracking-widest text-hd-ink-500 mt-1.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Rides ── */}
      <div className="gradient-card rounded-2xl border border-hd-ink-700 p-6 space-y-5">
        <SectionTitle>My rides</SectionTitle>

        {registrations.length === 0 ? (
          <div className="text-center py-8">
            <Flag className="size-8 mx-auto text-hd-ink-700 mb-3" />
            <p className="text-sm text-hd-ink-400">
              You have not registered for a ride yet.
            </p>
            <Link
              href={ROUTES.calendar}
              className="inline-block mt-3 text-sm font-semibold text-hd-ember-400 hover:text-hd-ember-300 transition-colors"
            >
              See what is coming up →
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-hd-ink-500">
                  Coming up
                </p>
                {upcoming.map((r) => <RideRow key={r.id} reg={r} />)}
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-hd-ink-500">
                  Ridden
                </p>
                {past.map((r) => <RideRow key={r.id} reg={r} />)}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Details ── */}
      <div className="gradient-card rounded-2xl border border-hd-ink-700 p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>My details</SectionTitle>
          {isDirty && (
            <span className="text-[11px] text-amber-400 font-semibold">Unsaved changes</span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
            <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
            <p className="text-sm text-hd-ember-300">{error}</p>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">Saved.</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className={labelCls}><User className="size-3" /> Full name</label>
          <input type="text" value={form.fullName} disabled={saving}
            onChange={(e) => set("fullName", e.target.value)} className={inputCls} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}><Calendar className="size-3" /> Date of birth</label>
            <input type="date" value={form.dateOfBirth} disabled={saving}
              onChange={(e) => set("dateOfBirth", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}><Droplet className="size-3" /> Blood group</label>
            <select value={form.bloodGroup} disabled={saving}
              onChange={(e) => set("bloodGroup", e.target.value)}
              className={cn(inputCls, "cursor-pointer")}>
              <option value="" className="bg-hd-ink-900">Select…</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g} className="bg-hd-ink-900">{g}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}><FileText className="size-3" /> Licence number</label>
            <input type="text" value={form.licenseNumber} disabled={saving}
              onChange={(e) => set("licenseNumber", e.target.value)}
              placeholder="BAG-12-12345" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}><Bike className="size-3" /> Bike</label>
            <input type="text" value={form.bikeModel} disabled={saving}
              onChange={(e) => set("bikeModel", e.target.value)}
              placeholder="Apache RTR 200 4V" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}><Phone className="size-3" /> Phone</label>
            <input type="tel" value={form.phone} disabled={saving}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+977 98XXXXXXXX" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}><Home className="size-3" /> Address</label>
            <input type="text" value={form.address} disabled={saving}
              onChange={(e) => set("address", e.target.value)}
              placeholder="City / District" className={inputCls} />
          </div>
        </div>

        <div className="pt-4 border-t border-hd-ink-800 space-y-4">
          <p className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide flex items-center gap-1.5">
            <ShieldAlert className="size-3" /> Emergency contact
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Name</label>
              <input type="text" value={form.emergencyName} disabled={saving}
                onChange={(e) => set("emergencyName", e.target.value)}
                placeholder="Who should we call?" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Number</label>
              <input type="tel" value={form.emergencyPhone} disabled={saving}
                onChange={(e) => set("emergencyPhone", e.target.value)}
                placeholder="+977 98XXXXXXXX" className={inputCls} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty || !form.fullName.trim()}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
            saving || !isDirty || !form.fullName.trim()
              ? "bg-hd-ink-800 text-hd-ink-500 cursor-not-allowed"
              : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.98]",
          )}
        >
          {saving
            ? <><Loader2 className="size-4 animate-spin" />Saving…</>
            : <><Save className="size-4" />{isDirty ? "Save changes" : "No changes"}</>}
        </button>
      </div>
    </div>
  );
}
