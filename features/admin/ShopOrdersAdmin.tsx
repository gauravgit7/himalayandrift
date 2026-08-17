// =============================================================================
// ShopOrdersAdmin — the order queue
// 'use client'
//
// Approving is the moment stock comes off the shelf, not submission. An order
// nobody has paid for should never quietly empty the shop, and the count only
// moves once a human has looked at the payment screenshot.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  Clock, CheckCircle2, XCircle, PackageCheck, Eye, X,
  AlertCircle, ShoppingBag, ExternalLink,
} from "lucide-react";
import { cn }        from "@/utils/cn";
import { formatNpr } from "@/features/shop/pricing";
import {
  approveShopOrder, fulfilShopOrder, rejectShopOrder,
} from "@/lib/supabase/actions";
import type { ShopOrder, ShopOrderStatus } from "@/types";

const STATUS_META: Record<ShopOrderStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:   { label: "pending",   cls: "bg-amber-900/30 text-amber-400 border-amber-800/30",           icon: <Clock className="size-2.5" /> },
  approved:  { label: "approved",  cls: "bg-emerald-900/30 text-emerald-400 border-emerald-800/30",     icon: <CheckCircle2 className="size-2.5" /> },
  fulfilled: { label: "sent",      cls: "bg-sky-900/30 text-sky-400 border-sky-800/30",                 icon: <PackageCheck className="size-2.5" /> },
  rejected:  { label: "rejected",  cls: "bg-hd-ember-950/40 text-hd-ember-400 border-hd-ember-900/30",  icon: <XCircle className="size-2.5" /> },
};

function StatusChip({ status }: { status: ShopOrderStatus }) {
  const s = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
      s.cls,
    )}>
      {s.icon}{s.label}
    </span>
  );
}

type Filter = "all" | ShopOrderStatus;

export function ShopOrdersAdmin({ initialOrders }: { initialOrders: ShopOrder[] }) {
  const [orders, setOrders]   = useState(initialOrders);
  const [filter, setFilter]   = useState<Filter>("pending");
  const [viewing, setViewing] = useState<ShopOrder | null>(null);

  const patch = useCallback((id: string, next: Partial<ShopOrder>) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, ...next } : o));
    setViewing((v) => v && v.id === id ? { ...v, ...next } : v);
  }, []);

  const counts = {
    all:       orders.length,
    pending:   orders.filter((o) => o.status === "pending").length,
    approved:  orders.filter((o) => o.status === "approved").length,
    fulfilled: orders.filter((o) => o.status === "fulfilled").length,
    rejected:  orders.filter((o) => o.status === "rejected").length,
  };

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        {(["all", "pending", "approved", "fulfilled", "rejected"] as Filter[]).map((f) => (
          <button
            key={f} type="button" onClick={() => setFilter(f)}
            className={cn(
              "p-3 rounded-xl border text-left transition-all",
              filter === f
                ? "border-hd-ember-700/60 bg-hd-ember-950/20"
                : "gradient-card border-hd-ink-700/60 hover:border-hd-ink-500",
            )}
          >
            <p className={cn(
              "text-xl font-black",
              f === "pending"   && "text-amber-400",
              f === "approved"  && "text-emerald-400",
              f === "fulfilled" && "text-sky-400",
              f === "rejected"  && "text-hd-ember-400",
              f === "all"       && "text-hd-ink-50",
            )}>
              {counts[f]}
            </p>
            <p className="text-[11px] text-hd-ink-500 capitalize mt-0.5">
              {f === "fulfilled" ? "sent" : f}
            </p>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="py-20 text-center">
          <ShoppingBag className="size-12 mx-auto mb-4 text-hd-ink-700" />
          <p className="text-sm text-hd-ink-500">No {filter !== "all" ? filter : ""} orders.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 p-4 rounded-xl gradient-card border border-hd-ink-700/60 hover:border-hd-ink-500 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-hd-ink-50 text-sm truncate">
                  {order.fullName}
                  <span className="ml-2 font-mono text-[11px] text-hd-ember-400">
                    {order.accessCode}
                  </span>
                </p>
                <p className="text-xs text-hd-ink-500 mt-0.5">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  {" · "}
                  {new Date(order.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short",
                  })}
                  {" · "}
                  {order.phone}
                </p>
              </div>

              <span className="text-sm font-black text-hd-ember-400 tabular-nums shrink-0">
                {formatNpr(order.total)}
              </span>

              <div className="flex items-center gap-3 shrink-0">
                <StatusChip status={order.status} />
                <button
                  type="button"
                  onClick={() => setViewing(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hd-ink-800 border border-hd-ink-700 hover:border-hd-ink-500 text-hd-ink-300 hover:text-hd-ink-100 text-xs font-medium transition-colors"
                >
                  <Eye className="size-3.5" /> Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <OrderModal order={viewing} onClose={() => setViewing(null)} onPatch={patch} />
      )}
    </>
  );
}

function OrderModal({
  order, onClose, onPatch,
}: {
  order:   ShopOrder;
  onClose: () => void;
  onPatch: (id: string, next: Partial<ShopOrder>) => void;
}) {
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [reason,  setReason]  = useState("");
  const [showRej, setShowRej] = useState(false);

  const run = async (fn: () => Promise<{ error: string | null }>, next: Partial<ShopOrder>) => {
    setBusy(true); setError(null);
    const res = await fn();
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    onPatch(order.id, next);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-hd-ink-900 border border-hd-ink-700 rounded-2xl shadow-cinematic">

        <div className="flex items-center justify-between p-5 border-b border-hd-ink-800">
          <div>
            <h2 className="text-base font-bold text-hd-ink-50">{order.fullName}</h2>
            <p className="text-xs text-hd-ink-500 mt-0.5 font-mono">{order.accessCode}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-hd-ink-400 hover:text-hd-ink-100 hover:bg-hd-ink-800 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <StatusChip status={order.status} />

          {/* Items */}
          <div className="rounded-xl border border-hd-ink-700/60 divide-y divide-hd-ink-800">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-hd-ink-100 truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-hd-ink-500 mt-0.5">
                    {item.variantLabel && `Size ${item.variantLabel} · `}
                    {item.quantity} × {formatNpr(item.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-bold text-hd-ink-100 tabular-nums">
                  {formatNpr(item.lineTotal)}
                </span>
              </div>
            ))}
            <div className="flex justify-between p-3 text-sm font-black text-hd-ink-50">
              <span>Total</span>
              <span className="text-hd-ember-400 tabular-nums">{formatNpr(order.total)}</span>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Phone",   value: order.phone },
              { label: "Email",   value: order.email ?? "—" },
              { label: "Address", value: order.deliveryAddress ?? "Collecting at a ride" },
              { label: "Txn ID",  value: order.paymentReference ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-lg bg-hd-ink-800/60 border border-hd-ink-700/40">
                <p className="text-[9px] uppercase tracking-wider text-hd-ink-500 mb-0.5">{label}</p>
                <p className="text-sm text-hd-ink-100 break-words">{value}</p>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="p-3 rounded-lg bg-hd-ink-800/60 border border-hd-ink-700/40">
              <p className="text-[9px] uppercase tracking-wider text-hd-ink-500 mb-1">Notes</p>
              <p className="text-sm text-hd-ink-200 whitespace-pre-line">{order.notes}</p>
            </div>
          )}

          {order.paymentScreenshotUrl && (
            <a
              href={order.paymentScreenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-sm text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
            >
              <ExternalLink className="size-4 shrink-0" />
              Open the payment screenshot
            </a>
          )}

          {order.status === "rejected" && order.rejectionReason && (
            <div className="p-3 rounded-lg bg-hd-ember-950/40 border border-hd-ember-900/30">
              <p className="text-[9px] uppercase tracking-wider text-hd-ember-600 mb-1">Reason</p>
              <p className="text-xs text-hd-ember-300">{order.rejectionReason}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-hd-ember-950/50 border border-hd-ember-800/40 text-hd-ember-300 text-sm">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />{error}
            </div>
          )}

          {showRej && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide">
                Reason <span className="text-hd-ember-500">*</span>
              </label>
              <textarea
                value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                placeholder="e.g. The screenshot does not show a completed payment."
                className="w-full px-3 py-2 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm text-hd-ink-100 placeholder:text-hd-ink-600 focus:outline-none focus:border-hd-ember-600 resize-none"
              />
            </div>
          )}
        </div>

        {order.status !== "rejected" && (
          <div className="flex items-center gap-2 p-5 border-t border-hd-ink-800">
            {showRej ? (
              <>
                <button
                  onClick={() => setShowRej(false)} disabled={busy}
                  className="px-4 py-2.5 rounded-xl border border-hd-ink-700 text-hd-ink-300 hover:text-hd-ink-100 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => run(
                    () => rejectShopOrder(order.id, reason),
                    { status: "rejected", rejectionReason: reason },
                  )}
                  disabled={busy || !reason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-all disabled:opacity-60"
                >
                  Confirm rejection
                </button>
              </>
            ) : order.status === "pending" ? (
              <>
                <button
                  onClick={() => setShowRej(true)} disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-hd-ember-800/60 text-hd-ember-400 hover:bg-hd-ember-950/40 text-sm font-semibold transition-all"
                >
                  <XCircle className="size-4" /> Reject
                </button>
                <button
                  onClick={() => run(
                    () => approveShopOrder(order.id),
                    { status: "approved", approvedAt: new Date().toISOString() },
                  )}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-all disabled:opacity-60"
                >
                  <CheckCircle2 className="size-4" /> Approve
                </button>
              </>
            ) : order.status === "approved" ? (
              <button
                onClick={() => run(
                  () => fulfilShopOrder(order.id),
                  { status: "fulfilled", fulfilledAt: new Date().toISOString() },
                )}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                <PackageCheck className="size-4" /> Mark as sent
              </button>
            ) : (
              <p className="text-xs text-hd-ink-500 py-1">
                Handed over on {order.fulfilledAt
                  ? new Date(order.fulfilledAt).toLocaleDateString("en-GB")
                  : "—"}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
