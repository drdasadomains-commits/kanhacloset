"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { rupees } from "@/lib/money";

type Variant = { id: string; name: string; price: number | null; stockQuantity: number };

export default function ProductBuyBox({
  productId, name, price, stock, variants,
}: { productId: string; name: string; price: number; stock: number; variants: Variant[] }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const effectivePrice = variant?.price ?? price;
  const effectiveStock = variant ? variant.stockQuantity : stock;
  const out = effectiveStock <= 0;

  function handleAdd() {
    if (out) return;
    add({ productId, variantId, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-maroon">{rupees(effectivePrice)}</span>
        <span className="text-sm text-muted">inclusive of all taxes</span>
      </div>

      {variants.length > 0 && (
        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-medium text-ink">Select size / variant</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { setVariantId(v.id); setQty(1); }}
                  disabled={v.stockQuantity <= 0}
                  aria-pressed={selected}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected ? "border-maroon bg-maroon text-gold-light" : "border-gold/50 text-ink hover:bg-gold/10"
                  }`}
                >
                  {v.name}{v.price ? ` · ${rupees(v.price)}` : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-full border border-gold/50">
          <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Decrease quantity" className="px-4 py-2 text-lg text-muted hover:text-maroon">−</button>
          <span aria-live="polite" className="w-8 text-center font-medium">{qty}</span>
          <button type="button" onClick={() => setQty((n) => Math.min(Math.min(10, effectiveStock), n + 1))} aria-label="Increase quantity" className="px-4 py-2 text-lg text-muted hover:text-maroon">+</button>
        </div>
        <p className="text-sm text-muted">
          {out ? <span className="font-medium text-red-800">Out of stock</span> : effectiveStock <= 5 ? <span className="text-gold">Only {effectiveStock} left — order soon</span> : "In stock"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={out}
          className="rounded-full bg-maroon px-8 py-3 font-medium text-gold-light transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {added ? "✓ Added to Cart" : "Add to Cart"}
        </button>
        {out ? (
          <span className="rounded-full border border-gold/50 px-8 py-3 text-muted">Notify me — out of stock</span>
        ) : (
          <Link
            href="/cart"
            onClick={handleAdd}
            className="rounded-full bg-gradient-to-br from-gold to-gold-light px-8 py-3 font-medium text-maroon-deep transition-transform hover:-translate-y-0.5"
          >
            Buy Now
          </Link>
        )}
      </div>
      {added && (
        <p className="mt-3 text-sm text-emerald-800">
          Added to cart. <Link href="/cart" className="underline">View cart →</Link>
        </p>
      )}
    </div>
  );
}
