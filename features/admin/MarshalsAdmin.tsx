// =============================================================================
// MarshalsAdmin — standalone marshal management page
// All tiers in one place. Roles are free text with a few suggested defaults.
// =============================================================================

"use client";

import { useState }                          from "react";
import {
  Plus, Pencil, Trash2, X, Save,
  AlertCircle, Phone, Bike, AtSign, Shield,
} from "lucide-react";
import { ImageUpload }                       from "@/components/ui/ImageUpload";
import { cn }                                from "@/utils/cn";
import { saveMarshal, deleteMarshal }        from "@/lib/supabase/actions";
import type { Marshal }                      from "@/types";
import type { MarshalPayload }               from "@/lib/supabase/actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40 transition-colors"
);

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

function Spinner() {
  return <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />;
}

const PREDEFINED_ROLES = ["Head Marshal", "Senior Marshal", "Ride Marshal"] as const;

const ROLE_BADGE: Record<string, string> = {
  "Head Marshal":     "bg-hd-ember-900/60 text-hd-ember-400 border-hd-ember-800/40",
  "Senior Marshal":   "bg-amber-900/50 text-amber-400 border-amber-800/40",
  "Ride Marshal": "bg-blue-900/40 text-blue-400 border-blue-800/30",
};

// ---------------------------------------------------------------------------
// Marshal modal
// ---------------------------------------------------------------------------

const EMPTY: MarshalPayload = {
  name: "", phone: null, avatarUrl: null,
  role: "Ride Marshal", roleIconUrl: null, specialty: null, bio: null,
  totalRidesLed: 0, isActive: true, instagramHandle: null,
};

function MarshalModal({
  initial, title,
  onClose, onSaved,
}: {
  initial:  Partial<MarshalPayload>;
  title:    string;
  onClose:  () => void;
  onSaved:  () => void;
}) {
  const initRole       = initial.role ?? "Ride Marshal";
  const isPredefined   = (PREDEFINED_ROLES as readonly string[]).includes(initRole);
  const [form,         setForm]         = useState<MarshalPayload>({ ...EMPTY, ...initial });
  const [isCustomRole, setIsCustomRole] = useState(!isPredefined);
  const [customRole,   setCustomRole]   = useState(!isPredefined ? initRole : "");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const set = <K extends keyof MarshalPayload>(k: K, v: MarshalPayload[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleRoleSelect = (val: string) => {
    if (val === "__custom__") {
      setIsCustomRole(true);
      set("role", customRole || "");
    } else {
      setIsCustomRole(false);
      set("role", val);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    const effectiveRole = isCustomRole ? (customRole.trim() || "Ride Marshal") : form.role;
    setSaving(true); setError(null);
    const { error: err } = await saveMarshal({ ...form, role: effectiveRole });
    setSaving(false);
    if (err) { setError(err); return; }
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-hd-ink-900 border border-hd-ink-700 rounded-2xl shadow-cinematic">

        <div className="flex items-center justify-between p-5 border-b border-hd-ink-800">
          <h2 className="text-base font-bold text-hd-ink-50">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-hd-ink-400 hover:text-hd-ink-100 hover:bg-hd-ink-800 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40 text-hd-ember-300 text-sm">
              <AlertCircle className="size-4 shrink-0 mt-px" />{error}
            </div>
          )}

          {/* Avatar */}
          <div>
            <FieldLabel>Profile Photo</FieldLabel>
            <ImageUpload bucket="rider-avatars" currentUrl={form.avatarUrl} onUpload={(url) => set("avatarUrl", url)} compressMaxPx={400} compressThresholdMb={0.1} cropAspect={1} />
          </div>

          <div>
            <FieldLabel>Full Name *</FieldLabel>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. Ram Sharma" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Role Tier</FieldLabel>
              <select value={isCustomRole ? "__custom__" : form.role} onChange={(e) => handleRoleSelect(e.target.value)} className={cn(inputCls, "appearance-none")}>
                {PREDEFINED_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-hd-ink-900">{r}</option>
                ))}
                <option value="__custom__" className="bg-hd-ink-900">Custom…</option>
              </select>
            </div>
            <div>
              <FieldLabel>Rides Led</FieldLabel>
              <input type="number" min={0} value={form.totalRidesLed} onChange={(e) => set("totalRidesLed", parseInt(e.target.value) || 0)} className={inputCls} />
            </div>
          </div>

          {isCustomRole && (
            <div>
              <FieldLabel>Custom Role Title</FieldLabel>
              <input type="text" value={customRole} onChange={(e) => { setCustomRole(e.target.value); set("role", e.target.value); }} className={inputCls} placeholder="e.g. Technical Lead, Route Planner…" />
            </div>
          )}

          <div>
            <FieldLabel>Role Badge (optional)</FieldLabel>
            <ImageUpload
              bucket="rider-avatars"
              currentUrl={form.roleIconUrl}
              onUpload={(url) => set("roleIconUrl", url)}
              cropAspect={1}
              compressMaxPx={256}
            />
            <p className="mt-1 text-[10px] text-hd-ink-600">
              Square badge art for this role. Falls back to the role name when empty.
            </p>
          </div>

          <div>
            <FieldLabel>Specialties</FieldLabel>
            <input type="text" value={form.specialty ?? ""} onChange={(e) => set("specialty", e.target.value || null)} className={inputCls} placeholder="e.g. Navigation, High Altitude, First Aid" />
            <p className="mt-1 text-[10px] text-hd-ink-600">Comma-separated.</p>
          </div>

          <div>
            <FieldLabel>Phone</FieldLabel>
            <input type="tel" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} className={inputCls} placeholder="+977 98xxxxxxxx" />
          </div>

          <div>
            <FieldLabel>Instagram Handle</FieldLabel>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-hd-ink-500 pointer-events-none" />
              <input type="text" value={form.instagramHandle ?? ""} onChange={(e) => set("instagramHandle", e.target.value.replace(/^@/, "").trim() || null)} className={cn(inputCls, "pl-8")} placeholder="username (without @)" />
            </div>
          </div>

          <div>
            <FieldLabel>Bio</FieldLabel>
            <textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value || null)} rows={2} className={cn(inputCls, "h-auto resize-none py-2")} placeholder="Short intro…" />
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <button type="button" onClick={() => set("isActive", !form.isActive)} className={cn("relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0", form.isActive ? "bg-hd-ember-600" : "bg-hd-ink-700")}>
              <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200", form.isActive ? "translate-x-4" : "translate-x-0.5")} />
            </button>
            <span className="text-sm font-medium text-hd-ink-200">Active marshal</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-hd-ink-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-300 hover:text-hd-ink-100 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className={cn("flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold transition-all", saving ? "bg-hd-ink-700 cursor-not-allowed" : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember")}>
            {saving ? <><Spinner />Saving…</> : <><Save className="size-3.5" />Save Marshal</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete modal
// ---------------------------------------------------------------------------

function DeleteModal({ marshal, onClose, onDeleted }: { marshal: Marshal; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const handleDelete = async () => {
    setDeleting(true);
    const { error: err } = await deleteMarshal(marshal.id);
    setDeleting(false);
    if (err) { setError(err); return; }
    onDeleted(); onClose();
  };
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-hd-ink-900 border border-hd-ink-700 rounded-2xl shadow-cinematic p-6 space-y-4">
        <h2 className="text-base font-bold text-hd-ink-50">Remove Marshal?</h2>
        <p className="text-sm text-hd-ink-400">
          Remove <strong className="text-hd-ink-200">{marshal.name}</strong>? This cannot be undone.
        </p>
        {error && <p className="text-sm text-hd-ember-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-hd-ink-700 text-hd-ink-300 hover:text-hd-ink-100 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 rounded-lg bg-hd-ember-700 hover:bg-hd-ember-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Marshal row
// ---------------------------------------------------------------------------

function MarshalRow({ marshal, onEdit, onDelete }: { marshal: Marshal; onEdit: () => void; onDelete: () => void }) {
  const badgeCls = ROLE_BADGE[marshal.role] ?? "bg-hd-ink-800 text-hd-ink-400 border-hd-ink-700";
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all", marshal.isActive ? "border-hd-ink-700/60 bg-hd-ink-800/40" : "border-hd-ink-800/40 bg-hd-ink-900/60 opacity-60")}>
      {/* Avatar */}
      {marshal.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={marshal.avatarUrl} alt={marshal.name} className="size-9 rounded-lg object-cover shrink-0 border border-hd-ink-700" />
      ) : (
        <div className="size-9 rounded-lg bg-hd-ink-700 border border-hd-ink-600 flex items-center justify-center shrink-0 text-xs font-bold text-hd-ink-400">
          {marshal.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-hd-ink-100 truncate">{marshal.name}</span>
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide shrink-0", badgeCls)}>{marshal.role}</span>
          {!marshal.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded border bg-hd-ink-800 text-hd-ink-600 border-hd-ink-700">Inactive</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-hd-ink-500 flex-wrap">
          {marshal.totalRidesLed > 0 && <span className="flex items-center gap-1"><Bike className="size-2.5" />{marshal.totalRidesLed} rides</span>}
          {marshal.phone && <span className="flex items-center gap-1"><Phone className="size-2.5" />{marshal.phone}</span>}
          {marshal.instagramHandle && <span className="flex items-center gap-1"><AtSign className="size-2.5" />{marshal.instagramHandle}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-hd-ink-500 hover:text-hd-ink-100 hover:bg-hd-ink-700 transition-colors"><Pencil className="size-3.5" /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-hd-ink-500 hover:text-hd-ember-400 hover:bg-hd-ember-950/40 transition-colors"><Trash2 className="size-3.5" /></button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier section
// ---------------------------------------------------------------------------

function TierSection({ label, color, marshals, onEdit, onDelete }: {
  label:    string;
  color:    string;
  marshals: Marshal[];
  onEdit:   (m: Marshal) => void;
  onDelete: (m: Marshal) => void;
}) {
  if (marshals.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn("block w-3 h-px rounded-full", color)} />
        <span className={cn("text-xs font-semibold uppercase tracking-widest", color === "bg-hd-ember-600" ? "text-hd-ember-400" : color === "bg-amber-600" ? "text-amber-500" : "text-blue-400")}>
          {label} ({marshals.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {marshals.map((m) => (
          <MarshalRow key={m.id} marshal={m} onEdit={() => onEdit(m)} onDelete={() => onDelete(m)} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MarshalsAdmin({ initialMarshals }: { initialMarshals: Marshal[] }) {
  const [adding,  setAdding]  = useState(false);
  const [editing, setEditing] = useState<Marshal | null>(null);
  const [deleting,setDeleting]= useState<Marshal | null>(null);

  const onSaved = () => window.location.reload();

  const head     = initialMarshals.filter((m) => m.role === "Head Marshal");
  const senior   = initialMarshals.filter((m) => m.role === "Senior Marshal");
  const regional = initialMarshals.filter((m) => m.role === "Ride Marshal");
  const other    = initialMarshals.filter((m) => !["Head Marshal","Senior Marshal","Ride Marshal"].includes(m.role));

  return (
    <>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-hd-ember-900/40 border border-hd-ember-800/40 flex items-center justify-center">
            <Shield className="size-5 text-hd-ember-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-hd-ink-50">{initialMarshals.length} total marshals</p>
            <p className="text-xs text-hd-ink-500">{initialMarshals.filter(m => m.isActive).length} active</p>
          </div>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-all hover:shadow-glow-ember">
          <Plus className="size-4" />Add Marshal
        </button>
      </div>

      <div className="space-y-8 max-w-2xl">
        <TierSection label="Head Marshal"     color="bg-hd-ember-600"   marshals={head}     onEdit={setEditing} onDelete={setDeleting} />
        <TierSection label="Senior Marshals"  color="bg-amber-600"     marshals={senior}   onEdit={setEditing} onDelete={setDeleting} />
        <TierSection label="Ride Marshals"color="bg-blue-600"      marshals={regional} onEdit={setEditing} onDelete={setDeleting} />
        <TierSection label="Other Marshals"   color="bg-hd-ink-500" marshals={other} onEdit={setEditing} onDelete={setDeleting} />
        {initialMarshals.length === 0 && (
          <p className="text-sm text-hd-ink-600 text-center py-12">
            No marshals yet — click Add Marshal to get started.
          </p>
        )}
      </div>

      {adding && (
        <MarshalModal initial={EMPTY} title="Add Marshal" onClose={() => setAdding(false)} onSaved={onSaved} />
      )}
      {editing && (
        <MarshalModal
          initial={{ id: editing.id, name: editing.name, phone: editing.phone, avatarUrl: editing.avatarUrl, role: editing.role, roleIconUrl: editing.roleIconUrl, specialty: editing.specialty, bio: editing.bio, totalRidesLed: editing.totalRidesLed, isActive: editing.isActive, instagramHandle: editing.instagramHandle }}
          title={`Edit — ${editing.name}`}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
      {deleting && (
        <DeleteModal marshal={deleting} onClose={() => setDeleting(null)} onDeleted={onSaved} />
      )}
    </>
  );
}
