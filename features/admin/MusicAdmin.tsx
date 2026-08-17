// =============================================================================
// MusicAdmin — the song library
// 'use client'
//
// The anthem used to be one song in one row, which is the right shape for
// exactly one song and the wrong shape for two. This is the list: the master
// switch for whether the player appears at all, the running order, and which
// song wears the anthem badge. Editing one opens AnthemAdmin, which still owns
// the interesting part — the tap-along lyric sync.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  Music, Plus, Pencil, Trash2, Star, ChevronUp, ChevronDown,
  AlertCircle, EyeOff, ArrowLeft, Radio,
} from "lucide-react";
import { cn }           from "@/utils/cn";
import { AnthemAdmin }  from "@/features/admin/AnthemAdmin";
import {
  deleteAnthemTrack, reorderAnthemTracks, setAnthemEnabled,
} from "@/lib/supabase/actions";
import type { AnthemTrack } from "@/types";

interface Props {
  initialTracks: AnthemTrack[];
  initialEnabled: boolean;
}

export function MusicAdmin({ initialTracks, initialEnabled }: Props) {
  const [tracks,  setTracks]  = useState(initialTracks);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [editing, setEditing] = useState<AnthemTrack | null | "new">(null);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const toggleEnabled = useCallback(async (value: boolean) => {
    setEnabled(value);            // optimistic: it is a switch, not a form
    setBusy(true); setError(null);
    const res = await setAnthemEnabled(value);
    setBusy(false);
    if (res.error) { setEnabled(!value); setError(res.error); }
  }, []);

  const move = useCallback(async (from: number, to: number) => {
    if (to < 0 || to >= tracks.length) return;
    const reordered = [...tracks];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setTracks(reordered);
    setBusy(true); setError(null);
    const res = await reorderAnthemTracks(reordered.map((t) => t.id));
    setBusy(false);
    if (res.error) { setTracks(tracks); setError(res.error); }
  }, [tracks]);

  const remove = useCallback(async (track: AnthemTrack) => {
    setBusy(true); setError(null);
    const res = await deleteAnthemTrack(track.id);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setTracks((prev) => prev.filter((t) => t.id !== track.id));
  }, []);

  // ── Editing one song ─────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-hd-ink-400 hover:text-hd-ink-100 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to the library
        </button>

        <h3 className="text-base font-bold text-hd-ink-50">
          {editing === "new" ? "Add a song" : editing.title}
        </h3>

        <AnthemAdmin
          track={editing === "new" ? null : editing}
          // The list behind this is now stale either way, and a round trip to
          // rebuild it is not worth it against a full reload of one settings tab.
          onSaved={() => window.location.reload()}
        />
      </div>
    );
  }

  // ── The library ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5">
        <Music className="size-4 text-hd-ember-400 shrink-0 mt-0.5" />
        <p className="text-xs text-hd-ink-500 leading-relaxed">
          The anthem plays first; everything below it follows in this order when
          a rider taps skip. Drag order, badges and lyrics all live here.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
          <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-sm text-hd-ember-300">{error}</p>
        </div>
      )}

      {/* Master switch */}
      <label className={cn(
        "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
        tracks.length ? "bg-hd-ink-900/60 border-hd-ink-700" : "bg-hd-ink-900/30 border-hd-ink-800",
      )}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={busy || !tracks.length}
          onChange={(e) => toggleEnabled(e.target.checked)}
          className="mt-0.5 size-4 accent-hd-ember-600"
        />
        <span>
          <span className="block text-sm font-semibold text-hd-ink-100">
            Show the player on the site
          </span>
          <span className="block text-xs text-hd-ink-500 mt-0.5">
            {tracks.length
              ? "A play control appears in the homepage hero, and the disk follows riders around the site."
              : "Add a song first — there is nothing to play yet."}
          </span>
        </span>
      </label>

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-hd-ink-700">
          <Radio className="size-8 mx-auto mb-3 text-hd-ink-700" />
          <p className="text-sm text-hd-ink-500">No songs yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track, i) => (
            <div
              key={track.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                track.isAnthem
                  ? "bg-hd-ember-950/20 border-hd-ember-800/40"
                  : "gradient-card border-hd-ink-700/60",
                !track.isActive && "opacity-60",
              )}
            >
              {/* Order */}
              <div className="flex flex-col shrink-0">
                <button
                  type="button" onClick={() => move(i, i - 1)}
                  disabled={busy || i === 0}
                  aria-label="Move up"
                  className="p-0.5 text-hd-ink-500 hover:text-hd-ink-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button" onClick={() => move(i, i + 1)}
                  disabled={busy || i === tracks.length - 1}
                  aria-label="Move down"
                  className="p-0.5 text-hd-ink-500 hover:text-hd-ink-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold text-hd-ink-50 truncate">
                  {track.title}
                  {track.isAnthem && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-hd-ember-900/40 text-hd-ember-300 border border-hd-ember-800/40 shrink-0">
                      <Star className="size-2 fill-current" /> Anthem
                    </span>
                  )}
                  {!track.isActive && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-hd-ink-800 text-hd-ink-400 border border-hd-ink-700 shrink-0">
                      <EyeOff className="size-2" /> Hidden
                    </span>
                  )}
                </p>
                <p className="text-xs text-hd-ink-500 mt-0.5 truncate">
                  {track.credits || "No credits"}
                  {" · "}
                  {track.lyrics.length
                    ? `${track.lyrics.filter((l) => l.time !== null).length}/${track.lyrics.filter((l) => l.text.trim()).length} lines synced`
                    : "no lyrics"}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditing(track)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-hd-ink-800 border border-hd-ink-700 hover:border-hd-ink-500 text-xs font-medium text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
                >
                  <Pencil className="size-3" /> Edit
                </button>
                <ConfirmDelete busy={busy} onConfirm={() => remove(track)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-all hover:shadow-glow-ember"
      >
        <Plus className="size-4" /> Add a song
      </button>
    </div>
  );
}

/** Two taps to delete. A song carries its lyrics and their timings, which is
 *  an evening's work nobody wants to lose to a stray click. */
function ConfirmDelete({ busy, onConfirm }: { busy: boolean; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label="Delete song"
        className="flex items-center justify-center size-8 rounded-lg border border-hd-ink-700 text-hd-ink-500 hover:text-hd-ember-400 hover:border-hd-ember-800 transition-colors"
      >
        <Trash2 className="size-3.5" />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="px-2 py-1.5 rounded-lg text-xs text-hd-ink-400 hover:text-hd-ink-100"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="px-2.5 py-1.5 rounded-lg bg-hd-ember-700 hover:bg-hd-ember-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
      >
        Delete
      </button>
    </span>
  );
}
