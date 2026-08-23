import { db } from "@/lib/db";
import { rupees } from "@/lib/money";
import { SHIPPING_RULES, type ShippingMethod } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track Your Order" };

type SearchParams = Promise<{ number?: string }>;
const STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];

export default async function TrackPage({ searchParams }: { searchParams: SearchParams }) {
  const { number } = await searchParams;
  const order = number
    ? await db.order.findUnique({ where: { orderNumber: number.trim().toUpperCase() }, include: { items: true, statusHistory: { orderBy: { createdAt: "desc" } } } })
    : null;

  return (
    <div className="mx-auto w-[92%] max-w-2xl py-14">
      <h1 className="text-center font-display text-4xl font-semibold text-maroon">Track Your Order</h1>
      <p className="mt-2 text-center text-sm text-muted">Enter the order number from your confirmation (e.g. KC20260823-A1B2C3).</p>
      <form className="mx-auto mt-6 flex max-w-md gap-2">
        <label htmlFor="number" className="sr-only">Order number</label>
        <input id="number" name="number" defaultValue={number} placeholder="KC20260823-XXXXXX" required
          className="flex-1 rounded-full border border-gold/40 bg-white px-5 py-2.5 text-sm uppercase focus:border-gold focus:outline-none" />
        <button className="rounded-full bg-maroon px-6 py-2.5 text-sm text-gold-light hover:bg-maroon-dark">Track</button>
      </form>

      {number && !order && (
        <p className="mx-auto mt-8 max-w-md rounded-2xl bg-red-50 p-4 text-center text-sm text-red-800">
          No order found for “{number}”. Check the number and try again.
        </p>
      )}

      {order && (
        <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl text-maroon">{order.orderNumber}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
              Payment: {order.paymentStatus}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Placed {order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
            {SHIPPING_RULES[order.shippingMethod as ShippingMethod]?.label ?? order.shippingMethod} · Total {rupees(order.total)}
          </p>

          {order.trackingNumber && (
            <p className="mt-2 text-sm">Courier tracking: <span className="font-semibold text-maroon">{order.trackingNumber}</span></p>
          )}

          <ol className="mt-6 flex items-center" aria-label="Order progress">
            {STEPS.map((s, i) => {
              const idx = STEPS.indexOf(order.status);
              const done = idx >= i && idx <= 5;
              return (
                <li key={s} className="flex flex-1 flex-col items-center">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${done ? "border-gold bg-gold text-maroon-deep" : "border-gold/30 bg-white text-muted/50"}`}>
                    {i < idx ? "✓" : i + 1}
                  </span>
                  <span className={`mt-1 text-[10px] uppercase tracking-wide ${done ? "text-maroon" : "text-muted/60"}`}>{s}</span>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 space-y-1 border-t border-gold/15 pt-4 text-sm text-muted">
            {order.statusHistory.map((h) => (
              <p key={h.id}>
                <span className="text-ink">{h.toStatus}</span>
                {h.note ? ` — ${h.note}` : ""}{" "}
                <span className="text-xs">({h.createdAt.toLocaleString("en-IN")})</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
