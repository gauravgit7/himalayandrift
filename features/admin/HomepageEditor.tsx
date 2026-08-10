// =============================================================================
// HomepageEditor - Phase 5 · Admin editor for homepage content
// 'use client' - controlled form state
// Phase 6 wires save to Supabase
// =============================================================================

"use client";

import { useState }              from "react";
import { Save, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Link                      from "next/link";
import { cn }                    from "@/utils/cn";
import { ROUTES, APP_META }      from "@/lib/constants";
import { saveHomepageContent }   from "@/lib/supabase/actions";
import type { HomepageContent, Ride } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HomepageEditorProps {
  initialContent: HomepageContent;
  allRides:       Ride[];
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-sm",
  "text-tvs-charcoal-100 placeholder:text-tvs-charcoal-600",
  "focus:outline-none focus:border-tvs-red-600 focus:ring-1 focus:ring-tvs-red-600/40 transition-colors"
);

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-tvs-charcoal-400 uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 p-5 rounded-xl gradient-card border border-tvs-charcoal-700/60">
      <h3 className="text-sm font-bold text-tvs-charcoal-50">{title}</h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ride selector row
// ---------------------------------------------------------------------------

function RideSelector({
  label,
  selectedId,
  rides,
  onChange,
}: {
  label:      string;
  selectedId: string | null;
  rides:      Ride[];
  onChange:   (id: string | null) => void;
}) {
  const selected = rides.find((r) => r.id === selectedId);

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(inputCls, "appearance-none")}
      >
        <option value="" className="bg-tvs-charcoal-900">- None -</option>
        {rides.map((r) => (
          <option key={r.id} value={r.id} className="bg-tvs-charcoal-900">
            {r.title} ({r.startDate})
          </option>
        ))}
      </select>
      {selected && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-tvs-charcoal-800/60 border border-tvs-charcoal-700/40">
          <span className="text-xs text-tvs-charcoal-200 truncate">{selected.title}</span>
          <span className="text-xs text-tvs-charcoal-500 ml-auto">{selected.startDate}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HomepageEditor({ initialContent, allRides }: HomepageEditorProps) {
  const [content,     setContent]     = useState<HomepageContent>(initialContent);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setHero = <K extends keyof HomepageContent["heroBanner"]>(
    key: K,
    val: HomepageContent["heroBanner"][K]
  ) => {
    setContent((prev) => ({
      ...prev,
      heroBanner: { ...prev.heroBanner, [key]: val },
    }));
    setSaved(false);
    setServerError(null);
  };

  const setTop = <K extends keyof HomepageContent>(
    key: K,
    val: HomepageContent[K]
  ) => {
    setContent((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
    setServerError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setServerError(null);
    const { error } = await saveHomepageContent(content);
    setSaving(false);
    if (error) {
      setServerError(error);
    } else {
      setSaved(true);
    }
  };

  const featuredRide = allRides.find(
    (r) => r.id === content.heroBanner.featuredRideId
  );

  return (
    <div className="space-y-6">
      {/* ── Server error ── */}
      {serverError && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-tvs-red-950/60 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
          <AlertCircle className="size-4 shrink-0 mt-px" />
          {serverError}
        </div>
      )}

      {/* ── Save success ── */}
      {saved && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-sm">
          <CheckCircle2 className="size-4 shrink-0" />
          Homepage content saved to Supabase
        </div>
      )}

      {/* ── Hero Banner section ── */}
      <Section title="🎬 Hero Banner">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel>Headline Title</FieldLabel>
            <input
              type="text"
              value={content.heroBanner.title}
              onChange={(e) => setHero("title", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Subtitle</FieldLabel>
            <input
              type="text"
              value={content.heroBanner.subtitle}
              onChange={(e) => setHero("subtitle", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <FieldLabel>Primary CTA Label</FieldLabel>
            <input
              type="text"
              value={content.heroBanner.primaryCTALabel}
              onChange={(e) => setHero("primaryCTALabel", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <FieldLabel>Primary CTA Link</FieldLabel>
            <input
              type="text"
              value={content.heroBanner.primaryCTALink}
              onChange={(e) => setHero("primaryCTALink", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <FieldLabel>Secondary CTA Label</FieldLabel>
            <input
              type="text"
              value={content.heroBanner.secondaryCTALabel ?? ""}
              onChange={(e) => setHero("secondaryCTALabel", e.target.value || null)}
              className={inputCls}
              placeholder="Optional"
            />
          </div>
          <div>
            <FieldLabel>Secondary CTA Link</FieldLabel>
            <input
              type="text"
              value={content.heroBanner.secondaryCTALink ?? ""}
              onChange={(e) => setHero("secondaryCTALink", e.target.value || null)}
              className={inputCls}
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <RideSelector
              label="Featured Ride (shown in hero card)"
              selectedId={content.heroBanner.featuredRideId}
              rides={allRides}
              onChange={(id) => setHero("featuredRideId", id)}
            />
          </div>
        </div>
      </Section>

      {/* ── Featured rides section ── */}
      <Section title="🏍️ Featured Upcoming Rides">
        <p className="text-xs text-tvs-charcoal-500 -mt-2">
          Up to 4 ride IDs shown in the &quot;upcoming rides&quot; homepage section.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((idx) => {
            const rideId = content.featuredUpcomingRideIds[idx] ?? null;
            return (
              <RideSelector
                key={idx}
                label={`Slot ${idx + 1}`}
                selectedId={rideId}
                rides={allRides}
                onChange={(id) => {
                  const next = [...content.featuredUpcomingRideIds];
                  if (id) next[idx] = id;
                  else next.splice(idx, 1);
                  setTop("featuredUpcomingRideIds", next.filter(Boolean));
                }}
              />
            );
          })}
        </div>
      </Section>

      {/* ── Visibility toggles ── */}
      <Section title="⚙️ Visibility Settings">
        <div className="space-y-3">
          {[
            { key: "showWeatherWidget"  as const, label: "Show weather widget", sub: "OpenWeather integration (Phase 7)" },
            { key: "showSponsorShowcase" as const, label: "Show sponsor showcase", sub: "Logos from Supabase Storage" },
          ].map(({ key, label, sub }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => setTop(key, !content[key])}
                className={cn(
                  "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
                  content[key] ? "bg-tvs-red-600" : "bg-tvs-charcoal-700"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200",
                    content[key] ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-tvs-charcoal-200 group-hover:text-tvs-charcoal-50 transition-colors">
                  {label}
                </p>
                <p className="text-xs text-tvs-charcoal-600">{sub}</p>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* ── Banner image + overlay opacity ── */}
      <Section title="🖼️ Hero Background Image">
        <p className="text-xs text-tvs-charcoal-500 -mt-2">
          Full-viewport background shown behind the hero text. Stored in{" "}
          <code className="text-tvs-charcoal-400">hero-banners</code> bucket.
        </p>
        <ImageUpload
          bucket="hero-banners"
          currentUrl={content.heroBanner.backgroundImageUrl}
          onUpload={(url) => setHero("backgroundImageUrl", url)}
          compressMaxPx={2560}
          compressThresholdMb={0.8}
        />
        {/* Overlay opacity - only meaningful when a photo is set */}
        <div className="mt-4">
          <FieldLabel>
            Photo Overlay Darkness -{" "}
            <span className="text-tvs-charcoal-300 font-mono">
              {Math.round(content.heroBanner.overlayOpacity * 100)}%
            </span>
          </FieldLabel>
          <p className="text-[11px] text-tvs-charcoal-600 mb-2">
            Higher = darker overlay, better text contrast over bright photos.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-tvs-charcoal-600">0%</span>
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={content.heroBanner.overlayOpacity}
              onChange={(e) => setHero("overlayOpacity", parseFloat(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-tvs-red-600"
            />
            <span className="text-[10px] text-tvs-charcoal-600">90%</span>
          </div>
        </div>
      </Section>

      {/* ── Brand logo ── */}
      <Section title="🏷️ Brand Logo">
        <p className="text-xs text-tvs-charcoal-500 -mt-2">
          The uploaded logo appears in the navbar, hero, footer, membership cards and
          exports. Leave empty to use the default text/icon fallback. Stored in the{" "}
          <code className="text-tvs-charcoal-400">brand-logos</code> bucket.
        </p>
        <div>
          <FieldLabel>{APP_META.name} Logo</FieldLabel>
          <ImageUpload
            bucket="brand-logos"
            currentUrl={content.brandLogos.logoUrl}
            onUpload={(url) => setTop("brandLogos", { logoUrl: url })}
            compressMaxPx={0}
          />
        </div>
      </Section>

      {/* ── Action bar ── */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href={ROUTES.home}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 hover:text-tvs-charcoal-50 text-sm font-medium transition-colors"
        >
          <Eye className="size-4" />
          Preview Homepage
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-all",
            saving || saved
              ? "bg-tvs-charcoal-700 text-tvs-charcoal-400 cursor-not-allowed"
              : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red"
          )}
        >
          <Save className="size-4" />
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Homepage"}
        </button>
      </div>
    </div>
  );
}
