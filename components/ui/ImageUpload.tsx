// =============================================================================
// ImageUpload - reusable Supabase Storage upload widget
// "use client" - file picker + upload happens in the browser
// Props:
//   bucket              - Supabase Storage bucket name (e.g. "ride-banners")
//   currentUrl          - existing public URL to preview (null = none)
//   onUpload            - called with the new public URL after a successful upload,
//                         or null when the user removes the image
//   accept              - file-input accept string (default: "image/*")
//   maxMb               - hard size guard BEFORE compression in megabytes (default: 10)
//   compressThresholdMb - auto-compress if file exceeds this size (default: 0.8 MB)
//                         set to 0 to always compress, Infinity to never compress
//   compressMaxPx       - max width or height after compression (default: 1920)
//                         pass 400 for avatars, 1920 for banners, 0 to skip
//   cropAspect          - when set (e.g. 1 for square), shows a crop modal before upload
// =============================================================================

"use client";

import { useRef, useState, useCallback } from "react";
import Image                             from "next/image";
import Cropper                           from "react-easy-crop";
import type { Area }                     from "react-easy-crop";
import imageCompression                  from "browser-image-compression";
import { Upload, X, ImageIcon,
         Loader2, AlertCircle,
         CheckCircle2, ZoomIn, ZoomOut } from "lucide-react";
import { createClient }                  from "@/lib/supabase/client";
import { cn }                            from "@/utils/cn";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Render the cropped region of an image onto a canvas and return a WebP blob. */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 800,
): Promise<Blob> {
  const img = document.createElement("img");
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload  = () => resolve();
    img.onerror = reject;
    img.src     = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width  = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    outputSize, outputSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas empty"))),
      "image/webp",
      0.92,
    );
  });
}

// ---------------------------------------------------------------------------
// Crop modal
// ---------------------------------------------------------------------------

interface CropModalProps {
  src:      string;
  aspect:   number;
  onCrop:   (blob: Blob) => void;
  onCancel: () => void;
}

function CropModal({ src, aspect, onCrop, onCancel }: CropModalProps) {
  const [crop,              setCrop]              = useState({ x: 0, y: 0 });
  const [zoom,              setZoom]              = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying,          setApplying]          = useState(false);

  const onCropComplete = useCallback((_: Area, pxArea: Area) => {
    setCroppedAreaPixels(pxArea);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await getCroppedImg(src, croppedAreaPixels);
      onCrop(blob);
    } catch {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-tvs-charcoal-900 border border-tvs-charcoal-700 rounded-2xl shadow-cinematic overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tvs-charcoal-800">
          <div>
            <h3 className="text-sm font-bold text-tvs-charcoal-50">Crop Photo</h3>
            <p className="text-[11px] text-tvs-charcoal-500 mt-0.5">
              Drag to reposition · Scroll or pinch to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-tvs-charcoal-400 hover:text-tvs-charcoal-100 hover:bg-tvs-charcoal-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative" style={{ height: 300 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: "#0a0a0b" },
              cropAreaStyle:  { border: "2px solid #dc2626", borderRadius: "8px" },
            }}
          />
        </div>

        {/* Zoom slider + actions */}
        <div className="px-5 py-4 border-t border-tvs-charcoal-800 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomOut className="size-3.5 shrink-0 text-tvs-charcoal-500" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-tvs-red-600"
            />
            <ZoomIn className="size-3.5 shrink-0 text-tvs-charcoal-500" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-300 hover:text-tvs-charcoal-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-semibold transition-all",
                applying
                  ? "bg-tvs-charcoal-700 cursor-not-allowed"
                  : "bg-tvs-red-600 hover:bg-tvs-red-500 hover:shadow-glow-red"
              )}
            >
              {applying ? (
                <><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Applying…</>
              ) : (
                "Apply Crop"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ImageUploadProps {
  bucket:                string;
  currentUrl?:           string | null;
  onUpload:              (url: string | null) => void;
  accept?:               string;
  maxMb?:                number;
  /** Auto-compress when file size exceeds this threshold (MB). Default: 0.8 */
  compressThresholdMb?:  number;
  /** Max width/height after compression (px). Default: 1920. Pass 0 to skip. */
  compressMaxPx?:        number;
  /**
   * When set, shows a crop modal before upload.
   * Pass 1 for square (1:1), 16/9 for widescreen, etc.
   */
  cropAspect?:           number;
  className?:            string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImageUpload({
  bucket,
  currentUrl,
  onUpload,
  accept              = "image/*",
  maxMb               = 10,
  compressThresholdMb = 0.8,
  compressMaxPx       = 1920,
  cropAspect,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview,    setPreview]    = useState<string | null>(currentUrl ?? null);
  const [stage,      setStage]      = useState<"idle" | "compressing" | "uploading">("idle");
  const [progress,   setProgress]   = useState(0);
  const [error,      setError]      = useState<string | null>(null);
  const [sizeInfo,   setSizeInfo]   = useState<{ before: number; after: number } | null>(null);

  // Crop modal state
  const [cropSrc,     setCropSrc]     = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const busy = stage !== "idle";

  // ── Process file: compress → upload ────────────────────────────────────────
  const processFile = async (file: File) => {
    setError(null);
    setSizeInfo(null);

    const originalSize = file.size;
    let fileToUpload   = file;

    const shouldCompress =
      compressMaxPx > 0 &&
      file.size > compressThresholdMb * 1024 * 1024 &&
      file.type !== "image/gif" &&
      file.type !== "image/svg+xml";

    if (shouldCompress) {
      setStage("compressing");
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB:        compressThresholdMb,
          maxWidthOrHeight: compressMaxPx,
          useWebWorker:     true,
          fileType:         "image/webp",
          initialQuality:   0.85,
          onProgress:       (pct) => setProgress(Math.round(pct * 0.5)),
        });
        fileToUpload = new File([compressed], file.name.replace(/\.\w+$/, ".webp"), {
          type: "image/webp",
        });
        setSizeInfo({ before: originalSize, after: fileToUpload.size });
      } catch {
        fileToUpload = file;
      }
    }

    const objectUrl = URL.createObjectURL(fileToUpload);
    setPreview(objectUrl);
    setStage("uploading");
    setProgress(shouldCompress ? 50 : 0);

    const supabase = createClient();
    const ext  = fileToUpload.name.split(".").pop() ?? "webp";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const ticker = setInterval(() => {
      setProgress((p) => Math.min(p + 12, 92));
    }, 120);

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload, { upsert: false });

    clearInterval(ticker);

    if (uploadError || !data) {
      setError(uploadError?.message ?? "Upload failed");
      setPreview(currentUrl ?? null);
      setStage("idle");
      setProgress(0);
      URL.revokeObjectURL(objectUrl);
      return;
    }

    setProgress(100);

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    URL.revokeObjectURL(objectUrl);
    setPreview(publicUrl);
    setStage("idle");
    setProgress(0);
    onUpload(publicUrl);
  };

  // ── Entry: file selected or dropped ────────────────────────────────────────
  const handleFile = async (file: File) => {
    setError(null);
    setSizeInfo(null);

    if (file.size > maxMb * 1024 * 1024) {
      setError(`File is ${fmtSize(file.size)} — maximum allowed is ${maxMb} MB`);
      return;
    }

    // If crop requested and file is a real raster image, show crop modal
    const isCroppable = file.type !== "image/gif" && file.type !== "image/svg+xml";
    if (cropAspect && isCroppable) {
      const src = URL.createObjectURL(file);
      setCropSrc(src);
      setPendingFile(file);
      return;
    }

    await processFile(file);
  };

  // ── Crop confirmed ──────────────────────────────────────────────────────────
  const handleCropDone = async (blob: Blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);

    const originalName = pendingFile?.name ?? "photo";
    const croppedFile  = new File(
      [blob],
      originalName.replace(/\.\w+$/, ".webp"),
      { type: "image/webp" },
    );
    setPendingFile(null);
    await processFile(croppedFile);
  };

  // ── Crop cancelled ──────────────────────────────────────────────────────────
  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Remove ───────────────────────────────────────────────────────────────────
  const handleRemove = () => {
    setPreview(null);
    setError(null);
    setSizeInfo(null);
    onUpload(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Stage label ──────────────────────────────────────────────────────────────
  const stageLabel =
    stage === "compressing" ? "Compressing…" :
    stage === "uploading"   ? "Uploading…"   : "";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Crop modal (portal-like, rendered outside the card flow) */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          aspect={cropAspect ?? 1}
          onCrop={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}

      <div className={cn("space-y-2", className)}>

        {/* ── Preview ── */}
        {preview ? (
          <div className="relative group rounded-xl overflow-hidden border border-tvs-charcoal-700/60 bg-tvs-charcoal-900/50">
            <div className="relative w-full h-48">
              <Image
                src={preview}
                alt="Upload preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                unoptimized={preview.startsWith("blob:")}
              />
            </div>

            {/* Hover overlay */}
            {!busy && (
              <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tvs-charcoal-800/90 hover:bg-tvs-charcoal-700 text-white text-xs font-medium transition-colors"
                >
                  <Upload className="size-3.5" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/90 hover:bg-red-800 text-red-200 text-xs font-medium transition-colors"
                >
                  <X className="size-3.5" />
                  Remove
                </button>
              </div>
            )}

            {/* Progress bar */}
            {busy && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-tvs-charcoal-800">
                <div
                  className="h-full bg-tvs-red-600 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Stage overlay */}
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-6 text-white animate-spin" />
                  <span className="text-xs text-white/90 font-medium">{stageLabel}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Drop zone ── */
          <div
            role="button"
            tabIndex={0}
            onClick={() => !busy && inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && !busy && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "flex flex-col items-center justify-center gap-3 p-8 rounded-xl",
              "border-2 border-dashed transition-colors",
              busy
                ? "border-tvs-red-600/60 bg-tvs-red-950/20 cursor-not-allowed"
                : "border-tvs-charcoal-700 hover:border-tvs-red-600/50 bg-tvs-charcoal-900/30 hover:bg-tvs-charcoal-800/20 cursor-pointer"
            )}
          >
            {busy ? (
              <>
                <Loader2 className="size-8 text-tvs-red-500 animate-spin" />
                <div className="w-36 h-1 rounded-full bg-tvs-charcoal-700 overflow-hidden">
                  <div
                    className="h-full bg-tvs-red-600 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-tvs-charcoal-400">{stageLabel}</p>
              </>
            ) : (
              <>
                <div className="size-12 rounded-xl bg-tvs-charcoal-800 flex items-center justify-center">
                  <ImageIcon className="size-6 text-tvs-charcoal-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-tvs-charcoal-300">
                    Click to upload{" "}
                    <span className="text-tvs-charcoal-500">or drag & drop</span>
                  </p>
                  <p className="text-xs text-tvs-charcoal-600 mt-0.5">
                    {cropAspect
                      ? "PNG, JPG, WebP · crop to square before upload"
                      : "PNG, JPG, WebP · auto-compressed on upload"}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Compression result ── */}
        {sizeInfo && !busy && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>
              Compressed{" "}
              <span className="font-semibold">{fmtSize(sizeInfo.before)}</span>
              {" → "}
              <span className="font-semibold">{fmtSize(sizeInfo.after)}</span>
              {" "}
              <span className="text-emerald-600">
                ({Math.round((1 - sizeInfo.after / sizeInfo.before) * 100)}% smaller)
              </span>
            </span>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-800/40 text-red-300 text-xs">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Hidden file input ── */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </>
  );
}
