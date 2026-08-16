// =============================================================================
// AudioUpload — pick an audio file, put it in Supabase Storage
// 'use client'
//
// Separate from ImageUpload rather than a flag on it: that component's whole
// job is cropping and re-encoding raster images, none of which applies here,
// and audio must never be touched on its way to the bucket.
// =============================================================================

"use client";

import { useRef, useState } from "react";
import { Music, Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { cn }           from "@/utils/cn";
import { createClient } from "@/lib/supabase/client";

interface Props {
  bucket:      string;
  currentUrl:  string | null;
  onUpload:    (url: string | null) => void;
  /** Bucket rejects anything larger anyway; this is the friendly check. */
  maxMb?:      number;
  className?:  string;
}

function fmtSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AudioUpload({
  bucket, currentUrl, onUpload, maxMb = 20, className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [fileName,  setFileName]  = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith("audio/")) {
      setError("That is not an audio file.");
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File is ${fmtSize(file.size)} — the limit is ${maxMb} MB.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext  = file.name.split(".").pop() ?? "mp3";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type });

    setUploading(false);

    if (uploadError || !data) {
      setError(uploadError?.message ?? "Upload failed.");
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    setFileName(file.name);
    onUpload(publicUrl);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";   // let the same file be picked twice
        }}
      />

      {currentUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-hd-ink-900/60 border border-hd-ink-700">
            <Music className="size-4 text-hd-ember-400 shrink-0" />
            <span className="flex-1 min-w-0 text-sm text-hd-ink-200 truncate">
              {fileName ?? "Anthem uploaded"}
            </span>
            <button
              type="button"
              onClick={() => { setFileName(null); onUpload(null); }}
              className="shrink-0 text-hd-ink-500 hover:text-hd-ember-400 transition-colors"
              aria-label="Remove audio"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Native controls: this is the admin's own check that the right
              file landed, so the browser's player is exactly right here. */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={currentUrl} controls preload="metadata" className="w-full h-9" />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-hd-ink-400 hover:text-hd-ink-200 transition-colors underline underline-offset-2"
          >
            Replace with a different file
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-6 rounded-xl border border-dashed transition-colors",
            uploading
              ? "border-hd-ink-700 text-hd-ink-500 cursor-wait"
              : "border-hd-ink-600 text-hd-ink-300 hover:border-hd-ember-700 hover:text-hd-ink-100",
          )}
        >
          {uploading
            ? <><Loader2 className="size-4 animate-spin" /> Uploading…</>
            : <><Upload className="size-4" /> Upload the anthem (MP3, WAV, M4A)</>}
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
          <AlertCircle className="size-3.5 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-xs text-hd-ember-300">{error}</p>
        </div>
      )}
    </div>
  );
}
