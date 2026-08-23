import Link from "next/link";
import { db } from "@/lib/db";
import { rupees } from "@/lib/money";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ number?: string }>;
const STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];

export default async function OrderSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { number } = await searchParams;
  if (!number) notFound();

  const order = await db.order.findUnique({
    where: { orderNumber: number },
    include: { items: true },
  });
  if (!order) notFound();

  const paid = order.paymentStatus === "PAID";
  const stepIndex = Math.max(0, STEPS.indexOf(order.status));

  return (
    <div className="mx-auto w-[92%] max-w-3xl py-14">
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">
        <p className="text-5xl">{paid ? "🙏" : "⏳"}</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-maroon">
          {paid ? "Dhanyavaad! Your order is confirmed" : "Order received — awaiting payment"}
        </h1>
        <p className="mt-2 text-muted">
          Order <span className="font-semibold text-ink">{order.orderNumber}</span>
          {paid ? " — a confirmation has been noted for your email." : " — if you completed payment, this will update within a minute."}
        </p>

        {/* timeline */}
        <ol className="mx-auto mt-8 flex max-w-md items-center" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${i <= stepIndex ? "border-gold bg-gold text-maroon-deep" : "border-gold/30 bg-white text-muted/50"}`}>
                {i < stepIndex ? "✓" : i + 1}
              </span>
              <span className={`mt-1 text-[10px] uppercase tracking-wide ${i <= stepIndex ? "text-maroon" : "text-muted/60"}`}>{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl bg-cream p-5 text-left text-sm">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between border-b border-gold/15 py-2 last:border-0">
              <span className="text-muted">{i.productName}{i.variantName ? ` (${i.variantName})` : ""} × {i.quantity}</span>
              <span>{rupees(i.lineTotal)}</span>
            </div>
          ))}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-muted"><span>Shipping</span><span>{order.shipping === 0 ? "FREE" : rupees(order.shipping)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-800"><span>Discount</span><span>− {rupees(order.discount)}</span></div>}
            <div className="flex justify-between font-semibold text-maroon"><span>Total {paid ? "(Paid)" : "(Due)"}</span><span>{rupees(order.total)}</span></div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/track?number=${order.orderNumber}`} className="rounded-full bg-maroon px-6 py-2.5 text-sm text-gold-light hover:bg-maroon-dark">Track this order</Link>
          <Link href="/shop" className="rounded-full border border-gold/60 px-6 py-2.5 text-sm text-maroon hover:bg-gold/10">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
