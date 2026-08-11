// =============================================================================
// RideForm - Phase 6 · Supabase persistence
// 'use client' - controlled form state, validation, Supabase server action submit
// =============================================================================

"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { ImageUpload }  from "@/components/ui/ImageUpload";
import { RouteBuilder } from "@/features/admin/RouteBuilder";
import { cn }          from "@/utils/cn";
import {
  ROUTES, RIDE_TYPES, RIDE_STATUSES, RIDE_PRIORITIES,
} from "@/lib/constants";
import { saveRide }  from "@/lib/supabase/actions";
import type {
  Ride, RideType, RideStatus, RidePriority, Marshal, RouteData,
} from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormMode = "create" | "edit";

interface RideFormProps {
  mode:        FormMode;
  initialData?: Partial<Ride>;
  rideId?:     string;
  marshals:    Marshal[];
}

interface FormState {
  title:            string;
  rideType:         RideType;
  location:         string;
  startDate:        string;
  endDate:          string;
  status:           RideStatus;
  priority:         RidePriority;
  shortDescription: string;
  description:      string;
  expectedRiders:   string;
  registrationLink: string;
  isFeatured:       boolean;
  marshalId:        string;
  bannerImageUrl:   string | null;
}

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

function toFormState(data?: Partial<Ride>): FormState {
  return {
    title:            data?.title            ?? "",
    rideType:         data?.rideType         ?? "day",
    location:         data?.location         ?? "",
    startDate:        data?.startDate        ?? "",
    endDate:          data?.endDate          ?? "",
    status:           data?.status           ?? "planned",
    priority:         data?.priority         ?? "standard",
    shortDescription: data?.shortDescription ?? "",
    description:      data?.description      ?? "",
    expectedRiders:   data?.expectedRiders   ? String(data.expectedRiders) : "",
    registrationLink: data?.registrationLink ?? "",
    isFeatured:       data?.isFeatured       ?? false,
    marshalId:        data?.marshal?.id      ?? "",
    bannerImageUrl:   data?.bannerImageUrl   ?? null,
  };
}

// ---------------------------------------------------------------------------
// Field sub-components
// ---------------------------------------------------------------------------

function FieldGroup({
  label,
  children,
  required,
}: {
  label:     string;
  children:  React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-tvs-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = cn(
  "w-full h-9 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700",
  "text-sm text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
  "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40 transition-colors"
);
const selectClass   = cn(inputClass, "appearance-none cursor-pointer");
const textareaClass = cn(
  "w-full px-3 py-2 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700",
  "text-sm text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600 resize-none",
  "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40 transition-colors"
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RideForm({ mode, initialData, rideId, marshals }: RideFormProps) {
  const router = useRouter();

  const [form,        setForm]        = useState<FormState>(() => toFormState(initialData));
  const [routeData,   setRouteData]   = useState<RouteData | null>(initialData?.routeData ?? null);
  const [errors,      setErrors]      = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Field updater ──────────────────────────────────────────────────────────
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
    setServerError(null);
  };

  const handleStartDate = (v: string) => {
    set("startDate", v);
    if (!form.endDate || form.endDate < v) set("endDate", v);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title     = "Title is required";
    if (!form.startDate)    errs.startDate = "Start date is required";
    if (!form.endDate)      errs.endDate   = "End date is required";
    if (form.endDate && form.startDate && form.endDate < form.startDate)
      errs.endDate = "End date must be ≥ start date";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit → saveRide server action ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setServerError(null);

    const { error } = await saveRide(
      {
        title:            form.title,
        rideType:         form.rideType,
        location:         form.location,
        startDate:        form.startDate,
        endDate:          form.endDate,
        status:           form.status,
        priority:         form.priority,
        shortDescription: form.shortDescription,
        description:      form.description,
        expectedRiders:   parseInt(form.expectedRiders) || 0,
        registrationLink: form.registrationLink || null,
        isFeatured:       form.isFeatured,
        marshalId:        form.marshalId || null,
        bannerImageUrl:   form.bannerImageUrl,
        routeData:        routeData,
      },
      rideId,
    );

    if (error) {
      setServerError(error);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push(ROUTES.adminRides), 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Server error ── */}
      {serverError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-tvs-red-950/60 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
          <AlertCircle className="size-4 shrink-0 mt-px" />
          <span>{serverError}</span>
        </div>
      )}

      {/* ── Save success banner ── */}
      {saved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-sm">
          <CheckCircle2 className="size-4 shrink-0" />
          {mode === "create" ? "Ride created" : "Changes saved"} - redirecting…
        </div>
      )}

      {/* ── Section: Basic info ── */}
      <Section title="Basic Information">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldGroup label="Ride Title" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Nagarkot Winter Sunrise Ride"
                className={cn(inputClass, errors.title && "border-tvs-red-600")}
              />
              {errors.title && <ErrorMsg msg={errors.title} />}
            </FieldGroup>
          </div>

          <FieldGroup label="Ride Type" required>
            <select
              value={form.rideType}
              onChange={(e) => set("rideType", e.target.value as RideType)}
              className={selectClass}
            >
              {RIDE_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-tvs-charcoal-900">
                  {t.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Location" required>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Kathmandu, Pokhara, Mustang"
              className={inputClass}
            />
          </FieldGroup>

          <FieldGroup label="Priority" required>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as RidePriority)}
              className={selectClass}
            >
              {RIDE_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value} className="bg-tvs-charcoal-900">
                  {p.label}
                </option>
              ))}
            </select>
          </FieldGroup>
        </div>
      </Section>

      {/* ── Section: Dates ── */}
      <Section title="Schedule">
        <div className="grid sm:grid-cols-3 gap-4">
          <FieldGroup label="Start Date" required>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => handleStartDate(e.target.value)}
              className={cn(inputClass, errors.startDate && "border-tvs-red-600")}
            />
            {errors.startDate && <ErrorMsg msg={errors.startDate} />}
          </FieldGroup>

          <FieldGroup label="End Date" required>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => set("endDate", e.target.value)}
              className={cn(inputClass, errors.endDate && "border-tvs-red-600")}
            />
            {errors.endDate && <ErrorMsg msg={errors.endDate} />}
          </FieldGroup>

          <FieldGroup label="Status" required>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as RideStatus)}
              className={selectClass}
            >
              {RIDE_STATUSES.map((s) => (
                <option key={s.value} value={s.value} className="bg-tvs-charcoal-900">
                  {s.label}
                </option>
              ))}
            </select>
          </FieldGroup>
        </div>
      </Section>

      {/* ── Section: Details ── */}
      <Section title="Details">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldGroup label="Short Description">
              <textarea
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                placeholder="One-line summary shown on ride cards (max 120 chars)"
                rows={2}
                maxLength={120}
                className={textareaClass}
              />
              <p className="text-[10px] text-tvs-charcoal-600 text-right mt-1">
                {form.shortDescription.length}/120
              </p>
            </FieldGroup>
          </div>

          <div className="sm:col-span-2">
            <FieldGroup label="Full Description">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Full ride description - shown on the ride detail page"
                rows={5}
                className={textareaClass}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Expected Riders">
            <input
              type="number"
              value={form.expectedRiders}
              onChange={(e) => set("expectedRiders", e.target.value)}
              placeholder="e.g. 30"
              min={1}
              max={500}
              className={inputClass}
            />
          </FieldGroup>

          <FieldGroup label="Registration Link">
            <input
              type="url"
              value={form.registrationLink}
              onChange={(e) => set("registrationLink", e.target.value)}
              placeholder="https://forms.gle/…"
              className={inputClass}
            />
          </FieldGroup>

          <FieldGroup label="Lead Marshal">
            <select
              value={form.marshalId}
              onChange={(e) => set("marshalId", e.target.value)}
              className={selectClass}
            >
              <option value="" className="bg-tvs-charcoal-900">- Select Marshal -</option>
              {marshals.map((m) => (
                <option key={m.id} value={m.id} className="bg-tvs-charcoal-900">
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </FieldGroup>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <span
              className={cn(
                "relative inline-flex size-5 items-center justify-center rounded border-2 transition-colors",
                form.isFeatured
                  ? "bg-tvs-red-600 border-tvs-red-600"
                  : "bg-transparent border-tvs-charcoal-600 group-hover:border-tvs-charcoal-400"
              )}
            >
              {form.isFeatured && (
                <span className="text-white text-xs font-bold">✓</span>
              )}
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
                className="sr-only"
              />
            </span>
            <span className="text-sm text-tvs-charcoal-300 group-hover:text-tvs-charcoal-50 transition-colors">
              Featured on homepage
            </span>
          </label>
        </div>
      </Section>

      {/* ── Section: Banner image ── */}
      <Section title="Banner Image">
        <p className="text-xs text-tvs-charcoal-500 -mt-2">
          Displayed on the ride detail page and ride cards. Stored in{" "}
          <code className="text-tvs-charcoal-400">ride-banners</code> bucket.
        </p>
        <ImageUpload
          bucket="ride-banners"
          currentUrl={form.bannerImageUrl}
          onUpload={(url) => set("bannerImageUrl", url)}
          compressMaxPx={1920}
          compressThresholdMb={0.5}
          cropAspect={16 / 9}
        />
      </Section>

      {/* ── Section: Route ── */}
      <Section title="Route">
        <p className="text-xs text-tvs-charcoal-500 -mt-2">
          Search locations using OpenStreetMap · Fetches road-following route from OSRM (free, no API key needed).
        </p>
        <RouteBuilder
          initialRouteData={routeData}
          onChange={setRouteData}
        />
      </Section>

      {/* ── Action bar ── */}
      <div className="flex items-center gap-3 pt-4 border-t border-tvs-charcoal-800/60">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 hover:text-tvs-charcoal-50 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || saved}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-all",
            saving || saved
              ? "bg-tvs-charcoal-700 text-tvs-charcoal-400 cursor-not-allowed"
              : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red"
          )}
        >
          <Save className="size-4" />
          {saving
            ? "Saving…"
            : saved
            ? "Saved ✓"
            : mode === "create"
            ? "Create Ride"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-tvs-charcoal-500">
          {title}
        </h3>
        <div className="flex-1 h-px bg-tvs-charcoal-800/60" />
      </div>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-tvs-red-400 mt-1">
      <AlertCircle className="size-3 shrink-0" />
      {msg}
    </p>
  );
}
