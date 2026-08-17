// =============================================================================
// CheckoutClient — the basket, then the details, then the payment
// 'use client'
//
// The basket in localStorage holds ids and quantities only, so the first thing
// this does on mount is ask the server to price it. Every figure on screen
// comes back from that call, and the same arithmetic runs again inside
// submitShopOrder — the browser never gets to name a total.
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link  from "next/link";
import Image from "next/image";
import {
  ShoppingBag, Trash2, Minus, Plus, AlertCircle, Loader2,
  Wallet, ArrowRight, ImageOff,
} from "lucide-react";

import { cn }               from "@/utils/cn";
import { ImageUpload }      from "@/components/ui/ImageUpload";
import { useCart }          from "@/features/shop/CartProvider";
import { formatNpr }        from "@/features/shop/pricing";
import { priceBasket, submitShopOrder } from "@/lib/supabase/actions";
import { ROUTES, STORAGE_BUCKETS }      from "@/lib/constants";
import type { PaymentSettings } from "@/types";

type PricedBasket = Awaited<ReturnType<typeof priceBasket>>;

const inputCls = cn(
  "w-full h-11 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
);

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-hd-ember-500 ml-0.5">*</span>}
    </label>
  );
}

export function CheckoutClient({
  payment, deliveryNote, signedInName, signedInEmail,
}: {
  payment:       PaymentSettings;
  deliveryNote:  string;
  signedInName?: string;
  signedInEmail?: string;
}) {
  const { lines, setQty, remove, clear, hydrated } = useCart();

  const [priced,  setPriced]  = useState<PricedBasket | null>(null);
  const [pricing, startPricing] = useTransition();

  const [fullName, setFullName] = useState(signedInName ?? "");
  const [phone,    setPhone]    = useState("");
  const [email,    setEmail]    = useState(signedInEmail ?? "");
  const [address,  setAddress]  = useState("");
  const [notes,    setNotes]    = useState("");
  const [txnId,    setTxnId]    = useState("");
  const [shotUrl,  setShotUrl]  = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [done,       setDone]       = useState<string | null>(null);

  // Re-price whenever the basket changes. Not debounced: quantity changes are
  // deliberate taps, not typing, and a stale total is worse than a round trip.
  const reprice = useCallback((current: typeof lines) => {
    if (!current.length) { setPriced(null); return; }
    startPricing(async () => {
      const res = await priceBasket(current);
      setPriced(res);
    });
  }, []);

  useEffect(() => {
    if (hydrated) reprice(lines);
  }, [hydrated, lines, reprice]);

  const blocked = priced?.lines.some((l) => l.problem) ?? false;
  const total   = priced?.total ?? 0;
  const payable = total > 0;

  const submit = async () => {
    setError(null);
    if (!fullName.trim() || !phone.trim()) {
      setError("Your name and a phone number are both needed.");
      return;
    }
    if (payable && !shotUrl) {
      setError("Upload the payment screenshot so the committee can match your order.");
      return;
    }

    setSubmitting(true);
    const res = await submitShopOrder({
      lines,
      fullName, phone,
      email:            email || null,
      deliveryAddress:  address || null,
      notes:            notes || null,
      paymentReference: txnId || null,
      paymentScreenshotUrl: shotUrl,
    });
    setSubmitting(false);

    if (res.error) { setError(res.error); return; }
    clear();
    setDone(res.accessCode);
  };

  // ── Ordered ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5">
        <div className="size-14 mx-auto rounded-full bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center">
          <ShoppingBag className="size-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-hd-ink-50">Order placed</h2>
          <p className="text-sm text-hd-ink-400 mt-2 leading-relaxed">
            The committee will check your payment and come back to you. Keep this
            code — it is how you look the order up again.
          </p>
        </div>
        <p className="text-lg font-mono font-bold text-hd-ember-400 tracking-widest">
          {done}
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href={ROUTES.shopOrder(done)}
            className="py-3 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-colors"
          >
            Check the order
          </Link>
          <Link
            href={ROUTES.shop}
            className="py-3 rounded-xl border border-hd-ink-700 hover:border-hd-ink-500 text-sm font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
          >
            Back to the shop
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (hydrated && !lines.length) {
    return (
      <div className="py-20 text-center">
        <ShoppingBag className="size-12 mx-auto mb-4 text-hd-ink-700" />
        <p className="text-sm text-hd-ink-500 mb-5">Your basket is empty.</p>
        <Link
          href={ROUTES.shop}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-colors"
        >
          Go to the shop <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  if (!hydrated || !priced) {
    return (
      <div className="py-20 text-center text-sm text-hd-ink-500">
        <Loader2 className="size-5 mx-auto mb-3 animate-spin" />
        Working out your basket…
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

      {/* ── Basket + details ── */}
      <div className="space-y-6">

        <div className="space-y-2">
          {priced.lines.map((line) => (
            <div
              key={`${line.productId}-${line.variantId ?? "-"}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border",
                line.problem
                  ? "bg-hd-ember-950/20 border-hd-ember-800/40"
                  : "gradient-card border-hd-ink-700/60",
              )}
            >
              <span className="size-14 rounded-lg overflow-hidden bg-hd-ink-900 shrink-0">
                {line.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <ImageOff className="size-4 text-hd-ink-700" />
                  </span>
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-hd-ink-50 truncate">{line.name}</p>
                <p className="text-xs text-hd-ink-500 mt-0.5">
                  {line.variantLabel && <span className="mr-2">Size {line.variantLabel}</span>}
                  {formatNpr(line.unitPrice)}
                  {line.fullPrice > line.unitPrice && (
                    <span className="ml-1.5 line-through text-hd-ink-600">
                      {formatNpr(line.fullPrice)}
                    </span>
                  )}
                </p>
                {line.problem && (
                  <p className="text-xs text-hd-ember-400 mt-1 font-semibold">{line.problem}</p>
                )}
              </div>

              <div className="inline-flex items-center rounded-lg border border-hd-ink-700 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setQty(line.productId, line.variantId, line.quantity - 1)}
                  aria-label="One fewer"
                  className="px-2 py-1.5 text-hd-ink-400 hover:text-white hover:bg-hd-ink-800 transition-colors"
                >
                  <Minus className="size-3" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-hd-ink-100 tabular-nums">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(line.productId, line.variantId, line.quantity + 1)}
                  disabled={line.available !== null && line.quantity >= line.available}
                  aria-label="One more"
                  className="px-2 py-1.5 text-hd-ink-400 hover:text-white hover:bg-hd-ink-800 disabled:opacity-30 transition-colors"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => remove(line.productId, line.variantId)}
                aria-label={`Remove ${line.name}`}
                className="p-2 rounded-lg text-hd-ink-500 hover:text-hd-ember-400 transition-colors shrink-0"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Who it is for */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-hd-ink-500">
            Where it goes
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Full name</FieldLabel>
              <input className={inputCls} value={fullName}
                onChange={(e) => setFullName(e.target.value)} placeholder="As on your ID" />
            </div>
            <div>
              <FieldLabel required>Phone</FieldLabel>
              <input className={inputCls} value={phone} inputMode="tel"
                onChange={(e) => setPhone(e.target.value)} placeholder="98…" />
            </div>
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input className={inputCls} value={email} type="email"
              onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <FieldLabel>Delivery address</FieldLabel>
            <textarea
              value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
              placeholder="Or leave blank to collect at the next ride"
              className={cn(inputCls, "h-auto py-2.5 resize-none")}
            />
            {deliveryNote && (
              <p className="text-[11px] text-hd-ink-500 mt-1.5 whitespace-pre-line">
                {deliveryNote}
              </p>
            )}
          </div>
          <div>
            <FieldLabel>Anything else</FieldLabel>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Size doubts, a gift note, a landmark for the courier"
              className={cn(inputCls, "h-auto py-2.5 resize-none")}
            />
          </div>
        </div>

        {/* Payment — same shape as ride registration, because riders know it */}
        {payable && (
          <div className="space-y-4 pt-2 border-t border-hd-ink-800">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-hd-ink-500 pt-5">
              <Wallet className="size-3.5" /> Payment
            </h2>

            {payment.qrUrl && (
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl gradient-card border border-hd-ink-700/60">
                <Image
                  src={payment.qrUrl}
                  alt="Payment QR code"
                  width={200}
                  height={200}
                  unoptimized
                  className="rounded-lg bg-white p-2"
                />
                <p className="text-[11px] text-hd-ink-500 text-center">
                  Scan with eSewa, Khalti or your banking app to pay {formatNpr(total)}.
                </p>
              </div>
            )}

            {payment.paymentInstructions && (
              <p className="text-xs text-hd-ink-400 leading-relaxed whitespace-pre-line p-3 rounded-lg bg-hd-ink-900/60 border border-hd-ink-800">
                {payment.paymentInstructions}
              </p>
            )}

            <div>
              <FieldLabel required>Payment screenshot</FieldLabel>
              <ImageUpload
                bucket={STORAGE_BUCKETS.paymentScreenshots}
                currentUrl={shotUrl}
                onUpload={setShotUrl}
                compressMaxPx={1400}
              />
              <p className="text-[11px] text-hd-ink-500 mt-2">
                Pay first, then upload the confirmation. Your order is held until
                the committee has seen it.
              </p>
            </div>

            <div>
              <FieldLabel>Transaction ID</FieldLabel>
              <input className={inputCls} value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="If your app shows one" />
            </div>
          </div>
        )}
      </div>

      {/* ── Summary ── */}
      <div className="lg:sticky lg:top-24 space-y-4 p-5 rounded-2xl gradient-card border border-hd-ink-700">
        <h2 className="text-xs font-bold uppercase tracking-widest text-hd-ink-500">
          Summary
        </h2>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-hd-ink-400">
            <span>Items</span>
            <span className="tabular-nums">{formatNpr(priced.subtotal)}</span>
          </div>
          {priced.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount</span>
              <span className="tabular-nums">−{formatNpr(priced.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 mt-2 border-t border-hd-ink-800 text-base font-black text-hd-ink-50">
            <span>Total</span>
            <span className="text-hd-ember-400 tabular-nums">{formatNpr(total)}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
            <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
            <p className="text-xs text-hd-ember-300">{error}</p>
          </div>
        )}

        {blocked && (
          <p className="text-xs text-hd-ember-400 leading-relaxed">
            Something in your basket is no longer available. Remove it to carry on.
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={submitting || pricing || blocked}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all",
            submitting || pricing || blocked
              ? "bg-hd-ink-700 text-hd-ink-500 cursor-not-allowed"
              : "bg-hd-ember-600 hover:bg-hd-ember-500 text-white hover:shadow-glow-ember active:scale-[0.99]",
          )}
        >
          {submitting
            ? <><Loader2 className="size-4 animate-spin" /> Placing the order…</>
            : <>Place the order <ArrowRight className="size-4" /></>}
        </button>

        <p className="text-[11px] text-hd-ink-600 leading-relaxed">
          Nothing is charged automatically. The committee checks every order by
          hand and will message you on the number above.
        </p>
      </div>
    </div>
  );
}
