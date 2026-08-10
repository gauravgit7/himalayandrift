// =============================================================================
// ChapterEditor - Admin editor for chapter details only
// Marshal management has moved to /admin/marshals
// =============================================================================

"use client";

import { useState }                       from "react";
import {
  Pencil, X, Save, CheckCircle2, AlertCircle, ImageIcon,
} from "lucide-react";
import { ImageUpload }                    from "@/components/ui/ImageUpload";
import { cn }                             from "@/utils/cn";
import { saveChapter }                    from "@/lib/supabase/actions";
import type { Chapter }                   from "@/types";
import type { ChapterPayload }            from "@/lib/supabase/actions";

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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
          checked ? "bg-tvs-red-600" : "bg-tvs-charcoal-700"
        )}
      >
        <span className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0.5"
        )} />
      </button>
      <span className="text-sm font-medium text-tvs-charcoal-200 group-hover:text-tvs-charcoal-50 transition-colors">
        {label}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Chapter edit modal
// ---------------------------------------------------------------------------

function ChapterModal({ chapter, onClose, onSaved }: {
  chapter:  Chapter;
  onClose:  () => void;
  onSaved:  (id: string) => void;
}) {
  const [form, setForm] = useState<ChapterPayload>({
    id:            chapter.id,
    region:        chapter.region,
    description:   chapter.description ?? "",
    coverImageUrl: chapter.coverImageUrl,
    memberCount:   chapter.memberCount,
    isActive:      chapter.isActive,
    isPriority:    chapter.isPriority,
    coordinates:   chapter.coordinates
      ? { lng: chapter.coordinates[0], lat: chapter.coordinates[1] }
      : null,
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const set = <K extends keyof ChapterPayload>(k: K, v: ChapterPayload[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(null);
    const { error: err } = await saveChapter(form);
    setSaving(false);
    if (err) { setError(err); return; }
    onSaved(chapter.id); onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-tvs-charcoal-900 border border-tvs-charcoal-700 rounded-2xl shadow-cinematic">

        <div className="flex items-center justify-between p-5 border-b border-tvs-charcoal-800">
          <div>
            <h2 className="text-base font-bold text-tvs-charcoal-50">{chapter.name} Chapter</h2>
            <p className="text-xs text-tvs-charcoal-500 mt-0.5">Edit chapter details</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-tvs-charcoal-400 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-800 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-tvs-red-950/60 border border-tvs-red-800/40 text-tvs-red-300 text-sm">
              <AlertCircle className="size-4 shrink-0 mt-px" />{error}
            </div>
          )}

          <div>
            <FieldLabel>Region / Province</FieldLabel>
            <input type="text" value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls} />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value || null)} rows={3} className={cn(inputCls, "h-auto resize-none py-2")} placeholder="Chapter overview, focus, riding culture…" />
          </div>

          <div>
            <FieldLabel>Member Count</FieldLabel>
            <input type="number" min={0} value={form.memberCount} onChange={(e) => set("memberCount", parseInt(e.target.value) || 0)} className={inputCls} />
          </div>

          <div>
            <FieldLabel>Cover Image</FieldLabel>
            <ImageUpload bucket="rider-avatars" currentUrl={form.coverImageUrl} onUpload={(url) => set("coverImageUrl", url)} compressMaxPx={1200} compressThresholdMb={0.4} cropAspect={16 / 9} />
          </div>

          <div>
            <FieldLabel>HQ Coordinates</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-tvs-charcoal-600 mb-1">Longitude</p>
                <input type="number" step="0.0001" value={form.coordinates?.lng ?? ""} onChange={(e) => set("coordinates", { lng: parseFloat(e.target.value) || 0, lat: form.coordinates?.lat ?? 0 })} className={inputCls} placeholder="85.3240" />
              </div>
              <div>
                <p className="text-[10px] text-tvs-charcoal-600 mb-1">Latitude</p>
                <input type="number" step="0.0001" value={form.coordinates?.lat ?? ""} onChange={(e) => set("coordinates", { lng: form.coordinates?.lng ?? 0, lat: parseFloat(e.target.value) || 0 })} className={inputCls} placeholder="27.7172" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <Toggle checked={form.isActive}   onChange={(v) => set("isActive", v)}   label="Chapter is active" />
            <Toggle checked={form.isPriority} onChange={(v) => set("isPriority", v)} label="Priority chapter" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-tvs-charcoal-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 hover:text-tvs-charcoal-100 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className={cn("flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold transition-all", saving ? "bg-tvs-charcoal-700 cursor-not-allowed" : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red")}>
            {saving
              ? <><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              : <><Save className="size-3.5" />Save Chapter</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChapterEditor({ chapters }: { chapters: Chapter[] }) {
  const [editChapterId, setEditChapterId] = useState<string | null>(null);
  const [savedId,       setSavedId]       = useState<string | null>(null);

  const editingChapter = chapters.find((c) => c.id === editChapterId) ?? null;

  const flash = (id: string) => {
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2500);
  };

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className={cn(
              "relative flex flex-col gap-3 p-5 rounded-xl gradient-card border transition-all",
              chapter.isPriority ? "border-tvs-red-800/40" : "border-tvs-charcoal-700",
            )}
          >
            {savedId === chapter.id && (
              <div className="absolute inset-0 rounded-xl border-2 border-emerald-500/40 pointer-events-none animate-pulse" />
            )}

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-tvs-charcoal-50">{chapter.name}</h3>
                  {chapter.isPriority && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-tvs-red-900/60 text-tvs-red-400 border border-tvs-red-800/40">Priority</span>
                  )}
                </div>
                <p className="text-xs text-tvs-charcoal-500">{chapter.region}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", chapter.isActive ? "bg-emerald-500" : "bg-tvs-charcoal-600")} />
                <button
                  onClick={() => setEditChapterId(chapter.id)}
                  className="p-1.5 rounded-lg text-tvs-charcoal-500 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-700 transition-colors"
                  title={`Edit ${chapter.name}`}
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Cover */}
            {chapter.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={chapter.coverImageUrl} alt={chapter.name} className="w-full h-24 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-24 rounded-lg bg-tvs-charcoal-800 border border-tvs-charcoal-700 flex items-center justify-center">
                <ImageIcon className="size-5 text-tvs-charcoal-600" />
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-tvs-charcoal-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
              {chapter.description ?? "No description yet."}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-tvs-charcoal-800/60 text-xs text-tvs-charcoal-400">
              <span><strong className="text-tvs-charcoal-50">{chapter.memberCount}</strong> riders</span>
              <span><strong className="text-tvs-charcoal-50">{chapter.totalRidesThisYear}</strong> rides</span>
              {savedId === chapter.id && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="size-3" />Saved
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingChapter && (
        <ChapterModal
          chapter={editingChapter}
          onClose={() => setEditChapterId(null)}
          onSaved={flash}
        />
      )}
    </>
  );
}
