// =============================================================================
// /shop/order/[code] — an order's status, by the code the buyer was given
//
// Same pattern as a ride registration: the code IS the credential. Orders are
// not publicly readable, so the lookup runs through the service role and the
// page shows nothing without a code that matches.
// =============================================================================

import type { Metadata } from "next";
import Link              from "next/link";
import { notFound }      from "next/navigation";
import {
  Clock, CheckCircle2, XCircle, PackageCheck, ArrowLeft,
} from "lucide-react";
import { getShopOrderByCode } from "@/lib/supabase/queries";
import { formatNpr }          from "@/features/shop/pricing";
import { ROUTES }             from "@/lib/constants";
import { cn }                 from "@/utils/cn";
import type { ShopOrderStatus } from "@/types";

export const metadata: Metadata = { title: "Your Order" };
export const dynamic = "force-dynamic";

const STATUS: Record<ShopOrderStatus, {
  label: string; blurb: string; cls: string; icon: React.ReactNode;
}> = {
  pending: {
    label: "With the committee",
    blurb: "Your payment is being checked. This usually takes a day or two.",
    cls:   "bg-amber-950/30 border-amber-800/40 text-amber-300",
    icon:  <Clock className="size-5 text-amber-400" />,
  },
  approved: {
    label: "Approved",
    blurb: "Payment confirmed. Your order is being put together.",
    cls:   "bg-emerald-950/30 border-emerald-800/40 text-emerald-300",
    icon:  <CheckCircle2 className="size-5 text-emerald-400" />,
  },
  fulfilled: {
    label: "On its way",
    blurb: "Handed over. If it has not reached you, message the committee.",
    cls:   "bg-emerald-950/30 border-emerald-800/40 text-emerald-300",
    icon:  <PackageCheck className="size-5 text-emerald-400" />,
  },
  rejected: {
    label: "Could not be accepted",
    blurb: "See the reason below.",
    cls:   "bg-hd-ember-950/30 border-hd-ember-800/40 text-hd-ember-300",
    icon:  <XCircle className="size-5 text-hd-ember-400" />,
  },
};

export default async function ShopOrderPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await getShopOrderByCode(decodeURIComponent(code).toUpperCase());
  if (!order) notFound();

  const s = STATUS[order.status] ?? STATUS.pending;

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <Link
        href={ROUTES.shop}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-hd-ink-400 hover:text-hd-ink-100 transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to the shop
      </Link>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-hd-ink-500">Order</p>
        <h1 className="text-3xl font-black text-hd-ink-50 font-mono tracking-widest">
          {order.accessCode}
        </h1>
      </div>

      <div className={cn("flex items-start gap-3 p-4 rounded-xl border", s.cls)}>
        <span className="shrink-0 mt-0.5">{s.icon}</span>
        <div>
          <p className="text-sm font-bold">{s.label}</p>
          <p className="text-xs opacity-80 mt-1 leading-relaxed">{s.blurb}</p>
          {order.status === "rejected" && order.rejectionReason && (
            <p className="text-xs mt-2">{order.rejectionReason}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl gradient-card border border-hd-ink-700 divide-y divide-hd-ink-800">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-hd-ink-100 truncate">
                {item.productName}
              </p>
              <p className="text-xs text-hd-ink-500 mt-0.5">
                {item.variantLabel && `Size ${item.variantLabel} · `}
                {item.quantity} × {formatNpr(item.unitPrice)}
              </p>
            </div>
            <span className="text-sm font-bold text-hd-ink-100 tabular-nums shrink-0">
              {formatNpr(item.lineTotal)}
            </span>
          </div>
        ))}

        <div className="p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-hd-ink-400">
            <span>Items</span>
            <span className="tabular-nums">{formatNpr(order.subtotal)}</span>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount</span>
              <span className="tabular-nums">−{formatNpr(order.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-hd-ink-800 text-base font-black text-hd-ink-50">
            <span>Total</span>
            <span className="text-hd-ember-400 tabular-nums">{formatNpr(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800 text-xs text-hd-ink-400 space-y-1">
        <p><span className="text-hd-ink-500">For</span> {order.fullName} · {order.phone}</p>
        {order.deliveryAddress && (
          <p><span className="text-hd-ink-500">To</span> {order.deliveryAddress}</p>
        )}
        <p>
          <span className="text-hd-ink-500">Placed</span>{" "}
          {new Date(order.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
          })}
        </p>
      </div>
    </main>
  );
}
