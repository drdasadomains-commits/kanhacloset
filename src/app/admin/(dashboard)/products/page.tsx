import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { rupees } from "@/lib/money";
import { deleteProduct, duplicateProduct } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products · Admin" };

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } }, images: { where: { isPrimary: true }, take: 1 } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-maroon">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-maroon px-5 py-2 text-sm text-gold-light hover:bg-maroon-dark">+ New Product</Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left text-xs uppercase text-muted"><th className="p-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gold/10">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {p.images[0] && <Image src={p.images[0].url} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />}
                    <div>
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-maroon hover:underline">{p.name}</Link>
                      <p className="text-xs text-muted">{p.slug} · {p.status}</p>
                    </div>
                  </div>
                </td>
                <td>{p.category.name}</td>
                <td>{rupees(p.price)}</td>
                <td className={p.stockQuantity <= 5 ? "font-semibold text-red-800" : ""}>{p.stockQuantity}</td>
                <td className="text-xs">{[p.featured && "Featured", p.bestseller && "Bestseller", p.newArrival && "New"].filter(Boolean).join(", ") || "—"}</td>
                <td>
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <form action={duplicateProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-muted underline hover:text-maroon">Duplicate</button>
                    </form>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-red-800 underline hover:text-red-900">Archive</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
