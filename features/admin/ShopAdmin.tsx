// =============================================================================
// ShopAdmin — products, sizes, stock, discounts
// 'use client'
//
// Two views: the product list, where stock can be nudged without opening
// anything, and the product form. Stock is edited inline on purpose — the job
// it exists for is standing over a box counting shirts, and making that a
// six-click round trip through a modal is how stock counts stop being true.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Package, Star, EyeOff, AlertCircle,
  ArrowLeft, Save, Minus, X, ImageOff, Check,
} from "lucide-react";
import { cn }              from "@/utils/cn";
import { ImageUpload }     from "@/components/ui/ImageUpload";
import {
  saveProduct, deleteProduct, setVariantStock, saveShopSettings,
} from "@/lib/supabase/actions";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { formatNpr, discountedPrice, stockOf } from "@/features/shop/pricing";
import type { Product, ShopSettings } from "@/types";

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg bg-hd-ink-800 border border-hd-ink-700 text-sm",
  "text-hd-ink-100 placeholder:text-hd-ink-600",
  "focus:outline-none focus:border-hd-ember-600 focus:ring-1 focus:ring-hd-ember-600/40",
);

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-hd-ink-400 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-hd-ember-500 ml-0.5">*</span>}
    </label>
  );
}

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------------------------------------------------------------------------
// Product form
// ---------------------------------------------------------------------------

interface DraftVariant {
  id?: string; label: string; priceDelta: number; stock: number; isActive: boolean;
}

function ProductForm({
  product, onDone, onCancel,
}: {
  product: Product | null;
  onDone:  () => void;
  onCancel: () => void;
}) {
  const [name,     setName]     = useState(product?.name ?? "");
  const [slug,     setSlug]     = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!product);
  const [shortDesc, setShortDesc] = useState(product?.shortDescription ?? "");
  const [desc,     setDesc]     = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "Merch");
  const [price,    setPrice]    = useState(String(product?.price ?? ""));
  const [discount, setDiscount] = useState(String(product?.discountPercent ?? 0));
  const [images,   setImages]   = useState<string[]>(product?.imageUrls ?? []);
  const [stock,    setStock]    = useState(
    product?.stock === null || product?.stock === undefined ? "" : String(product.stock),
  );
  const [active,   setActive]   = useState(product?.isActive ?? true);
  const [featured, setFeatured] = useState(product?.isFeatured ?? false);
  const [variants, setVariants] = useState<DraftVariant[]>(
    product?.variants.map((v) => ({
      id: v.id, label: v.label, priceDelta: v.priceDelta, stock: v.stock, isActive: v.isActive,
    })) ?? [],
  );

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const save = async () => {
    setSaving(true); setError(null);
    const res = await saveProduct({
      id: product?.id,
      name, slug: slug || slugify(name),
      shortDescription: shortDesc, description: desc, category,
      price: Number(price) || 0,
      discountPercent: Number(discount) || 0,
      imageUrls: images,
      stock: variants.length ? null : (stock === "" ? null : Number(stock)),
      isActive: active, isFeatured: featured,
      variants: variants.filter((v) => v.label.trim()),
    });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    onDone();
  };

  const patchVariant = (i: number, patch: Partial<DraftVariant>) =>
    setVariants((prev) => prev.map((v, j) => j === i ? { ...v, ...patch } : v));

  return (
    <div className="space-y-6">
      <button
        type="button" onClick={onCancel}
        className="flex items-center gap-1.5 text-xs font-semibold text-hd-ink-400 hover:text-hd-ink-100 transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to the shop
      </button>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
          <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-sm text-hd-ember-300">{error}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label required>Name</Label>
          <input
            className={inputCls} value={name}
            onChange={(e) => {
              setName(e.target.value);
              // The slug follows the name until somebody takes it over, at
              // which point it stops moving — a published URL should not
              // change because a typo in the title was fixed.
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            placeholder="Himalayan Drift Riding Tee"
          />
        </div>
        <div>
          <Label required>Web address</Label>
          <input
            className={inputCls} value={slug}
            onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
            placeholder="riding-tee"
          />
          <p className="text-[11px] text-hd-ink-600 mt-1">/shop/{slug || "…"}</p>
        </div>
      </div>

      <div>
        <Label>One-line summary</Label>
        <input className={inputCls} value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          placeholder="Shown on the card in the shop window" />
      </div>

      <div>
        <Label>Full description</Label>
        <textarea
          value={desc} onChange={(e) => setDesc(e.target.value)} rows={4}
          placeholder="Fabric, fit, what it is for"
          className={cn(inputCls, "h-auto py-2.5 resize-none")}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label>Category</Label>
          <input className={inputCls} value={category}
            onChange={(e) => setCategory(e.target.value)} placeholder="Apparel" />
        </div>
        <div>
          <Label required>Price (Rs)</Label>
          <input className={inputCls} value={price} inputMode="decimal"
            onChange={(e) => setPrice(e.target.value)} placeholder="1500" />
        </div>
        <div>
          <Label>Discount %</Label>
          <input className={inputCls} value={discount} inputMode="numeric"
            onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
          <p className="text-[11px] text-hd-ink-600 mt-1">
            {Number(discount) > 0 && Number(price) > 0
              ? `Sells at ${formatNpr(Number(price) * (1 - Number(discount) / 100))}`
              : "Up to 90"}
          </p>
        </div>
      </div>

      {/* Photos */}
      <div>
        <Label>Photos</Label>
        <p className="text-[11px] text-hd-ink-600 mb-2">
          The first one is the thumbnail in the shop window.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((url, i) => (
            <div key={url} className="relative size-20 rounded-lg overflow-hidden border border-hd-ink-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Remove photo"
                className="absolute top-0.5 right-0.5 size-5 rounded-full bg-hd-ink-950/85 text-hd-ink-300 hover:text-white flex items-center justify-center"
              >
                <X className="size-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-hd-ink-950/80 text-[8px] text-center uppercase tracking-wider text-hd-ink-400 py-0.5">
                  Thumbnail
                </span>
              )}
            </div>
          ))}
        </div>
        <ImageUpload
          bucket={STORAGE_BUCKETS.productImages}
          currentUrl={null}
          onUpload={(url) => { if (url) setImages((prev) => [...prev, url]); }}
          compressMaxPx={1600}
        />
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <div>
          <Label>Sizes</Label>
          <p className="text-[11px] text-hd-ink-600">
            Add sizes and each one keeps its own stock count. With no sizes, the
            product carries a single stock number instead.
          </p>
        </div>

        {variants.map((v, i) => (
          <div key={i} className="flex items-end gap-2 p-3 rounded-lg bg-hd-ink-900/60 border border-hd-ink-800">
            <div className="w-20">
              <span className="block text-[9px] uppercase tracking-wide text-hd-ink-500 mb-1">Label</span>
              <input
                className={cn(inputCls, "h-9")} value={v.label}
                onChange={(e) => patchVariant(i, { label: e.target.value })}
                placeholder="M"
              />
            </div>
            <div className="w-24">
              <span className="block text-[9px] uppercase tracking-wide text-hd-ink-500 mb-1">+ Rs</span>
              <input
                className={cn(inputCls, "h-9")} value={String(v.priceDelta)} inputMode="decimal"
                onChange={(e) => patchVariant(i, { priceDelta: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="w-24">
              <span className="block text-[9px] uppercase tracking-wide text-hd-ink-500 mb-1">Stock</span>
              <input
                className={cn(inputCls, "h-9")} value={String(v.stock)} inputMode="numeric"
                onChange={(e) => patchVariant(i, { stock: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <label className="flex items-center gap-1.5 h-9 px-2 text-xs text-hd-ink-400 cursor-pointer">
              <input
                type="checkbox" checked={v.isActive}
                onChange={(e) => patchVariant(i, { isActive: e.target.checked })}
                className="size-3.5 accent-hd-ember-600"
              />
              Listed
            </label>
            <button
              type="button"
              onClick={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
              aria-label="Remove size"
              className="size-9 flex items-center justify-center rounded-lg border border-hd-ink-700 text-hd-ink-500 hover:text-hd-ember-400 transition-colors"
            >
              <Minus className="size-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setVariants((prev) => [
            ...prev, { label: "", priceDelta: 0, stock: 0, isActive: true },
          ])}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-hd-ink-700 hover:border-hd-ink-500 text-xs font-semibold text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
        >
          <Plus className="size-3.5" /> Add a size
        </button>
      </div>

      {/* Stock without sizes */}
      {variants.length === 0 && (
        <div className="sm:w-48">
          <Label>Stock</Label>
          <input className={inputCls} value={stock} inputMode="numeric"
            onChange={(e) => setStock(e.target.value)} placeholder="Leave blank" />
          <p className="text-[11px] text-hd-ink-600 mt-1">
            Blank means stock is not tracked — it never shows as sold out.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="flex items-start gap-3 p-4 rounded-xl border bg-hd-ink-900/60 border-hd-ink-700 cursor-pointer">
          <input type="checkbox" checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-0.5 size-4 accent-hd-ember-600" />
          <span>
            <span className="block text-sm font-semibold text-hd-ink-100">In the shop</span>
            <span className="block text-xs text-hd-ink-500 mt-0.5">
              Turn off to keep it here as a draft.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 p-4 rounded-xl border bg-hd-ink-900/60 border-hd-ink-700 cursor-pointer">
          <input type="checkbox" checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="mt-0.5 size-4 accent-hd-ember-600" />
          <span>
            <span className="block text-sm font-semibold text-hd-ink-100">Feature it</span>
            <span className="block text-xs text-hd-ink-500 mt-0.5">
              Shows larger, at the top of the shop.
            </span>
          </span>
        </label>
      </div>

      <button
        type="button" onClick={save} disabled={saving || !name.trim()}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
          saving || !name.trim()
            ? "bg-hd-ink-700 cursor-not-allowed opacity-60"
            : "bg-hd-ember-600 hover:bg-hd-ember-500 hover:shadow-glow-ember active:scale-[0.98]",
        )}
      >
        {saving
          ? <><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
          : <><Save className="size-4" />{product ? "Save product" : "Add to the shop"}</>}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline stock editor
// ---------------------------------------------------------------------------

function StockCell({ variantId, initial }: { variantId: string; initial: number }) {
  const [value, setValue] = useState(String(initial));
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const commit = async () => {
    const n = Math.max(0, Number(value) || 0);
    if (n === initial) { setState("idle"); return; }
    setState("saving");
    const res = await setVariantStock(variantId, n);
    setState(res.error ? "idle" : "saved");
    if (!res.error) setTimeout(() => setState("idle"), 1500);
  };

  return (
    <span className="inline-flex items-center gap-1">
      <input
        value={value}
        inputMode="numeric"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-12 h-7 px-1.5 text-center rounded bg-hd-ink-800 border border-hd-ink-700 text-xs text-hd-ink-100 tabular-nums focus:outline-none focus:border-hd-ember-600"
      />
      {state === "saving" && <span className="size-3 rounded-full border-2 border-hd-ink-600 border-t-hd-ember-500 animate-spin" />}
      {state === "saved"  && <Check className="size-3 text-emerald-400" />}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function ShopAdmin({
  initialProducts, initialSettings,
}: {
  initialProducts: Product[];
  initialSettings: ShopSettings;
}) {
  const [products] = useState(initialProducts);
  const [editing,  setEditing]  = useState<Product | null | "new">(null);
  const [settings, setSettings] = useState(initialSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistSettings = useCallback(async (next: ShopSettings) => {
    setSettings(next);
    setSavingSettings(true); setError(null);
    const res = await saveShopSettings(next);
    setSavingSettings(false);
    if (res.error) setError(res.error);
  }, []);

  const removeProduct = useCallback(async (id: string) => {
    const res = await deleteProduct(id);
    if (res.error) { setError(res.error); return; }
    window.location.reload();
  }, []);

  if (editing !== null) {
    return (
      <ProductForm
        product={editing === "new" ? null : editing}
        onDone={() => window.location.reload()}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hd-ember-950/60 border border-hd-ember-800/40">
          <AlertCircle className="size-4 text-hd-ember-400 shrink-0 mt-px" />
          <p className="text-sm text-hd-ember-300">{error}</p>
        </div>
      )}

      {/* Shop-wide settings */}
      <div className="space-y-4 p-5 rounded-2xl gradient-card border border-hd-ink-700">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.isEnabled}
            disabled={savingSettings}
            onChange={(e) => persistSettings({ ...settings, isEnabled: e.target.checked })}
            className="mt-0.5 size-4 accent-hd-ember-600"
          />
          <span>
            <span className="block text-sm font-semibold text-hd-ink-100">Open the shop</span>
            <span className="block text-xs text-hd-ink-500 mt-0.5">
              Off means no Shop link in the menu and /shop returns not-found —
              rather than an empty shop that looks broken.
            </span>
          </span>
        </label>

        <div>
          <Label>Announcement</Label>
          <textarea
            value={settings.announcement}
            onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
            onBlur={() => persistSettings(settings)}
            rows={2}
            placeholder="Pre-orders close Friday. Collect at the Gorkha ride."
            className={cn(inputCls, "h-auto py-2.5 resize-none")}
          />
        </div>

        <div>
          <Label>Delivery note</Label>
          <textarea
            value={settings.deliveryNote}
            onChange={(e) => setSettings({ ...settings, deliveryNote: e.target.value })}
            onBlur={() => persistSettings(settings)}
            rows={2}
            placeholder="Inside the valley we deliver. Outside, we send by bus."
            className={cn(inputCls, "h-auto py-2.5 resize-none")}
          />
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-hd-ink-700">
          <Package className="size-8 mx-auto mb-3 text-hd-ink-700" />
          <p className="text-sm text-hd-ink-500">Nothing in the shop yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const total = stockOf(p);
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border gradient-card border-hd-ink-700/60",
                  !p.isActive && "opacity-60",
                )}
              >
                <span className="size-14 rounded-lg overflow-hidden bg-hd-ink-900 shrink-0">
                  {p.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrls[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <ImageOff className="size-4 text-hd-ink-700" />
                    </span>
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-hd-ink-50">
                    <span className="truncate">{p.name}</span>
                    {p.isFeatured && (
                      <Star className="size-3 text-hd-ember-400 fill-current shrink-0" />
                    )}
                    {!p.isActive && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-hd-ink-800 text-hd-ink-400 border border-hd-ink-700 shrink-0">
                        <EyeOff className="size-2" /> Draft
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-hd-ink-500 mt-0.5">
                    {formatNpr(discountedPrice(p))}
                    {p.discountPercent > 0 && (
                      <span className="ml-1.5 line-through text-hd-ink-600">
                        {formatNpr(p.price)}
                      </span>
                    )}
                    {" · "}
                    {total === null
                      ? "stock not tracked"
                      : total === 0 ? "sold out" : `${total} in stock`}
                  </p>

                  {/* Per-size stock, editable where you can see it */}
                  {p.variants.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {p.variants.map((v) => (
                        <span
                          key={v.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border",
                            v.stock === 0
                              ? "border-hd-ember-900/50 text-hd-ember-400/80"
                              : "border-hd-ink-700 text-hd-ink-400",
                          )}
                        >
                          <span className="font-semibold">{v.label}</span>
                          <StockCell variantId={v.id} initial={v.stock} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-hd-ink-800 border border-hd-ink-700 hover:border-hd-ink-500 text-xs font-medium text-hd-ink-300 hover:text-hd-ink-100 transition-colors"
                  >
                    <Pencil className="size-3" /> Edit
                  </button>
                  <ConfirmDelete onConfirm={() => removeProduct(p.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-hd-ember-600 hover:bg-hd-ember-500 text-white text-sm font-semibold transition-all hover:shadow-glow-ember"
      >
        <Plus className="size-4" /> Add a product
      </button>
    </div>
  );
}

function ConfirmDelete({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button" onClick={() => setArmed(true)} aria-label="Delete product"
        className="flex items-center justify-center size-8 rounded-lg border border-hd-ink-700 text-hd-ink-500 hover:text-hd-ember-400 hover:border-hd-ember-800 transition-colors"
      >
        <Trash2 className="size-3.5" />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button type="button" onClick={() => setArmed(false)}
        className="px-2 py-1.5 rounded-lg text-xs text-hd-ink-400 hover:text-hd-ink-100">
        Cancel
      </button>
      <button type="button" onClick={onConfirm}
        className="px-2.5 py-1.5 rounded-lg bg-hd-ember-700 hover:bg-hd-ember-600 text-white text-xs font-semibold transition-colors">
        Delete
      </button>
    </span>
  );
}
