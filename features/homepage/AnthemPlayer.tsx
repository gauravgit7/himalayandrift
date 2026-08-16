// =============================================================================
// AnthemPlayer — the anthem control in the hero
// 'use client'
//
// Owns no audio of its own. The element lives in AnthemProvider up in the root
// layout so playback survives navigation; this is just the button that starts
// it and the one that opens the lyrics.
// =============================================================================

"use client";

import { Play, Pause, Music, Loader2 } from "lucide-react";
import { cn }        from "@/utils/cn";
import { useAnthem } from "@/features/anthem/AnthemProvider";

export function AnthemPlayer() {
  const anthem = useAnthem();

  // Null when no anthem is configured or it is switched off.
  if (!anthem) return null;

  const { anthem: data, playing, loading, toggle, openLyrics, spectrum } = anthem;
  const hasLyrics = data.lyrics.length > 0;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${data.title}` : `Play ${data.title}`}
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
            {data.title}
          </span>
        </span>

        {/* Five bars driven by real frequency data while playing. */}
        {playing && (
          <span className="flex items-end gap-0.5 h-3.5 ml-0.5" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => {
              const bin = spectrum.length
                ? spectrum[Math.floor((i / 5) * spectrum.length * 0.6)] / 255
                : 0;
              return (
                <span
                  key={i}
                  className="w-0.5 bg-hd-ember-400 rounded-full transition-[height] duration-75 ease-out"
                  style={{ height: `${20 + bin * 80}%` }}
                />
              );
            })}
          </span>
        )}
      </button>

      {hasLyrics && (
        <button
          type="button"
          onClick={() => openLyrics(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold text-white/70 hover:text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all"
        >
          <Music className="size-3" />
          Lyrics
        </button>
      )}
    </div>
  );
}
