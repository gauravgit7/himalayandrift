// =============================================================================
// ConfirmedClient — the "save your code" screen after submission
// 'use client' — copy button, download, beforeunload warning, checkbox gate
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import Link                                  from "next/link";
import { CheckCircle2, Copy, Download,
         AlertTriangle, ArrowRight }         from "lucide-react";
import { cn }                                from "@/utils/cn";
import { ROUTES }                            from "@/lib/constants";

interface Props { accessCode: string }

export function ConfirmedClient({ accessCode }: Props) {
  const [copied,  setCopied]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  // Warn before navigating away if not saved
  useEffect(() => {
    if (saved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // triggers browser warning
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saved]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  }, [accessCode]);

  const handleDownload = useCallback(() => {
    const text = [
      "TVS Nepal — Membership Card Application",
      "=" .repeat(40),
      "",
      `Your Reference Code: ${accessCode}`,
      "",
      "IMPORTANT: Keep this code safe.",
      "You will need it to check your application status",
      "and download your membership card once approved.",
      "",
      "Check your status at:",
      `${window.location.origin}/membership`,
      "(Open the 'Check Status' tab and enter your code)",
      "",
      "=" .repeat(40),
      `Submitted: ${new Date().toLocaleString()}`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `TVS-Nepal-${accessCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [accessCode]);

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-6">

        {/* Success icon */}
        <div className="text-center">
          <div className="size-16 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-tvs-charcoal-50">Application Submitted!</h1>
          <p className="text-sm text-tvs-charcoal-400 mt-2 leading-relaxed">
            Your application is now under review.
            Save your reference code — it&apos;s the <strong className="text-tvs-charcoal-200">only way</strong> to
            check your status and download your card.
          </p>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/40 border border-amber-800/50">
          <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            <strong>This code will not be shown again.</strong>{" "}
            There is no email recovery. If you lose it, you will need to submit a new application.
          </p>
        </div>

        {/* Code display */}
        <div className="p-5 rounded-2xl bg-tvs-charcoal-900 border border-tvs-charcoal-700">
          <p className="text-[10px] uppercase tracking-widest text-tvs-charcoal-500 mb-2 text-center">
            Your Reference Code
          </p>
          <div className="flex items-center gap-3">
            <p className="flex-1 text-center text-2xl font-black text-white font-mono tracking-widest">
              {accessCode}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                copied
                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/40"
                  : "bg-tvs-charcoal-800 border border-tvs-charcoal-700 text-tvs-charcoal-300 hover:text-white hover:bg-tvs-charcoal-700",
              )}
            >
              <Copy className="size-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Download button */}
        <button
          type="button"
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-tvs-charcoal-700 hover:border-tvs-charcoal-500 text-tvs-charcoal-200 hover:text-white text-sm font-semibold transition-all"
        >
          <Download className="size-4" />
          Download Reference as .txt
        </button>

        {/* Confirmation checkbox */}
        <label className={cn(
          "flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-all",
          saved
            ? "border-emerald-700/40 bg-emerald-950/20"
            : "border-tvs-charcoal-700 hover:border-tvs-charcoal-600",
        )}>
          <input
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
            className="mt-0.5 accent-emerald-600 shrink-0"
          />
          <span className="text-xs text-tvs-charcoal-300 leading-relaxed">
            I have saved or written down my reference code{" "}
            <strong className="text-white font-mono">{accessCode}</strong> and understand
            it cannot be recovered if lost.
          </span>
        </label>

        {/* Continue button — only enabled after checkbox */}
        <Link
          href={saved ? ROUTES.membership : "#"}
          onClick={(e) => { if (!saved) e.preventDefault(); }}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all",
            saved
              ? "bg-tvs-red-600 hover:bg-tvs-red-500 text-white hover:shadow-glow-red"
              : "bg-tvs-charcoal-800 text-tvs-charcoal-600 cursor-not-allowed",
          )}
        >
          {saved ? (
            <>Check My Application Status <ArrowRight className="size-4" /></>
          ) : (
            "Check the box above to continue"
          )}
        </Link>
      </div>
    </main>
  );
}
