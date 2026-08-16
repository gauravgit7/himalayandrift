// =============================================================================
// AnthemPlayer — a quiet play control in the hero, and the lyrics overlay
// 'use client'
//
// Deliberately small. The anthem is something people choose to play, so the
// control sits at the edge of the hero rather than competing with the headline.
// Never autoplays: browsers block it, and it would be rude regardless.
// =============================================================================

"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Play, Pause, Music, X, Loader2 } from "lucide-react";
import { cn }               from "@/utils/cn";
import type { AnthemSettings } from "@/types";

interface Props {
  anthem: AnthemSettings;
}

const isBlank = (t: string) => t.trim().length === 0;

export function AnthemPlayer({ anthem }: Props) {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const lineRefs  = useRef<(HTMLParagraphElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [playing,  setPlaying]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [position, setPosition] = useState(0);

  const hasLyrics = anthem.lyrics.length > 0;
  // Untimed lyrics still display — they just do not follow along.
  const isTimed   = useMemo(
    () => anthem.lyrics.some((l) => l.time !== null),
    [anthem.lyrics],
  );

  /** Index of the line currently being sung, or -1 before the first one. */
  const activeIndex = useMemo(() => {
    if (!isTimed) return -1;
    let found = -1;
    for (let i = 0; i < anthem.lyrics.length; i++) {
      const t = anthem.lyrics[i].time;
      if (t !== null && t <= position + 0.15) found = i;
      else if (t !== null) break;
    }
    return found;
  }, [anthem.lyrics, position, isTimed]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setLoading(true);
      void audio.play().finally(() => setLoading(false));
    } else {
      audio.pause();
    }
  }, []);

  // Keep the sung line centred. Honour reduced-motion: the scroll still
  // happens, it just does not animate.
  useEffect(() => {
    if (!showLyrics || activeIndex < 0) return;
    const el = lineRefs.current[activeIndex];
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [activeIndex, showLyrics]);

  // Escape closes the overlay; body scroll is locked while it is open.
  useEffect(() => {
    if (!showLyrics) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowLyrics(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showLyrics]);

  if (!anthem.isEnabled || !anthem.audioUrl) return null;

  return (
    <>
      {/* ── The control ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${anthem.title}` : `Play ${anthem.title}`}
          className={cn(
            "group inline-flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full",
            "bg-white/5 hover:bg-white/10 border border-white/15 hover:border-hd-ember-600/50",
            "backdrop-blur-sm transition-all duration-200",
          )}
        >
          <span className={cn(
            "inline-flex items-center justify-center size-8 rounded-full shrink-0 transition-colors",
            playing ? "bg-hd-ember-600 text-white" : "bg-white/10 text-white group-hover:bg-hd-ember-600",
          )}>
            {loading
              ? <Loader2 className="size-3.5 animate-spin" />
              : playing
                ? <Pause className="size-3.5" />
                : <Play className="size-3.5 ml-0.5" />}
          </span>

          <span className="text-left">
            <span className="block text-[10px] uppercase tracking-widest text-white/50 leading-none">
              {playing ? "Now playing" : "Our anthem"}
            </span>
            <span className="block text-xs font-semibold text-white/90 leading-tight mt-0.5 max-w-[150px] truncate">
              {anthem.title}
            </span>
          </span>

          {/* Three bars that only move while sound is coming out. */}
          {playing && (
            <span className="flex items-end gap-0.5 h-3.5 ml-0.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-0.5 bg-hd-ember-400 rounded-full motion-safe:animate-anthem-bar"
                  style={{ animationDelay: `${i * 0.15}s`, height: "100%" }}
                />
              ))}
            </span>
          )}
        </button>

        {hasLyrics && (
          <button
            type="button"
            onClick={() => setShowLyrics(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold text-white/70 hover:text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all"
          >
            <Music className="size-3" />
            Lyrics
          </button>
        )}
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={anthem.audioUrl}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPosition(0); }}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        className="hidden"
      />

      {/* ── Lyrics overlay ── */}
      {showLyrics && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${anthem.title} lyrics`}
        >
          <div
            className="absolute inset-0 bg-hd-ink-950/95 backdrop-blur-md"
            onClick={() => setShowLyrics(false)}
          />

          <div className="relative w-full max-w-2xl max-h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-hd-ember-500 font-semibold">
                  {playing ? "Now playing" : "Our anthem"}
                </p>
                <h2 className="text-2xl font-black text-hd-ink-50 mt-1">{anthem.title}</h2>
                {anthem.credits && (
                  <p className="text-xs text-hd-ink-500 mt-1">{anthem.credits}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowLyrics(false)}
                className="shrink-0 flex items-center justify-center size-9 rounded-full bg-hd-ink-800/80 border border-hd-ink-700 text-hd-ink-300 hover:text-white hover:border-hd-ink-500 transition-colors"
                aria-label="Close lyrics"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Lines */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto min-h-0 py-8 space-y-1 scroll-smooth"
            >
              {anthem.lyrics.map((line, i) => {
                if (isBlank(line.text)) {
                  return <div key={i} className="h-5" aria-hidden="true" />;
                }
                const active = isTimed && i === activeIndex;
                const sung   = isTimed && activeIndex > -1 && i < activeIndex;
                return (
                  <p
                    key={i}
                    ref={(el) => { lineRefs.current[i] = el; }}
                    onClick={() => {
                      // Tapping a timed line jumps the track to it.
                      const a = audioRef.current;
                      if (a && line.time !== null) { a.currentTime = line.time; void a.play(); }
                    }}
                    className={cn(
                      "text-center leading-relaxed transition-all duration-300",
                      line.time !== null && "cursor-pointer",
                      active
                        ? "text-xl sm:text-2xl font-bold text-hd-ember-300 scale-[1.02]"
                        : sung
                          ? "text-base sm:text-lg text-hd-ink-500"
                          : "text-base sm:text-lg text-hd-ink-300",
                      // Untimed lyrics get no dimming — nothing is "past".
                      !isTimed && "text-hd-ink-200",
                    )}
                  >
                    {line.text}
                  </p>
                );
              })}
            </div>

            {/* Footer transport */}
            <div className="shrink-0 pt-5 flex items-center justify-center gap-3 border-t border-hd-ink-800">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-colors mt-5"
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                {playing ? "Pause" : "Play"}
              </button>
              {!isTimed && (
                <p className="text-[11px] text-hd-ink-600 mt-5">
                  Lyrics are not synced yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
