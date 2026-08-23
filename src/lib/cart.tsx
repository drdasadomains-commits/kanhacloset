"use client";

// Cart lives in localStorage (id + qty only). Prices are ALWAYS recalculated
// on the server at checkout — the browser never dictates amounts (spec §13).
import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";

export type CartLine = { productId: string; variantId: string | null; qty: number };
export type ResolvedLine = CartLine & {
  name: string; slug: string; variantName: string | null;
  price: number; image: string | null; stock: number; lineTotal: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  add: (line: CartLine) => void;
  setQty: (productId: string, variantId: string | null, qty: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
  hydrated: boolean;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "kc_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === line.productId && l.variantId === line.variantId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + line.qty, 10) };
        return next;
      }
      return [...prev, { ...line, qty: Math.min(line.qty, 10) }];
    });
  }, []);

  const setQty = useCallback((productId: string, variantId: string | null, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => !(l.productId === productId && l.variantId === variantId))
        : prev.map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, qty: Math.min(qty, 10) } : l)),
    );
  }, []);

  const remove = useCallback((productId: string, variantId: string | null) => {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.variantId === variantId)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.qty, 0), add, setQty, remove, clear, hydrated }),
    [lines, add, setQty, remove, clear, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
