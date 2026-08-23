"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { rupees } from "@/lib/money";
import { SHIPPING_METHODS, SHIPPING_RULES } from "@/lib/constants";
import type { Quote } from "@/lib/pricing";

export default function CartPage() {
  const { lines, setQty, remove, hydrated } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [method, setMethod] = useState<string>("STANDARD");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (couponCode?: string | null) => {
    if (!lines.length) { setQuote(null); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, method, couponCode: couponCode ?? null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setQuote(null); }
      else { setQuote(data); setAppliedCoupon(data.couponCode); }
    } catch {
      setError("Could not refresh your cart. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [lines, method]);

  useEffect(() => { if (hydrated) refresh(appliedCoupon); }, [hydrated, refresh, appliedCoupon, method]);

  if (!hydrated) return <div className="mx-auto w-[92%] max-w-6xl py-20 text-center text-muted">Loading your cart…</div>;

  if (!lines.length) {
    return (
      <div className="mx-auto w-[92%] max-w-3xl py-20 text-center">
        <p className="text-6xl">🛍️</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-maroon">Your cart is empty</h1>
        <p className="mt-2 text-muted">Dress your deities in something beautiful.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-maroon px-8 py-3 text-gold-light hover:bg-maroon-dark">Continue Shopping</Link>
      </div>
    );
  }

  const q = quote;

  return (
    <div className="mx-auto w-[92%] max-w-6xl py-10">
      <h1 className="mb-8 font-display text-4xl font-semibold text-maroon">Your Cart</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Lines */}
        <div className="space-y-4">
          {q?.lines.map((l) => (
            <div key={l.productId + (l.variantId ?? "")} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <Link href={`/product/${l.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                {l.image && <Image src={l.image} alt={l.name} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/product/${l.slug}`} className="font-display text-lg leading-snug text-maroon hover:underline">{l.name}</Link>
                    {l.variantName && <p className="text-xs text-muted">{l.variantName}</p>}
                  </div>
                  <button onClick={() => remove(l.productId, l.variantId)} className="text-xs text-muted underline hover:text-red-800">Remove</button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-gold/50">
                    <button aria-label="Decrease" onClick={() => setQty(l.productId, l.variantId, l.qty - 1)} className="px-3 py-1 text-muted hover:text-maroon">−</button>
                    <span className="w-8 text-center text-sm font-medium">{l.qty}</span>
                    <button aria-label="Increase" onClick={() => setQty(l.productId, l.variantId, Math.min(l.qty + 1, l.stock))} className="px-3 py-1 text-muted hover:text-maroon">+</button>
                  </div>
                  <p className="font-semibold text-maroon">{rupees(l.lineTotal)}</p>
                </div>
              </div>
            </div>
          ))}
          {q && (
            <div className="flex flex-wrap gap-3 pt-2">
              {SHIPPING_METHODS.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm ${method === m ? "border-maroon bg-maroon text-gold-light" : "border-gold/50 text-ink"}`}>
                  <input type="radio" name="ship" className="accent-gold" checked={method === m} onChange={() => setMethod(m)} />
                  {SHIPPING_RULES[m].label} — {rupees(SHIPPING_RULES[m].flat)}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-semibold text-maroon">Order Summary</h2>
          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="mt-4 flex gap-2">
            <label htmlFor="coupon" className="sr-only">Coupon code</label>
            <input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code"
              className="flex-1 rounded-xl border border-gold/40 px-3 py-2 text-sm uppercase focus:border-gold focus:outline-none" />
            <button onClick={() => refresh(coupon || null)} className="rounded-xl bg-maroon px-4 py-2 text-sm text-gold-light hover:bg-maroon-dark">
              Apply
            </button>
          </div>
          {appliedCoupon && <p className="mt-2 text-sm text-emerald-800">✓ {appliedCoupon} applied — <button className="underline" onClick={() => { setAppliedCoupon(null); setCoupon(""); refresh(null); }}>remove</button></p>}

          {q && (
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{rupees(q.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{q.shipping === 0 ? "FREE" : rupees(q.shipping)}</dd></div>
              {q.discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Discount</dt><dd>− {rupees(q.discount)}</dd></div>}
              <div className="flex justify-between border-t border-gold/20 pt-3 text-base font-semibold"><dt>Total</dt><dd className="text-maroon">{rupees(q.total)}</dd></div>
            </dl>
          )}
          <Link
            href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon}&method=${method}` : `?method=${method}`}`}
            className={`mt-6 block rounded-full bg-gradient-to-br from-gold to-gold-light py-3 text-center font-medium text-maroon-deep ${loading ? "pointer-events-none opacity-60" : "hover:opacity-95"}`}
          >
            {loading ? "Updating…" : "Proceed to Checkout →"}
          </Link>
          <Link href="/shop" className="mt-3 block text-center text-sm text-muted underline hover:text-maroon">Continue shopping</Link>
          <p className="mt-4 text-center text-xs text-muted">🔒 Secure checkout · Razorpay · UPI / Cards / NetBanking</p>
        </aside>
      </div>
    </div>
  );
}
