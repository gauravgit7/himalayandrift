// =============================================================================
// AnthemAdmin — the community anthem, its lyrics, and their timings
// 'use client'
//
// Lyrics arrive as a plain document, so there is no timing data to import.
// The sync tool below is how timings get created: play the track, tap once as
// each line starts. That is the only path from "audio and words, separately"
// to lyrics that follow the vocals, short of hand-writing an .lrc file.
// =============================================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Save, CheckCircle2, AlertCircle, Music, Play, Pause, SkipBack,
  Timer, X, RotateCcw, ChevronRight,
} from "lucide-react";

import { cn }                  from "@/utils/cn";
import { AudioUpload }         from "@/components/ui/AudioUpload";
import { saveAnthemSettings }  from "@/lib/supabase/actions";
import { STORAGE_BUCKETS }     from "@/lib/constants";
import type { AnthemSettings, AnthemLyricLine } from "@/types";

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
);

/** m:ss.t — short enough to scan down a column of them. */
function fmtTime(s: number | null): string {
  if (s === null) return "—";
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${rest.toFixed(1).padStart(4, "0")}`;
}

const isBlank = (l: AnthemLyricLine) => l.text.trim().length === 0;

/**
 * Re-derive lines from the textarea while keeping timings that still belong.
 * Matched by position and exact text: edit a line's words and its timestamp is
 * dropped, because it is no longer known to be true.
 */
function mergeLyrics(prev: AnthemLyricLine[], raw: string): AnthemLyricLine[] {
  return raw.split("\n").map((text, i) => {
    const old = prev[i];
    return { text, time: old && old.text === text ? old.time : null };
  });
}

interface Props {
  initialSettings: AnthemSettings;
}

export function AnthemAdmin({ initialSettings }: Props) {
  const [title,     setTitle]     = useState(initialSettings.title);
  const [credits,   setCredits]   = useState(initialSettings.credits ?? "");
  const [audioUrl,  setAudioUrl]  = useState(initialSettings.audioUrl);
  const [enabled,   setEnabled]   = useState(initialSettings.isEnabled);
  const [lines,     setLines]     = useState<AnthemLyricLine[]>(initialSettings.lyrics);
  const [rawText,   setRawText]   = useState(
    initialSettings.lyrics.map((l) => l.text).join("\n"),
  );

  const [syncing,  setSyncing]  = useState(false);
  const [cursor,   setCursor]   = useState(0);
  const [playing,  setPlaying]  = useState(false);
  const [position, setPosition] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const rowsRef  = useRef<(HTMLDivElement | null)[]>([]);

  const timedCount = lines.filter((l) => !isBlank(l) && l.time !== null).length;
  const lyricCount = lines.filter((l) => !isBlank(l)).length;

  // ── Text editing ─────────────────────────────────────────────────────────
  const handleText = (value: string) => {
    setRawText(value);
    setLines((prev) => mergeLyrics(prev, value));
  };

  // ── Sync ─────────────────────────────────────────────────────────────────
  const nextLyricIndex = useCallback((from: number) => {
    for (let i = from; i < lines.length; i++) if (!isBlank(lines[i])) return i;
    return -1;
  }, [lines]);

  const stamp = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || cursor < 0 || cursor >= lines.length) return;

    const t = audio.currentTime;
    setLines((prev) => prev.map((l, i) => (i === cursor ? { ...l, time: t } : l)));

    const next = (() => {
      for (let i = cursor + 1; i < lines.length; i++) if (!isBlank(lines[i])) return i;
      return -1;
    })();

    if (next === -1) { setSyncing(false); audio.pause(); }
    else setCursor(next);
  }, [cursor, lines]);

  // Space is the natural key for "now", and holding the mouse steady on a
  // button while listening is harder than it sounds.
  useEffect(() => {
    if (!syncing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); stamp(); }
      if (e.code === "Escape") setSyncing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [syncing, stamp]);

  // Keep the line being stamped in view without yanking the page around.
  useEffect(() => {
    if (!syncing) return;
    rowsRef.current[cursor]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cursor, syncing]);

  const startSync = (fromIndex = 0) => {
    const audio = audioRef.current;
    if (!audio) return;
    const first = nextLyricIndex(fromIndex);
    if (first === -1) return;

    setCursor(first);
    setSyncing(true);
    // Re-syncing from a line means starting playback just before it, so there
    // is a run-up rather than a cold start mid-word.
    const from = lines[first].time;
    audio.currentTime = fromIndex === 0 ? 0 : Math.max(0, (from ?? audio.currentTime) - 1.5);
    void audio.play();
  };

  const nudge = (i: number, delta: number) =>
    setLines((prev) => prev.map((l, idx) =>
      idx === i && l.time !== null ? { ...l, time: Math.max(0, l.time + delta) } : l));

  const clearTime = (i: number) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, time: null } : l)));

  const clearAllTimes = () =>
    setLines((prev) => prev.map((l) => ({ ...l, time: null })));

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    const res = await saveAnthemSettings({
      title, audioUrl, credits: credits || null, lyrics: lines, isEnabled: enabled,
    });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5">
        <Music className="size-4 text-hd-ember-400 shrink-0 mt-0.5" />
        <p className="text-xs text-hd-ink-500 leading-relaxed">
          A play control appears in the homepage hero once this is switched on.
          Lyrics work untimed — they show as a plain sheet until you sync them.
        </p>
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
          <p className="text-sm text-emerald-300">Anthem saved.</p>
        </div>
      )}

      {/* ── Track ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
            Title
          </label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Our Anthem" className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
            Credits
          </label>
          <input
            type="text" value={credits} onChange={(e) => setCredits(e.target.value)}
            placeholder="Written and performed by…" className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
          Audio
        </label>
        <AudioUpload
          bucket={STORAGE_BUCKETS.anthem}
          currentUrl={audioUrl}
          onUpload={setAudioUrl}
        />
      </div>

      {/* ── Lyrics ── */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
          Lyrics
        </label>
        <textarea
          value={rawText}
          onChange={(e) => handleText(e.target.value)}
          rows={8}
          placeholder={"Paste the lyrics here, one line per line.\n\nLeave a blank line between verses — those are kept as breaks."}
          className={cn(inputCls, "h-auto py-2.5 resize-y leading-relaxed")}
        />
        <p className="text-[11px] text-hd-ink-500">
          {lyricCount} line{lyricCount === 1 ? "" : "s"}
          {lyricCount > 0 && <> · {timedCount} timed</>}
          {timedCount > 0 && timedCount < lyricCount && (
            <span className="text-amber-500"> · {lyricCount - timedCount} still untimed</span>
          )}
        </p>
      </div>

      {/* ── Sync ── */}
      {audioUrl && lyricCount > 0 && (
        <div className="rounded-xl border border-hd-ink-700 bg-hd-ink-900/50 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-hd-ink-800 flex-wrap">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-hd-ember-400" />
              <span className="text-sm font-semibold text-hd-ink-100">Sync the lyrics</span>
            </div>

            {syncing ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-hd-ember-300 font-semibold animate-pulse">
                  Tap SPACE as each line begins
                </span>
                <button
                  type="button"
                  onClick={() => { setSyncing(false); audioRef.current?.pause(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hd-ink-700 text-hd-ink-300 text-xs transition-colors hover:border-hd-ink-500"
                >
                  <X className="size-3" /> Stop
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {timedCount > 0 && (
                  <button
                    type="button" onClick={clearAllTimes}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-hd-ink-500 hover:text-hd-ember-400 text-xs transition-colors"
                  >
                    <RotateCcw className="size-3" /> Clear all timings
                  </button>
                )}
                <button
                  type="button" onClick={() => startSync(0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-xs font-semibold transition-colors"
                >
                  <Play className="size-3" /> Start syncing
                </button>
              </div>
            )}
          </div>

          {/* Transport */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-hd-ink-800">
            <button
              type="button"
              onClick={() => {
                const a = audioRef.current; if (!a) return;
                if (a.paused) void a.play(); else a.pause();
              }}
              className="flex items-center justify-center size-8 rounded-full bg-hd-ink-800 border border-hd-ink-600 text-hd-ink-200 hover:text-white transition-colors"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => { const a = audioRef.current; if (a) a.currentTime = 0; }}
              className="flex items-center justify-center size-8 rounded-full bg-hd-ink-800 border border-hd-ink-600 text-hd-ink-400 hover:text-white transition-colors"
              aria-label="Back to start"
            >
              <SkipBack className="size-3.5" />
            </button>
            <span className="text-xs font-mono text-hd-ink-400 tabular-nums">
              {fmtTime(position)}
            </span>
          </div>

          {/* Lines */}
          <div className="max-h-80 overflow-y-auto divide-y divide-hd-ink-800/60">
            {lines.map((line, i) => {
              const blank = isBlank(line);
              return (
                <div
                  key={i}
                  ref={(el) => { rowsRef.current[i] = el; }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 transition-colors",
                    blank && "py-1",
                    syncing && i === cursor && "bg-hd-ember-600/15",
                  )}
                >
                  {blank ? (
                    <span className="text-[10px] text-hd-ink-700 italic">stanza break</span>
                  ) : (
                    <>
                      <span className="w-14 shrink-0 text-xs font-mono tabular-nums text-hd-ink-500">
                        {fmtTime(line.time)}
                      </span>
                      <span className={cn(
                        "flex-1 min-w-0 text-sm truncate",
                        line.time !== null ? "text-hd-ink-200" : "text-hd-ink-500",
                      )}>
                        {line.text}
                      </span>

                      {!syncing && (
                        <div className="flex items-center gap-1 shrink-0">
                          {line.time !== null && (
                            <>
                              <button type="button" onClick={() => nudge(i, -0.2)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono text-hd-ink-400 hover:text-white hover:bg-hd-ink-800 transition-colors"
                                title="0.2s earlier">−</button>
                              <button type="button" onClick={() => nudge(i, 0.2)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono text-hd-ink-400 hover:text-white hover:bg-hd-ink-800 transition-colors"
                                title="0.2s later">+</button>
                              <button type="button"
                                onClick={() => { const a = audioRef.current; if (a && line.time !== null) { a.currentTime = line.time; void a.play(); } }}
                                className="px-1.5 py-0.5 rounded text-hd-ink-400 hover:text-hd-ember-400 transition-colors"
                                title="Play from here"><Play className="size-3" /></button>
                              <button type="button" onClick={() => clearTime(i)}
                                className="px-1.5 py-0.5 rounded text-hd-ink-600 hover:text-hd-ember-400 transition-colors"
                                title="Clear this timing"><X className="size-3" /></button>
                            </>
                          )}
                          <button type="button" onClick={() => startSync(i)}
                            className="px-1.5 py-0.5 rounded text-hd-ink-500 hover:text-hd-ember-400 transition-colors"
                            title="Re-sync from this line"><ChevronRight className="size-3" /></button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden element drives both the transport and the sync clock. */}
      {audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onEnded={() => { setPlaying(false); setSyncing(false); }}
          className="hidden"
        />
      )}

      {/* ── Enable + save ── */}
      <label className={cn(
        "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
        audioUrl ? "bg-hd-ink-900/60 border-hd-ink-700" : "bg-hd-ink-900/30 border-hd-ink-800 cursor-not-allowed",
      )}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={!audioUrl}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 size-4 accent-hd-ember-600"
        />
        <span>
          <span className="block text-sm font-semibold text-hd-ink-100">
            Show the anthem on the homepage
          </span>
          <span className="block text-xs text-hd-ink-500 mt-0.5">
            {audioUrl
              ? "A small play control appears in the hero."
              : "Upload the audio first — there is nothing to play yet."}
          </span>
        </span>
      </label>

      <button
        type="button" onClick={handleSave} disabled={saving}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
          saving
            ? "bg-hd-ink-700 cursor-not-allowed opacity-60"
            : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.98]",
        )}
      >
        {saving
          ? <><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
          : <><Save className="size-4" />Save anthem</>}
      </button>
    </div>
  );
}
