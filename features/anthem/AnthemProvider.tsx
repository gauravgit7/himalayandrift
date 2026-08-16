// =============================================================================
// AnthemProvider — the anthem's playback state, hoisted above the router
// 'use client'
//
// The <audio> element lives here, in the root layout, because anything rendered
// inside a page is unmounted the moment you navigate — and an unmounted audio
// element stops. Mounting it above the route tree is what lets the track keep
// playing while you move around the site.
//
// Everything visual (the hero button, the dock, the lyrics overlay) reads this
// context. There is exactly one audio element on the page, always.
// =============================================================================

"use client";

import {
  createContext, useContext, useRef, useState, useEffect, useCallback, useMemo,
} from "react";
import type { AnthemSettings } from "@/types";

interface AnthemContextValue {
  anthem:     AnthemSettings;
  ready:      boolean;      // has the user ever started it
  playing:    boolean;
  loading:    boolean;
  position:   number;
  duration:   number;
  /** Live frequency data, 0-255 per bin. Empty until playback starts. */
  spectrum:   Uint8Array;
  /** 0-1 overall loudness right now, for things that pulse with the music. */
  energy:     number;
  activeLine: number;       // -1 before the first timed line
  lyricsOpen: boolean;
  toggle:     () => void;
  seek:       (seconds: number) => void;
  openLyrics: (open: boolean) => void;
}

const AnthemContext = createContext<AnthemContextValue | null>(null);

/** Null when there is no anthem configured, so callers can render nothing. */
export function useAnthem() {
  return useContext(AnthemContext);
}

const EMPTY = new Uint8Array(0);

export function AnthemProvider({
  anthem,
  children,
}: {
  anthem: AnthemSettings | null;
  children: React.ReactNode;
}) {
  const audioRef    = useRef<HTMLAudioElement>(null);
  const ctxRef      = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef   = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef      = useRef<number | null>(null);

  const [ready,      setReady]      = useState(false);
  const [playing,    setPlaying]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [position,   setPosition]   = useState(0);
  const [duration,   setDuration]   = useState(0);
  const [spectrum,   setSpectrum]   = useState<Uint8Array>(EMPTY);
  const [energy,     setEnergy]     = useState(0);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const lyrics  = anthem?.lyrics ?? [];
  const isTimed = useMemo(() => lyrics.some((l) => l.time !== null), [lyrics]);

  const activeLine = useMemo(() => {
    if (!isTimed) return -1;
    let found = -1;
    for (let i = 0; i < lyrics.length; i++) {
      const t = lyrics[i].time;
      if (t === null) continue;
      if (t <= position + 0.15) found = i;
      else break;
    }
    return found;
  }, [lyrics, position, isTimed]);

  /**
   * Wire the Web Audio graph. Deferred until the first play because browsers
   * refuse to start an AudioContext without a user gesture, and
   * createMediaElementSource may only ever be called once per element.
   *
   * Once the element is routed through the graph, the analyser must connect on
   * to the destination or there is no sound at all.
   */
  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceRef.current) return;

    try {
      const Ctor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      const ctx      = new Ctor();
      const source   = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;               // 64 bins is plenty for a small ring
      analyser.smoothingTimeConstant = 0.75; // less jitter, still responsive

      source.connect(analyser);
      analyser.connect(ctx.destination);

      ctxRef.current      = ctx;
      sourceRef.current   = source;
      analyserRef.current = analyser;
    } catch {
      // Analysis is decoration. If the graph cannot be built - an old browser,
      // or audio the origin will not share - playback still works, and the
      // visuals fall back to a time-driven animation.
    }
  }, []);

  // Sample the analyser while playing. Stopped on pause so a paused tab is not
  // burning a frame callback forever.
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bins = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(bins);
      // Copy: React must see a new reference to re-render.
      setSpectrum(new Uint8Array(bins));
      let sum = 0;
      for (let i = 0; i < bins.length; i++) sum += bins[i];
      setEnergy(sum / (bins.length * 255));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      ensureGraph();
      void ctxRef.current?.resume();
      setReady(true);
      setLoading(true);
      void audio.play().catch(() => {/* blocked or unreachable */}).finally(() => setLoading(false));
    } else {
      audio.pause();
    }
  }, [ensureGraph]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, seconds);
    if (audio.paused) toggle();
  }, [toggle]);

  const value = useMemo<AnthemContextValue | null>(() => {
    if (!anthem?.isEnabled || !anthem.audioUrl) return null;
    return {
      anthem, ready, playing, loading, position, duration,
      spectrum, energy, activeLine, lyricsOpen,
      toggle, seek, openLyrics: setLyricsOpen,
    };
  }, [anthem, ready, playing, loading, position, duration,
      spectrum, energy, activeLine, lyricsOpen, toggle, seek]);

  return (
    <AnthemContext.Provider value={value}>
      {children}

      {anthem?.isEnabled && anthem.audioUrl && (
        // crossOrigin is required for the analyser to see the samples: without
        // it a cross-origin file taints the graph and every bin reads zero.
        // Supabase Storage serves public objects with Access-Control-Allow-Origin: *.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          // Explicit key so React reconciles this element by identity rather
          // than by position. Without it, a change in the shape of `children`
          // could in principle swap the node out - and a swapped audio element
          // is a stopped one, which is the whole thing this file exists to avoid.
          key="hd-anthem-audio"
          ref={audioRef}
          src={anthem.audioUrl}
          crossOrigin="anonymous"
          preload="none"
          onPlay={()  => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setPosition(0); }}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          className="hidden"
        />
      )}
    </AnthemContext.Provider>
  );
}
