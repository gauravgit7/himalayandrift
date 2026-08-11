// =============================================================================
// SeriesAdmin - CRUD for named ride series
// 'use client' - modal state lives here
// =============================================================================

"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, AlertCircle, Layers } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { cn } from "@/utils/cn";
import { saveSeries, deleteSeries } from "@/lib/supabase/actions";
import type { SeriesPayload } from "@/lib/supabase/actions";
import type { Series } from "@/types";

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
);

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] uppercase tracking-wide text-hd-ink-500 mb-1">
      {children}
    </label>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const EMPTY: SeriesPayload = { name: "", slug: "", description: null, bannerUrl: null };

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

function SeriesModal({
  initial, title, onClose, onSaved,
}: {
  initial: SeriesPayload;
  title:   string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form,    setForm]    = useState<SeriesPayload>(initial);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  // Once the slug has been hand-edited, stop deriving it from the name.
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);

  const set = <K extends keyof SeriesPayload>(k: K, v: SeriesPayload[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleName = (name: string) => {
    setForm((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError(null);
    const { error: err } = await saveSeries(form);
    setSaving(false);
    if (err) { setError(err); return; }
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-hd-ink-900 border border-hd-ink-700 shadow-cinematic max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hd-ink-800">
          <h2 className="text-sm font-bold text-hd-ink-50">{title}</h2>
          <button onClick={onClose} className="text-hd-ink-500 hover:text-hd-ink-200 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
              <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
              <p className="text-sm text-hd-ember-300">{error}</p>
            </div>
          )}

          <div>
            <FieldLabel>Name *</FieldLabel>
            <input
              type="text" value={form.name}
              onChange={(e) => handleName(e.target.value)}
              className={inputCls} placeholder="e.g. Drift in the Mist"
            />
          </div>

          <div>
            <FieldLabel>URL Slug</FieldLabel>
            <input
              type="text" value={form.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
              className={inputCls} placeholder="drift-in-the-mist"
            />
            <p className="mt-1 text-[10px] text-hd-ink-600">
              The series lives at /series/{form.slug || "…"}. Changing it breaks existing links.
            </p>
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
              rows={3}
              className={cn(inputCls, "h-auto py-2 resize-y")}
              placeholder="What makes this series its own thing?"
            />
          </div>

          <div>
            <FieldLabel>Banner</FieldLabel>
            <ImageUpload
              bucket="ride-banners"
              currentUrl={form.bannerUrl}
              onUpload={(url) => set("bannerUrl", url)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-hd-ink-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-hd-ink-400 hover:text-hd-ink-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            <Save className="size-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm
// ---------------------------------------------------------------------------

function DeleteModal({
  series, onClose, onDeleted,
}: {
  series: Series;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true); setError(null);
    const res = await deleteSeries(series.id);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onDeleted(); onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-hd-ink-900 border border-hd-ink-700 p-5 space-y-4">
        <h2 className="text-sm font-bold text-hd-ink-50">Delete “{series.name}”?</h2>
        <p className="text-xs text-hd-ink-400 leading-relaxed">
          Rides in this series are <strong className="text-hd-ink-200">not</strong> deleted —
          they stay on the calendar as standalone rides and lose their volume number.
        </p>
        {error && <p className="text-xs text-hd-ember-400">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-hd-ink-400 hover:text-hd-ink-100">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            <Trash2 className="size-4" />
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function SeriesAdmin({
  initialSeries,
  rideCounts,
}: {
  initialSeries: Series[];
  rideCounts:    Record<string, number>;
}) {
  const [adding,   setAdding]   = useState(false);
  const [editing,  setEditing]  = useState<Series | null>(null);
  const [deleting, setDeleting] = useState<Series | null>(null);

  // Server Actions revalidate the path; a refresh pulls the new list.
  const onSaved = () => window.location.reload();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-hd-ink-500">
          {initialSeries.length} series
        </p>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white font-semibold text-sm transition-colors"
        >
          <Plus className="size-4" />
          Add Series
        </button>
      </div>

      {initialSeries.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-hd-ink-800/60 gradient-card">
          <Layers className="size-10 mx-auto mb-3 text-hd-ink-700" />
          <p className="text-sm text-hd-ink-500">No series yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {initialSeries.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 p-3 rounded-xl gradient-card border border-hd-ink-700/60"
            >
              {s.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.bannerUrl} alt="" className="size-11 rounded-lg object-cover shrink-0 border border-hd-ink-700" />
              ) : (
                <div className="size-11 rounded-lg bg-hd-ink-800 border border-hd-ink-700 flex items-center justify-center shrink-0">
                  <Layers className="size-4 text-hd-ink-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-hd-ink-100 truncate">{s.name}</p>
                <p className="text-[10px] text-hd-ink-600 truncate">/series/{s.slug}</p>
              </div>

              <span className="text-[10px] text-hd-ink-500 shrink-0">
                {rideCounts[s.id] ?? 0} volume{(rideCounts[s.id] ?? 0) === 1 ? "" : "s"}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing(s)}
                  className="p-2 rounded-lg text-hd-ink-500 hover:text-hd-ink-100 hover:bg-hd-ink-800 transition-colors"
                  aria-label={`Edit ${s.name}`}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => setDeleting(s)}
                  className="p-2 rounded-lg text-hd-ink-500 hover:text-red-400 hover:bg-hd-ink-800 transition-colors"
                  aria-label={`Delete ${s.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <SeriesModal initial={EMPTY} title="Add Series" onClose={() => setAdding(false)} onSaved={onSaved} />
      )}
      {editing && (
        <SeriesModal
          initial={{
            id: editing.id, name: editing.name, slug: editing.slug,
            description: editing.description, bannerUrl: editing.bannerUrl,
          }}
          title={`Edit — ${editing.name}`}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
      {deleting && (
        <DeleteModal series={deleting} onClose={() => setDeleting(null)} onDeleted={onSaved} />
      )}
    </div>
  );
}
