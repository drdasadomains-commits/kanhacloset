import Link from "next/link";
import { db } from "@/lib/db";
import { rupees } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

  const [totalSales, todaySales, orderCount, pendingOrders, productCount, lowStock, customerCount, recentOrders] = await Promise.all([
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    db.order.aggregate({ where: { paymentStatus: "PAID", createdAt: { gte: startOfDay } }, _sum: { total: true } }),
    db.order.count(),
    db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"] } } }),
    db.product.count(),
    db.product.findMany({ where: { status: "ACTIVE", stockQuantity: { lte: 5 } }, select: { name: true, stockQuantity: true, slug: true }, take: 8, orderBy: { stockQuantity: "asc" } }),
    db.customer.count(),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { orderNumber: true, customerName: true, total: true, status: true, paymentStatus: true, createdAt: true } }),
  ]);

  const stats = [
    ["Total Sales (paid)", rupees(totalSales._sum.total ?? 0)],
    ["Today's Sales", rupees(todaySales._sum.total ?? 0)],
    ["Orders", String(orderCount)],
    ["Pending Fulfilment", String(pendingOrders)],
    ["Products", String(productCount)],
    ["Customers", String(customerCount)],
  ] as const;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-maroon">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-maroon">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-maroon">Recent Orders</h2>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted"><th className="py-2">Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.orderNumber} className="border-t border-gold/10">
                  <td className="py-2"><Link href={`/admin/orders/${o.orderNumber}`} className="text-maroon underline">{o.orderNumber}</Link></td>
                  <td>{o.customerName}</td>
                  <td>{rupees(o.total)}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs ${o.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{o.paymentStatus}</span></td>
                </tr>
              ))}
              {!recentOrders.length && <tr><td colSpan={4} className="py-4 text-center text-muted">No orders yet.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-maroon">Low Stock (≤ 5)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lowStock.map((p) => (
              <li key={p.slug} className="flex justify-between border-b border-gold/10 pb-2">
                <Link href={`/product/${p.slug}`} className="text-maroon hover:underline">{p.name}</Link>
                <span className="font-semibold text-red-800">{p.stockQuantity} left</span>
              </li>
            ))}
            {!lowStock.length && <li className="text-muted">All healthy. 🎉</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
