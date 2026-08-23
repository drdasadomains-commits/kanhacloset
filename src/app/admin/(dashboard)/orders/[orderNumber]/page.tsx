import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { rupees } from "@/lib/money";
import { ORDER_STATUSES } from "@/lib/constants";
import { updateOrder } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order · Admin" };

type Addr = { fullName?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string; country?: string };

export default async function AdminOrderDetail({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true, payments: true, statusHistory: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();

  const addr = (order.shippingAddress as Addr) ?? {};
  const field = "w-full rounded-xl border border-gold/40 bg-cream px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-maroon">{order.orderNumber}</h1>
        <Link href="/admin/orders" className="text-sm text-muted underline hover:text-maroon">← All orders</Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        {order.createdAt.toLocaleString("en-IN")} · Payment: <strong>{order.paymentStatus}</strong> · Status: <strong>{order.status}</strong>
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Items & totals */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-maroon">Items</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} className="border-b border-gold/10">
                  <td className="py-2">{i.productName}{i.variantName ? ` (${i.variantName})` : ""}</td>
                  <td className="py-2 text-center text-muted">× {i.quantity}</td>
                  <td className="py-2 text-right">{rupees(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{rupees(order.subtotal)}</dd></div>
            <div className="flex justify-between text-muted"><dt>Shipping ({order.shippingMethod})</dt><dd>{rupees(order.shipping)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>− {rupees(order.discount)}</dd></div>}
            <div className="flex justify-between border-t border-gold/20 pt-2 font-semibold text-maroon"><dt>Total</dt><dd>{rupees(order.total)}</dd></div>
          </dl>

          <h3 className="mt-6 font-display text-lg text-maroon">Payments</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {order.payments.map((p) => (
              <li key={p.id}>
                {p.status} · {rupees(p.amount)} · rzp: {p.razorpayPaymentId ?? p.razorpayOrderId ?? "—"}
                {p.method ? ` · ${p.method}` : ""}{p.failureReason ? ` · ${p.failureReason}` : ""}
              </li>
            ))}
          </ul>
        </section>

        {/* Customer + fulfilment */}
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-maroon">Customer &amp; Shipping</h2>
            <p className="mt-2 text-sm">
              <strong>{order.customerName}</strong> ({order.customerEmail})<br />
              {order.customerPhone}<br />
              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
              {addr.city}, {addr.state} {addr.pincode}<br />
              {addr.country}
            </p>
          </section>

          <form action={updateOrder} className="rounded-2xl bg-white p-6 shadow-sm">
            <input type="hidden" name="orderNumber" value={order.orderNumber} />
            <h2 className="font-display text-xl font-semibold text-maroon">Fulfilment</h2>
            <label htmlFor="status" className="mt-3 block text-sm font-medium">Status</label>
            <select id="status" name="status" defaultValue={order.status} className={field}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label htmlFor="trackingNumber" className="mt-3 block text-sm font-medium">Courier tracking number</label>
            <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} placeholder="e.g. SR123456789" className={field} />
            <label htmlFor="note" className="mt-3 block text-sm font-medium">Internal / status note</label>
            <input id="note" name="note" placeholder="Optional note" className={field} />
            <button className="mt-4 rounded-full bg-maroon px-6 py-2 text-sm text-gold-light hover:bg-maroon-dark">Update Order</button>
            <p className="mt-2 text-xs text-muted">Cancelling, returning or refunding a paid order automatically restores inventory.</p>
          </form>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-maroon">History</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {order.statusHistory.map((h) => (
                <li key={h.id}>
                  <span className="text-ink">{h.toStatus}</span>{h.note ? ` — ${h.note}` : ""}{" "}
                  <span className="text-xs">({h.createdAt.toLocaleString("en-IN")})</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
