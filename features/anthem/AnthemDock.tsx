// =============================================================================
// AnthemDock — the spinning disk that follows you around the site
// 'use client'
//
// Appears only once the anthem has been started, and hides itself while the
// lyrics overlay is open (the overlay has its own transport). The ring of bars
// is real frequency data from the analyser, not a canned animation.
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import { Pause, Play, X, Music, Maximize2, SkipBack, SkipForward } from "lucide-react";
import { cn }        from "@/utils/cn";
import { useAnthem } from "@/features/anthem/AnthemProvider";
import type { AnthemLyricLine } from "@/types";

const SIZE = 84;            // css px of the whole canvas
const DPR_CAP = 2;          // retina is enough; 3x buys nothing here

// ---------------------------------------------------------------------------
// Lyric window — the line being sung, next to the disk
//
// The dock used to show the track title, which never changed and so said
// nothing after the first second. The line currently being sung is the one
// piece of information here that is worth a glance, and showing it alongside
// the player means you can follow the anthem without giving up the page you
// are reading. The full view is one click away, on the window or the disk.
//
// Same language as that full view, in miniature: the sung line in ember with
// its glow, the lines either side falling away in opacity and blur. Three
// lines is what makes it read as a song rather than a status message — you can
// see where you have just been and where you are going.
//
// Deliberately fixed-height. A window that grew and shrank with the length of
// each line would nudge the disk around the corner of the screen all song.
// ---------------------------------------------------------------------------

/** A line either side of the sung one — present enough to read, receded
 *  enough that the eye never mistakes it for the current line. Same falloff
 *  the full view uses, just at one step of distance instead of many. */
function NeighbourLine({ text }: { text?: string }) {
  // Reserve the row even when empty, so the sung line stays put at the top and
  // bottom of the song rather than sliding as neighbours appear.
  if (!text) return <span className="block h-[15px] w-full" aria-hidden="true" />;
  return (
    <span
      className="block w-full text-[11px] text-hd-ink-300 leading-tight truncate"
      style={{ opacity: 0.45, filter: "blur(0.7px)" }}
    >
      {text}
    </span>
  );
}

function LyricWindow({
  lines, activeLine, title, playing, onExpand,
}: {
  lines:      AnthemLyricLine[];
  activeLine: number;
  title:      string;
  playing:    boolean;
  onExpand:   () => void;
}) {
  // Blank lines are spacers in the full view; here they would read as the
  // window having gone empty, so skip over them when looking either side.
  const at = (i: number): string | undefined => {
    const t = lines[i]?.text?.trim();
    return t ? t : undefined;
  };

  const synced  = activeLine >= 0;
  const current = synced ? at(activeLine) : undefined;
  const prev    = synced ? at(activeLine - 1) : undefined;
  const next    = synced ? at(activeLine + 1) : at(0);

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={`Open the full lyrics for ${title}`}
      className={cn(
        "hidden sm:flex flex-col items-end text-right group",
        "w-[264px] px-4 py-3 rounded-2xl",
        "bg-hd-ink-900/90 border border-hd-ink-700/80 backdrop-blur-md",
        "hover:border-hd-ember-700/60 transition-colors shadow-cinematic",
      )}
    >
      {/* Header: state, title, and the hint that this opens */}
      <span className="flex items-center gap-1.5 w-full justify-end">
        <span className="text-[9px] uppercase tracking-widest text-hd-ink-400 leading-none truncate">
          {playing ? "Now playing" : "Paused"} · {title}
        </span>
        <Maximize2 className="size-2.5 shrink-0 text-hd-ink-500 group-hover:text-hd-ember-400 transition-colors" />
      </span>

      {/* prev · current · next */}
      <span className="flex flex-col items-end justify-center w-full mt-2 h-[76px] overflow-hidden">
        {current ? (
          <>
            <NeighbourLine text={prev} />
            {/* keyed on the index so each line re-mounts and fades in */}
            <span
              key={activeLine}
              className={cn(
                "w-full text-[13px] font-bold leading-snug line-clamp-2 animate-fade-in",
                "text-hd-ember-300 [text-shadow:0_0_18px_rgba(240,144,32,0.4)]",
              )}
            >
              {current}
            </span>
            <NeighbourLine text={next} />
          </>
        ) : (
          // Before the first timed line, or on an anthem nobody has synced yet.
          <span className="w-full text-[12px] text-hd-ink-300 leading-snug line-clamp-3">
            {next ?? "Lyrics"}
          </span>
        )}
      </span>
    </button>
  );
}

export function AnthemDock({ logoUrl }: { logoUrl?: string | null }) {
  const anthem = useAnthem();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const spectrum = anthem?.spectrum;
  const playing  = anthem?.playing ?? false;

  // Draw the ring. Reads the spectrum on every render while playing, which the
  // provider is already driving off requestAnimationFrame.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    if (canvas.width !== SIZE * dpr) {
      canvas.width  = SIZE * dpr;
      canvas.height = SIZE * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const inner = 30;        // clears the disk itself
    const maxLen = 10;

    // Use the lower half of the spectrum: the top bins are mostly air on a
    // vocal track and would leave half the ring permanently flat.
    const bins  = spectrum && spectrum.length ? spectrum : null;
    const count = 44;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;

      let level: number;
      if (bins) {
        const src = Math.floor((i / count) * (bins.length * 0.7));
        level = bins[src] / 255;
      } else {
        level = 0.12;   // resting ring when there is no analyser
      }

      const len = 2 + level * maxLen;
      const x1 = cx + Math.cos(angle) * inner;
      const y1 = cy + Math.sin(angle) * inner;
      const x2 = cx + Math.cos(angle) * (inner + len);
      const y2 = cy + Math.sin(angle) * (inner + len);

      ctx.strokeStyle = `rgba(240, 144, 32, ${0.35 + level * 0.65})`;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }, [spectrum]);

  if (!anthem || !anthem.ready || anthem.lyricsOpen) return null;

  const {
    playing: isPlaying, toggle, openLyrics, position, duration,
    hasQueue, next, prev,
  } = anthem;
  const progress = duration > 0 ? position / duration : 0;

  return (
    <div
      className={cn(
        "print:hidden fixed z-[150] bottom-4 right-4 sm:bottom-6 sm:right-6",
        "flex items-center gap-3 animate-fade-in",
      )}
    >
      {/* Lyric window — desktop only; on a phone the disk speaks for itself. */}
      <LyricWindow
        lines={anthem.anthem.lyrics}
        activeLine={anthem.activeLine}
        title={anthem.anthem.title}
        playing={isPlaying}
        onExpand={() => openLyrics(true)}
      />

      {/* Disk */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ width: SIZE, height: SIZE }}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />

        {/* Progress ring sits under the disk face */}
        <svg
          className="absolute inset-0 -rotate-90 pointer-events-none"
          width={SIZE} height={SIZE} aria-hidden="true"
        >
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={27}
            fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={2}
          />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={27}
            fill="none" stroke="#f09020" strokeWidth={2} strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 27}
            strokeDashoffset={2 * Math.PI * 27 * (1 - progress)}
          />
        </svg>

        {/* The disk itself — click to open the lyrics */}
        <button
          type="button"
          onClick={() => openLyrics(true)}
          aria-label={`Open ${anthem.anthem.title} lyrics`}
          className={cn(
            "absolute rounded-full overflow-hidden border border-hd-ink-700 shadow-cinematic",
            "bg-hd-ink-950 group",
            isPlaying && "motion-safe:animate-anthem-spin",
          )}
          style={{ inset: 12 }}
        >
          {/* Vinyl grooves */}
          <span
            className="absolute inset-0 rounded-full opacity-70"
            style={{
              background:
                "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.07) 0 1px, transparent 1px 4px)",
            }}
          />
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="absolute inset-[18%] object-contain rounded-full"
            />
          ) : (
            <Music className="absolute inset-0 m-auto size-5 text-hd-ember-400" />
          )}
          {/* Spindle hole */}
          <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hd-ink-950 border border-hd-ink-700" />
        </button>

        {/* Play / pause */}
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? "Pause the anthem" : "Play the anthem"}
          className="absolute -bottom-0.5 -left-0.5 flex items-center justify-center size-7 rounded-full bg-hd-ember-600 hover:bg-hd-ember-500 text-white border-2 border-hd-ink-950 transition-colors"
        >
          {isPlaying ? <Pause className="size-3" /> : <Play className="size-3 ml-0.5" />}
        </button>

        {/* Skip, tucked around the rim so they never crowd the play button.
            Only present once there is more than one track to move between. */}
        {hasQueue && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous track"
              className="absolute -top-0.5 -left-0.5 flex items-center justify-center size-6 rounded-full bg-hd-ink-800 hover:bg-hd-ink-700 text-hd-ink-300 hover:text-white border border-hd-ink-700 transition-colors"
            >
              <SkipBack className="size-2.5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next track"
              className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center size-6 rounded-full bg-hd-ink-800 hover:bg-hd-ink-700 text-hd-ink-300 hover:text-white border border-hd-ink-700 transition-colors"
            >
              <SkipForward className="size-2.5" />
            </button>
          </>
        )}

        {/* Dismiss: pauses and puts the dock away */}
        <button
          type="button"
          onClick={() => { if (isPlaying) toggle(); openLyrics(false); }}
          aria-label="Hide the anthem player"
          className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-5 rounded-full bg-hd-ink-800 hover:bg-hd-ink-700 text-hd-ink-400 hover:text-white border border-hd-ink-700 transition-colors"
        >
          <X className="size-2.5" />
        </button>
      </div>
    </div>
  );
}
