import Link from "next/link";
import { db } from "@/lib/db";
import { rupees } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Admin" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const orders = await db.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { orderNumber: true, customerName: true, total: true, status: true, paymentStatus: true, createdAt: true, _count: { select: { items: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-maroon">Orders</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="text-left text-xs uppercase text-muted"><th className="p-3">Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderNumber} className="border-t border-gold/10 hover:bg-gold/5">
                <td className="p-3"><Link href={`/admin/orders/${o.orderNumber}`} className="font-medium text-maroon hover:underline">{o.orderNumber}</Link></td>
                <td>{o.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                <td>{o.customerName}</td>
                <td>{o._count.items}</td>
                <td>{rupees(o.total)}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs ${o.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{o.paymentStatus}</span></td>
                <td>{o.status}</td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={7} className="p-6 text-center text-muted">No orders{status ? ` with status ${status}` : ""} yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
