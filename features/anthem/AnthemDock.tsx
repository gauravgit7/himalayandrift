// =============================================================================
// AnthemDock — the spinning disk that follows you around the site
// 'use client'
//
// Appears only once the anthem has been started, and hides itself while the
// full lyrics overlay is open (that has its own transport). The ring of bars
// is real frequency data from the analyser, not a canned animation.
//
// Three sizes, and the rider chooses:
//   mini    — the disk alone
//   window  — the disk plus the line being sung (the default, when there ARE
//             lyrics; a window with nothing to say is just a box)
//   full    — the lyrics overlay, which lives in AnthemLyrics
//
// The whole dock can be dragged anywhere. Where it lands and which size it was
// left at are both remembered, because a player that resets its position on
// every page load is one you end up moving over and over.
// =============================================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Pause, Play, X, Music, Maximize2, Minimize2, SkipBack, SkipForward,
  GripVertical, MessageSquareText,
} from "lucide-react";
import { cn }        from "@/utils/cn";
import { useAnthem } from "@/features/anthem/AnthemProvider";
import type { AnthemLyricLine } from "@/types";

const SIZE = 84;            // css px of the whole canvas
const DPR_CAP = 2;          // retina is enough; 3x buys nothing here
const EDGE = 12;            // keep this much of the dock on screen when dragged

const VIEW_KEY = "hd-anthem-dock-view";
const POS_KEY  = "hd-anthem-dock-pos";

type DockView = "mini" | "window";

/**
 * Distance from the bottom-right of the viewport, NOT from the top-left.
 *
 * The disk is the last thing in the row, so anchoring from the right keeps it
 * exactly where it is when the lyric window beside it is minimised away. Anchor
 * from the left and the disk slides across the screen every time you collapse
 * the window, which reads as the dock having moved on its own.
 */
interface Pos { right: number; bottom: number }

// ---------------------------------------------------------------------------
// Lyric window
//
// The same language as the full view, in miniature: the sung line in ember
// with its glow, the lines either side falling away in opacity and blur, over
// a backdrop that breathes with the track's actual loudness and drifts as the
// song moves from line to line.
// ---------------------------------------------------------------------------

function NeighbourLine({ text }: { text?: string }) {
  if (!text) return null;
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
  lines, activeLine, title, playing, energy,
  onExpand, onMinimise, onDragStart, dragging,
}: {
  lines:      AnthemLyricLine[];
  activeLine: number;
  title:      string;
  playing:    boolean;
  energy:     number;
  onExpand:    () => void;
  onMinimise:  () => void;
  onDragStart: (e: React.PointerEvent) => void;
  dragging:    boolean;
}) {
  const at = (i: number): string | undefined => {
    const t = lines[i]?.text?.trim();
    return t ? t : undefined;
  };

  const synced  = activeLine >= 0;
  const current = synced ? at(activeLine) : undefined;
  const prev    = synced ? at(activeLine - 1) : undefined;
  const next    = synced ? at(activeLine + 1) : at(0);

  // The glow walks a slow circle as the lines go by, so the light moves with
  // the song rather than sitting in one corner pulsing. Loudness sets how much
  // of it there is; the line number sets where it is.
  const drift = synced ? (activeLine % 8) / 8 : 0;
  const angle = drift * Math.PI * 2;
  const gx    = 50 + Math.cos(angle) * 32;
  const gy    = 45 + Math.sin(angle) * 30;
  const lift  = Math.min(energy, 1);

  return (
    <div
      className={cn(
        "hidden sm:flex flex-col relative overflow-hidden",
        "w-[248px] rounded-2xl",
        "bg-hd-ink-900/90 border border-hd-ink-700/80 backdrop-blur-md shadow-cinematic",
        "transition-colors",
        dragging ? "border-hd-ember-700/60" : "hover:border-hd-ember-700/40",
      )}
    >
      {/* Ambient wash — behind everything, never in the way of a pointer */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 transition-all duration-500 ease-out"
          style={{
            background:
              `radial-gradient(120px 90px at ${gx}% ${gy}%, rgba(240,144,32,${0.10 + lift * 0.30}) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{
            background:
              `radial-gradient(140px 110px at ${100 - gx}% ${100 - gy}%, rgba(62,107,120,${0.08 + lift * 0.22}) 0%, transparent 72%)`,
          }}
        />
      </div>

      {/* Header — the drag handle, and the two size controls */}
      <div
        onPointerDown={onDragStart}
        style={{ touchAction: "none" }}
        className={cn(
          "relative flex items-center gap-1 px-2 py-1.5 border-b border-hd-ink-800/70 select-none",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <GripVertical className="size-3 shrink-0 text-hd-ink-600" />
        <span className="flex-1 min-w-0 text-[9px] uppercase tracking-widest text-hd-ink-400 leading-none truncate">
          {playing ? "Now playing" : "Paused"} · {title}
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onMinimise}
          aria-label="Minimise the lyrics"
          className="p-1 rounded text-hd-ink-500 hover:text-hd-ink-100 hover:bg-hd-ink-800 transition-colors shrink-0"
        >
          <Minimize2 className="size-3" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onExpand}
          aria-label="Open the full lyrics"
          className="p-1 rounded text-hd-ink-500 hover:text-hd-ember-400 hover:bg-hd-ink-800 transition-colors shrink-0"
        >
          <Maximize2 className="size-3" />
        </button>
      </div>

      {/* prev · current · next — centred, and sized to what is actually there
          rather than to a fixed block that leaves the box half empty */}
      <button
        type="button"
        onClick={onExpand}
        aria-label={`Open the full lyrics for ${title}`}
        className="relative flex flex-col items-center justify-center gap-0.5 w-full px-3 py-3 min-h-[64px] text-center"
      >
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
          // Before the first timed line, or on a song nobody has synced yet.
          <span className="w-full text-[12px] text-hd-ink-300 leading-snug line-clamp-3">
            {next ?? "Lyrics"}
          </span>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dock
// ---------------------------------------------------------------------------

export function AnthemDock({ logoUrl }: { logoUrl?: string | null }) {
  const anthem = useAnthem();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef   = useRef<HTMLDivElement>(null);

  const [view,     setView]     = useState<DockView>("window");
  const [pos,      setPos]      = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const grabRef = useRef<{ dx: number; dy: number } | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 300, h: SIZE });
  // With the window minimised the disk is both the drag handle and the button
  // that opens the lyrics, and a pointerup after a drag still fires a click.
  // This is how a drag is told apart from a tap.
  const movedRef = useRef(false);

  const spectrum = anthem?.spectrum;
  const playing  = anthem?.playing ?? false;

  // A song with no words at all should show the disk and nothing else. Blank
  // lines are stanza breaks, so they do not count as having lyrics.
  const hasLyrics = !!anthem?.anthem.lyrics.some((l) => l.text.trim());

  // ── Remembered size and position ─────────────────────────────────────────
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(VIEW_KEY);
      if (v === "mini" || v === "window") setView(v);
      const p = window.localStorage.getItem(POS_KEY);
      if (p) {
        const parsed = JSON.parse(p);
        if (typeof parsed?.right === "number" && typeof parsed?.bottom === "number") {
          setPos(parsed);
        }
      }
    } catch { /* private mode — the dock just goes back to its corner */ }
  }, []);

  const remember = useCallback((next: DockView) => {
    setView(next);
    try { window.localStorage.setItem(VIEW_KEY, next); } catch { /* ignore */ }
  }, []);

  /** Keep the dock reachable: the disk never leaves the screen entirely. */
  const clamp = useCallback((p: Pos): Pos => {
    const el = rootRef.current;
    const w = el?.offsetWidth  ?? 300;
    const h = el?.offsetHeight ?? SIZE;
    return {
      right:  Math.min(Math.max(p.right,  -EDGE), window.innerWidth  - SIZE),
      bottom: Math.min(Math.max(p.bottom, -EDGE), window.innerHeight - Math.min(h, SIZE + 24)),
    };
  }, []);

  // A window narrowed after the dock was parked in the corner would otherwise
  // leave it off screen with no way back.
  useEffect(() => {
    if (!pos) return;
    const onResize = () => setPos((p) => (p ? clamp(p) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos, clamp]);

  const onDragStart = useCallback((e: React.PointerEvent) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    grabRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    sizeRef.current  = { w: rect.width, h: rect.height };
    movedRef.current = false;
    // Switch from the CSS corner to explicit coordinates at the position it is
    // already in, so the first pixel of the drag does not make it jump.
    setPos({
      right:  window.innerWidth  - rect.right,
      bottom: window.innerHeight - rect.bottom,
    });
    setDragging(true);
    // No preventDefault here: on the disk this same handler shares the element
    // with a click, and suppressing the default would suppress that too.
    // touch-action: none on the handle is what stops a touch drag scrolling.
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const start = { x: 0, y: 0, seeded: false };

    const onMove = (e: PointerEvent) => {
      const grab = grabRef.current;
      if (!grab) return;
      if (!start.seeded) { start.x = e.clientX; start.y = e.clientY; start.seeded = true; }
      // A few pixels of wobble is a tap with a shaky hand, not a drag.
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) movedRef.current = true;
      const { w, h } = sizeRef.current;
      setPos(clamp({
        right:  window.innerWidth  - (e.clientX - grab.dx + w),
        bottom: window.innerHeight - (e.clientY - grab.dy + h),
      }));
    };
    const onUp = () => {
      setDragging(false);
      grabRef.current = null;
      setPos((p) => {
        if (p) {
          try { window.localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
        }
        return p;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, clamp]);

  // ── The ring ─────────────────────────────────────────────────────────────
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
    hasQueue, next, prev, energy,
  } = anthem;
  const progress = duration > 0 ? position / duration : 0;
  const showWindow = hasLyrics && view === "window";

  return (
    <div
      ref={rootRef}
      style={pos ? { right: pos.right, bottom: pos.bottom } : undefined}
      className={cn(
        "print:hidden fixed z-[150] flex items-end gap-3 animate-fade-in",
        !pos && "bottom-4 right-4 sm:bottom-6 sm:right-6",
        dragging && "select-none",
      )}
    >
      {showWindow && (
        <LyricWindow
          lines={anthem.anthem.lyrics}
          activeLine={anthem.activeLine}
          title={anthem.anthem.title}
          playing={isPlaying}
          energy={energy}
          dragging={dragging}
          onDragStart={onDragStart}
          onExpand={() => openLyrics(true)}
          onMinimise={() => remember("mini")}
        />
      )}

      {/* Disk */}
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
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

        {/* The disk itself — click to open the full lyrics. With the window
            hidden it doubles as the drag handle, since the header is gone. */}
        <button
          type="button"
          onPointerDown={showWindow ? undefined : onDragStart}
          onClick={() => {
            if (movedRef.current) { movedRef.current = false; return; }
            openLyrics(true);
          }}
          aria-label={`Open ${anthem.anthem.title} lyrics`}
          className={cn(
            "absolute rounded-full overflow-hidden border border-hd-ink-700 shadow-cinematic",
            "bg-hd-ink-950 group",
            isPlaying && "motion-safe:animate-anthem-spin",
          )}
          style={{ inset: 12, touchAction: showWindow ? undefined : "none" }}
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

        {/* Bring the lyric window back. Only when there are lyrics to bring
            back to, and only when it is not already open. */}
        {hasLyrics && !showWindow && (
          <button
            type="button"
            onClick={() => remember("window")}
            aria-label="Show the lyrics window"
            className="hidden sm:flex absolute -bottom-0.5 left-1/2 -translate-x-1/2 items-center justify-center size-6 rounded-full bg-hd-ink-800 hover:bg-hd-ember-600 text-hd-ink-300 hover:text-white border border-hd-ink-700 transition-colors"
          >
            <MessageSquareText className="size-2.5" />
          </button>
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
