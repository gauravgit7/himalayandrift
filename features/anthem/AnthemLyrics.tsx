// =============================================================================
// AnthemLyrics — the full-screen lyrics view
// 'use client'
//
// The previous version dimmed every non-active line to the same grey, which is
// what made it read flat: no sense of where you are in the song. Here, lines
// fall away by DISTANCE from the one being sung — size, opacity and blur all
// taper — so the eye is pulled to the right place without anything shouting.
//
// The backdrop breathes with the track's actual loudness, which is the one
// thing that makes it feel alive rather than animated on a timer.
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import { Play, Pause, X, SkipBack, SkipForward, ListMusic } from "lucide-react";
import { cn }        from "@/utils/cn";
import { useAnthem } from "@/features/anthem/AnthemProvider";

function fmt(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s - m * 60)).padStart(2, "0")}`;
}

export function AnthemLyrics() {
  const anthem   = useAnthem();
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const open = anthem?.lyricsOpen ?? false;

  // Escape to close, and lock the page behind the overlay.
  useEffect(() => {
    if (!open || !anthem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") anthem.openLyrics(false);
      if (e.code === "Space") { e.preventDefault(); anthem.toggle(); }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, anthem]);

  // Follow the sung line.
  useEffect(() => {
    if (!open || !anthem || anthem.activeLine < 0) return;
    const el = lineRefs.current[anthem.activeLine];
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [open, anthem]);

  if (!anthem || !open) return null;

  const {
    anthem: data, playing, position, duration, energy, activeLine,
    toggle, seek, openLyrics, hasQueue, next, prev, tracks, index, playTrack,
  } = anthem;

  const isTimed  = data.lyrics.some((l) => l.time !== null);
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div
      className="print:hidden fixed inset-0 z-[200] flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${data.title} lyrics`}
    >
      {/* Backdrop. The two glows scale with live loudness — subtle on purpose:
          it should feel like the room responding, not a light show. */}
      <div className="absolute inset-0 bg-hd-ink-950/97 backdrop-blur-xl" />
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-150 ease-out"
        style={{ transform: `scale(${1 + energy * 0.25})`, opacity: 0.5 + energy * 0.5 }}
        aria-hidden="true"
      >
        <div
          className="absolute left-1/2 top-1/3 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{ background: `rgba(240,144,32,${0.10 + energy * 0.16})` }}
        />
        <div
          className="absolute left-1/2 bottom-0 size-[32rem] -translate-x-1/2 translate-y-1/3 rounded-full blur-[120px]"
          style={{ background: `rgba(62,107,120,${0.10 + energy * 0.12})` }}
        />
      </div>

      {/* Header */}
      <div className="relative shrink-0 flex items-start justify-between gap-4 px-5 sm:px-8 pt-6 pb-2 max-w-3xl mx-auto w-full">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-hd-ember-500 font-bold">
            {playing ? "Now playing" : "Our anthem"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-hd-ink-50 mt-1.5">
            {data.title}
          </h2>
          {data.credits && (
            <p className="text-xs text-hd-ink-500 mt-1">{data.credits}</p>
          )}

          {/* The rest of the library, one tap away. Only worth the space once
              there is more than one song in it. */}
          {hasQueue && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <ListMusic className="size-3 text-hd-ink-600 shrink-0" />
              {tracks.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => playTrack(i)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors max-w-[140px] truncate",
                    i === index
                      ? "bg-hd-ember-600/20 border-hd-ember-700/60 text-hd-ember-300"
                      : "border-hd-ink-700 text-hd-ink-400 hover:text-hd-ink-100 hover:border-hd-ink-500",
                  )}
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => openLyrics(false)}
          className="shrink-0 flex items-center justify-center size-10 rounded-full bg-hd-ink-800/70 border border-hd-ink-700 text-hd-ink-300 hover:text-white hover:border-hd-ink-500 backdrop-blur-sm transition-colors"
          aria-label="Close lyrics"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Lines */}
      <div className="relative flex-1 min-h-0 overflow-y-auto">
        {/* Fades top and bottom so lines dissolve rather than clip */}
        <div className="pointer-events-none sticky top-0 h-16 bg-gradient-to-b from-hd-ink-950 to-transparent z-10" />

        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-[35vh] space-y-2">
          {data.lyrics.map((line, i) => {
            if (!line.text.trim()) {
              return <div key={i} className="h-6" aria-hidden="true" />;
            }

            const distance = activeLine < 0 ? 99 : Math.abs(i - activeLine);
            const isActive = isTimed && i === activeLine;

            // Depth of field. Untimed lyrics stay uniformly legible — with no
            // active line, falloff would just be arbitrary blurring.
            const style: React.CSSProperties = isTimed
              ? {
                  opacity: isActive ? 1 : Math.max(0.18, 1 - distance * 0.22),
                  filter:  distance > 2 ? `blur(${Math.min((distance - 2) * 0.7, 2.5)}px)` : "none",
                }
              : { opacity: 0.9 };

            return (
              <p
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                onClick={() => { if (line.time !== null) seek(line.time); }}
                style={style}
                className={cn(
                  "text-center leading-snug transition-all duration-500 ease-out",
                  line.time !== null && "cursor-pointer",
                  isActive
                    ? "text-2xl sm:text-4xl font-black text-hd-ember-300 [text-shadow:0_0_28px_rgba(240,144,32,0.45)]"
                    : "text-lg sm:text-2xl font-semibold text-hd-ink-300 hover:text-hd-ink-100",
                )}
              >
                {line.text}
              </p>
            );
          })}
        </div>

        <div className="pointer-events-none sticky bottom-0 h-16 bg-gradient-to-t from-hd-ink-950 to-transparent" />
      </div>

      {/* Transport */}
      <div className="relative shrink-0 border-t border-hd-ink-800/80 bg-hd-ink-950/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-4 flex items-center gap-3 sm:gap-4">
          {hasQueue && (
            <button
              type="button"
              onClick={prev}
              className="shrink-0 flex items-center justify-center size-9 rounded-full text-hd-ink-400 hover:text-white transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={toggle}
            className="shrink-0 flex items-center justify-center size-12 rounded-full bg-hd-ember-600 hover:bg-hd-ember-500 text-white transition-colors shadow-glow-ember"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
          </button>

          {hasQueue && (
            <button
              type="button"
              onClick={next}
              className="shrink-0 flex items-center justify-center size-9 rounded-full text-hd-ink-400 hover:text-white transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="size-4" />
            </button>
          )}

          <span className="text-[11px] font-mono tabular-nums text-hd-ink-500 shrink-0 w-9">
            {fmt(position)}
          </span>

          {/* Scrubber */}
          <div className="flex-1 min-w-0">
            <input
              type="range"
              min={0}
              max={Math.max(duration, 0.1)}
              step={0.1}
              value={Math.min(position, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
              className="w-full h-1.5 appearance-none rounded-full cursor-pointer bg-hd-ink-800 accent-hd-ember-500"
              style={{
                background:
                  `linear-gradient(to right, #f09020 ${progress}%, rgb(38 36 34) ${progress}%)`,
              }}
            />
          </div>

          <span className="text-[11px] font-mono tabular-nums text-hd-ink-500 shrink-0 w-9 text-right">
            {fmt(duration)}
          </span>
        </div>

        {!isTimed && (
          <p className="pb-3 text-center text-[11px] text-hd-ink-600">
            Lyrics are not synced yet — sync them in Settings to make them follow along
          </p>
        )}
      </div>
    </div>
  );
}
