"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart";
import { rupees } from "@/lib/money";
import { SHIPPING_RULES } from "@/lib/constants";
import type { Quote } from "@/lib/pricing";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}

type CheckoutResponse = {
  mode: "razorpay" | "simulated";
  orderNumber: string;
  orderId: string;
  amount: number;
  razorpayOrderId?: string;
  keyId?: string;
  prefill?: { name: string; email: string; contact: string };
};

const FIELDS = [
  ["fullName", "Full name", "text", "e.g. Ananya Sharma", true],
  ["phone", "Mobile number", "tel", "10-digit mobile", true],
  ["email", "Email", "email", "you@example.com", true],
  ["line1", "Address line 1", "text", "House / flat / street", true],
  ["line2", "Address line 2 (optional)", "text", "Landmark / area", false],
  ["city", "City", "text", "e.g. Vrindavan", true],
  ["state", "State", "text", "e.g. Uttar Pradesh", true],
  ["pincode", "PIN code", "text", "6-digit PIN", true],
] as const;

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-[92%] max-w-6xl py-20 text-center text-muted">Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const { lines, clear, hydrated } = useCart();
  const router = useRouter();
  const params = useSearchParams();
  const method = params.get("method") === "EXPRESS" ? "EXPRESS" : "STANDARD";
  const couponCode = params.get("coupon");

  const [form, setForm] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => setScriptReady(true);
    document.body.appendChild(s);
  }, []);

  const refreshQuote = useCallback(async () => {
    if (!lines.length) return;
    const res = await fetch("/api/cart/quote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, method, couponCode }),
    });
    const data = await res.json();
    if (res.ok) setQuote(data); else setError(data.error);
  }, [lines, method, couponCode]);

  useEffect(() => { if (hydrated) refreshQuote(); }, [hydrated, refreshQuote]);

  async function verifyPayment(orderId: string, rzp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    const res = await fetch("/api/checkout/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...rzp }),
    });
    const data = await res.json();
    if (res.ok) { clear(); router.push(`/order/success?number=${data.orderNumber ?? ""}`); }
    else setError(data.error ?? "Verification failed");
  }

  async function pay() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: { ...form, country: "India" }, method, couponCode, lines }),
      });
      const data: CheckoutResponse & { error?: string } = await res.json();
      if (!res.ok) { setError(data.error ?? "Checkout failed"); return; }

      if (data.mode === "simulated") {
        // Local dev only (no Razorpay keys): confirm via simulated capture.
        const v = await fetch("/api/dev/simulate-payment", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderId }),
        });
        const vd = await v.json();
        if (v.ok && vd.orderNumber) { clear(); router.push(`/order/success?number=${vd.orderNumber}`); }
        else setError(vd.error ?? "Simulation failed");
        return;
      }

      if (!scriptReady || !window.Razorpay) { setError("Payment window could not load. Check your connection and retry."); return; }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "Kanha Closet",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: data.prefill,
        theme: { color: "#4a0e1e" },
        handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          verifyPayment(data.orderId, response).finally(() => setBusy(false));
        },
        modal: {
          ondismiss: () => {
            fetch("/api/checkout/verify", {
              method: "PUT", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderId, reason: "Checkout dismissed" }),
            });
            setBusy(false);
            setError("Payment window closed before completion. Your order is saved as pending — you can retry.");
          },
        },
      });
      rzp.on("payment.failed", (raw) => {
        const resp = raw as { error?: { description?: string } };
        setError(resp.error?.description ?? "Payment failed. No amount was deducted.");
        setBusy(false);
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  if (!hydrated) return <div className="mx-auto w-[92%] max-w-6xl py-20 text-center text-muted">Loading checkout…</div>;
  if (!lines.length) {
    return (
      <div className="mx-auto w-[92%] max-w-3xl py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-maroon">Nothing to check out</h1>
        <a href="/shop" className="mt-6 inline-block rounded-full bg-maroon px-8 py-3 text-gold-light">Back to Shop</a>
      </div>
    );
  }

  const valid = FIELDS.filter((f) => f[4]).every((f) => (form[f[0]] ?? "").trim().length >= (f[0] === "pincode" || f[0] === "phone" ? 10 : 3));

  return (
    <div className="mx-auto w-[92%] max-w-6xl py-10">
      <h1 className="mb-8 font-display text-4xl font-semibold text-maroon">Checkout</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={(e) => { e.preventDefault(); if (valid && !busy) pay(); }} className="space-y-4">
          <fieldset className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2">
            <legend className="mb-2 px-2 font-display text-xl text-maroon">Delivery Details</legend>
            {FIELDS.map(([name, label, type, placeholder, required]) => (
              <div key={name} className={name === "line1" || name === "line2" ? "sm:col-span-2" : ""}>
                <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink">{label}</label>
                <input
                  id={name} name={name} type={type} placeholder={placeholder} required={required}
                  inputMode={name === "phone" || name === "pincode" ? "numeric" : undefined}
                  value={form[name] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                  className="w-full rounded-xl border border-gold/40 bg-cream px-4 py-2.5 text-ink focus:border-gold focus:outline-none"
                />
              </div>
            ))}
          </fieldset>
          <div className="rounded-2xl bg-white p-6 text-sm shadow-sm">
            <p className="font-display text-xl text-maroon">Shipping Method</p>
            <p className="mt-1 text-muted">{SHIPPING_RULES[method].label} · {quote ? (quote.shipping === 0 ? "FREE" : rupees(quote.shipping)) : "…"}</p>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          <button
            type="submit" disabled={!valid || busy || !quote}
            className="w-full rounded-full bg-gradient-to-br from-gold to-gold-light py-3.5 font-semibold text-maroon-deep transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Processing…" : quote ? `Pay ${rupees(quote.total)} Securely` : "Loading…"}
          </button>
          <p className="text-center text-xs text-muted">🔒 Payments secured by Razorpay · UPI · Cards · NetBanking · Wallets</p>
        </form>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-semibold text-maroon">Order Summary</h2>
          {quote?.lines.map((l) => (
            <div key={l.productId + (l.variantId ?? "")} className="mt-3 flex justify-between gap-3 text-sm">
              <span className="text-muted">{l.name}{l.variantName ? ` (${l.variantName})` : ""} × {l.qty}</span>
              <span className="shrink-0">{rupees(l.lineTotal)}</span>
            </div>
          ))}
          {quote && (
            <dl className="mt-5 space-y-2 border-t border-gold/20 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{rupees(quote.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{quote.shipping === 0 ? "FREE" : rupees(quote.shipping)}</dd></div>
              {quote.discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Discount ({quote.couponCode})</dt><dd>− {rupees(quote.discount)}</dd></div>}
              <div className="flex justify-between border-t border-gold/20 pt-3 text-base font-semibold"><dt>Total</dt><dd className="text-maroon">{rupees(quote.total)}</dd></div>
            </dl>
          )}
        </aside>
      </div>
    </div>
  );
}
