// =============================================================================
// SponsorsManager - Admin CRUD for sponsors
// 'use client' - modal state + controlled form
// =============================================================================

"use client";

import { useState }            from "react";
import { Plus, Pencil, Trash2, X, Save, AlertCircle, CheckCircle2, Globe } from "lucide-react";
import { ImageUpload }         from "@/components/ui/ImageUpload";
import { cn }                  from "@/utils/cn";
import { saveSponsor, deleteSponsor } from "@/lib/supabase/actions";
import type { Sponsor }        from "@/types";
import type { SponsorPayload } from "@/lib/supabase/actions";

// ---------------------------------------------------------------------------
// Helpers
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

const TIER_OPTIONS: { value: SponsorPayload["tier"]; label: string; color: string }[] = [
  { value: "title",     label: "Title Sponsor",     color: "text-yellow-400"       },
  { value: "co",        label: "Co-Sponsor",         color: "text-tvs-charcoal-200" },
  { value: "associate", label: "Associate Sponsor",  color: "text-tvs-charcoal-400" },
  { value: "media",     label: "Media Partner",      color: "text-tvs-steel-400"    },
];

const TIER_BADGE: Record<string, string> = {
  title:     "bg-yellow-900/50 text-yellow-400 border-yellow-800/40",
  co:        "bg-tvs-charcoal-700/60 text-tvs-charcoal-200 border-tvs-charcoal-600/40",
  associate: "bg-tvs-charcoal-800/60 text-tvs-charcoal-400 border-tvs-charcoal-700/40",
  media:     "bg-tvs-steel-900/50 text-tvs-steel-400 border-tvs-steel-800/40",
};

// ---------------------------------------------------------------------------
// Empty form factory
// ---------------------------------------------------------------------------

const EMPTY_FORM: SponsorPayload = {
  name:        "",
  logoUrl:     null,
  description: null,
  websiteUrl:  null,
  tier:        "associate",
  isActive:    true,
};

// ---------------------------------------------------------------------------
// Edit / Add Modal
// ---------------------------------------------------------------------------

interface ModalProps {
  initial:   SponsorPayload;
  title:     string;
  onClose:   () => void;
  onSaved:   () => void;
}

function SponsorModal({ initial, title, onClose, onSaved }: ModalProps) {
  const [form,    setForm]    = useState<SponsorPayload>(initial);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = <K extends keyof SponsorPayload>(k: K, v: SponsorPayload[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await saveSponsor(form);
    setSaving(false);
    if (err) { setError(err); return; }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-tvs-charcoal-900 border border-tvs-charcoal-700 rounded-2xl shadow-cinematic">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-tvs-charcoal-800">
          <h2 className="text-base font-bold text-tvs-charcoal-50">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-tvs-charcoal-400 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-800 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
              <AlertCircle className="size-4 shrink-0 mt-px" />
              {error}
            </div>
          )}

          <div>
            <FieldLabel>Sponsor Name *</FieldLabel>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. Nepal Oil Corporation" />
          </div>

          <div>
            <FieldLabel>Tier</FieldLabel>
            <select value={form.tier} onChange={(e) => set("tier", e.target.value as SponsorPayload["tier"])} className={cn(inputCls, "appearance-none")}>
              {TIER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-tvs-charcoal-900">{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
              rows={2}
              className={cn(inputCls, "h-auto resize-none py-2")}
              placeholder="Short description of the sponsorship…"
            />
          </div>

          <div>
            <FieldLabel>Website URL</FieldLabel>
            <input type="url" value={form.websiteUrl ?? ""} onChange={(e) => set("websiteUrl", e.target.value || null)} className={inputCls} placeholder="https://example.com" />
          </div>

          <div>
            <FieldLabel>Logo</FieldLabel>
            <ImageUpload bucket="sponsor-logos" currentUrl={form.logoUrl} onUpload={(url) => set("logoUrl", url)} compressMaxPx={0} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
                form.isActive ? "bg-tvs-red-600" : "bg-tvs-charcoal-700"
              )}
            >
              <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200", form.isActive ? "translate-x-4" : "translate-x-0.5")} />
            </button>
            <span className="text-sm font-medium text-tvs-charcoal-200">Active (shown on homepage)</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-tvs-charcoal-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 hover:text-tvs-charcoal-100 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold transition-all",
              saving ? "bg-tvs-charcoal-700 cursor-not-allowed" : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red"
            )}
          >
            {saving ? (
              <><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
            ) : (
              <><Save className="size-3.5" />Save Sponsor</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm modal
// ---------------------------------------------------------------------------

function DeleteModal({ sponsor, onClose, onDeleted }: { sponsor: Sponsor; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    const { error: err } = await deleteSponsor(sponsor.id);
    setDeleting(false);
    if (err) { setError(err); return; }
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-tvs-charcoal-900 border border-tvs-charcoal-700 rounded-2xl shadow-cinematic p-6 space-y-4">
        <h2 className="text-base font-bold text-tvs-charcoal-50">Delete Sponsor?</h2>
        <p className="text-sm text-tvs-charcoal-400">
          Remove <strong className="text-tvs-charcoal-200">{sponsor.name}</strong> permanently? This cannot be undone.
        </p>
        {error && <p className="text-sm text-tvs-red-400">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-tvs-charcoal-700 text-tvs-charcoal-300 hover:text-tvs-charcoal-100 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 rounded-lg bg-tvs-red-700 hover:bg-tvs-red-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SponsorsManagerProps {
  initialSponsors: Sponsor[];
}

export function SponsorsManager({ initialSponsors }: SponsorsManagerProps) {
  const [sponsors,     setSponsors]     = useState<Sponsor[]>(initialSponsors);
  const [addOpen,      setAddOpen]      = useState(false);
  const [editSponsor,  setEditSponsor]  = useState<Sponsor | null>(null);
  const [deleteSponsorItem, setDeleteSponsorItem] = useState<Sponsor | null>(null);
  const [flashId,      setFlashId]      = useState<string | null>(null);

  // After a save/delete we just reload to get fresh data - simpler than optimistic updates
  const onSaved  = () => { window.location.reload(); };
  const onDeleted = () => { window.location.reload(); };

  return (
    <>
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-tvs-charcoal-400">{sponsors.length} sponsors</p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tvs-red-600 hover:bg-tvs-red-500 text-white text-sm font-semibold transition-all hover:shadow-glow-red"
        >
          <Plus className="size-4" />
          Add Sponsor
        </button>
      </div>

      {/* Sponsors list */}
      <div className="space-y-3 max-w-2xl">
        {sponsors.length === 0 && (
          <div className="text-center py-12 text-tvs-charcoal-600 text-sm">
            No sponsors yet - click Add Sponsor to get started.
          </div>
        )}

        {sponsors.map((sponsor) => (
          <div
            key={sponsor.id}
            className="flex items-center gap-4 p-4 rounded-xl gradient-card border border-tvs-charcoal-700/60"
          >
            {/* Logo */}
            {sponsor.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsor.logoUrl} alt={sponsor.name} className="size-12 rounded-lg object-contain bg-tvs-charcoal-800 p-1 shrink-0 border border-tvs-charcoal-700" />
            ) : (
              <div className="size-12 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 flex items-center justify-center shrink-0 text-sm font-bold text-tvs-charcoal-500">
                {sponsor.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-tvs-charcoal-100">{sponsor.name}</p>
                <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide", TIER_BADGE[sponsor.tier])}>
                  {sponsor.tier}
                </span>
                {!sponsor.logoUrl && <span className="text-[9px] text-tvs-charcoal-600 border border-tvs-charcoal-700 px-1.5 py-0.5 rounded">no logo</span>}
              </div>
              {sponsor.description && (
                <p className="text-xs text-tvs-charcoal-500 mt-0.5 truncate">{sponsor.description}</p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {sponsor.websiteUrl && (
                <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-tvs-charcoal-500 hover:text-tvs-steel-400 hover:bg-tvs-charcoal-800 transition-colors" title="Visit website">
                  <Globe className="size-3.5" />
                </a>
              )}
              <button onClick={() => setEditSponsor(sponsor)} className="p-1.5 rounded-lg text-tvs-charcoal-500 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-800 transition-colors" title="Edit">
                <Pencil className="size-3.5" />
              </button>
              <button onClick={() => setDeleteSponsorItem(sponsor)} className="p-1.5 rounded-lg text-tvs-charcoal-500 hover:text-tvs-red-400 hover:bg-tvs-red-950/40 transition-colors" title="Delete">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {addOpen && (
        <SponsorModal initial={EMPTY_FORM} title="Add Sponsor" onClose={() => setAddOpen(false)} onSaved={onSaved} />
      )}
      {editSponsor && (
        <SponsorModal
          initial={{ id: editSponsor.id, name: editSponsor.name, logoUrl: editSponsor.logoUrl, description: editSponsor.description, websiteUrl: editSponsor.websiteUrl, tier: editSponsor.tier, isActive: true }}
          title={`Edit - ${editSponsor.name}`}
          onClose={() => setEditSponsor(null)}
          onSaved={onSaved}
        />
      )}
      {deleteSponsorItem && (
        <DeleteModal sponsor={deleteSponsorItem} onClose={() => setDeleteSponsorItem(null)} onDeleted={onDeleted} />
      )}
    </>
  );
}
