// =============================================================================
// CartProvider — the basket, in the browser
// 'use client'
//
// The basket holds ids and quantities. Nothing else. No prices, no names, no
// stock — because a basket that remembers a price is a basket that can check
// out at last week's price, and one that remembers stock is one that will
// happily sell a shirt that went two days ago.
//
// Everything a rider sees about money and availability is re-read from the
// database by priceBasket() on every render of the basket. This file's only
// job is remembering what was picked, across page loads and route changes.
// =============================================================================

"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from "react";
import type { CartLine } from "@/types";

const STORAGE_KEY = "hd-cart-v1";

interface CartContextValue {
  lines:      CartLine[];
  /** Total number of items, for the badge on the nav. */
  count:      number;
  add:        (line: CartLine) => void;
  setQty:     (productId: string, variantId: string | null, quantity: number) => void;
  remove:     (productId: string, variantId: string | null) => void;
  clear:      () => void;
  /** False until localStorage has been read, so the badge never flashes 0. */
  hydrated:   boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

const sameLine = (a: CartLine, productId: string, variantId: string | null) =>
  a.productId === productId && (a.variantId ?? null) === (variantId ?? null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines,    setLines]    = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read once on mount rather than during render: localStorage does not exist
  // on the server, and reading it in the initial state would break hydration.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLines(parsed.filter((l): l is CartLine =>
            !!l && typeof l.productId === "string" && typeof l.quantity === "number"));
        }
      }
    } catch {
      // Corrupt or unavailable storage is an empty basket, not an error page.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;   // do not write the empty pre-hydration state back
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch { /* private mode, quota — the basket just will not persist */ }
  }, [lines, hydrated]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => sameLine(l, line.productId, line.variantId ?? null));
      if (i === -1) return [...prev, { ...line, variantId: line.variantId ?? null }];
      const copy = [...prev];
      copy[i] = { ...copy[i], quantity: copy[i].quantity + line.quantity };
      return copy;
    });
  }, []);

  const setQty = useCallback((productId: string, variantId: string | null, quantity: number) => {
    setLines((prev) => quantity <= 0
      ? prev.filter((l) => !sameLine(l, productId, variantId))
      : prev.map((l) => sameLine(l, productId, variantId) ? { ...l, quantity } : l));
  }, []);

  const remove = useCallback((productId: string, variantId: string | null) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, productId, variantId)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    add, setQty, remove, clear, hydrated,
  }), [lines, add, setQty, remove, clear, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
