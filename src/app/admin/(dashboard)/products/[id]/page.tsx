import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { saveProduct } from "../actions";
import { PRODUCT_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Product · Admin" };

export default async function AdminProductForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [product, categories] = await Promise.all([
    isNew ? null : db.product.findUnique({ where: { id }, include: { images: true, variants: true } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!isNew && !product) notFound();

  const field = "w-full rounded-xl border border-gold/40 bg-cream px-4 py-2.5 text-sm focus:border-gold focus:outline-none";
  const label = "mb-1 block text-sm font-medium";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-maroon">{isNew ? "New Product" : `Edit: ${product!.name}`}</h1>
        <Link href="/admin/products" className="text-sm text-muted underline hover:text-maroon">← Back to products</Link>
      </div>

      <form action={saveProduct} className="mt-6 grid gap-5 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        {product && <input type="hidden" name="id" value={product.id} />}
        <div className="md:col-span-2">
          <label htmlFor="name" className={label}>Name *</label>
          <input id="name" name="name" required defaultValue={product?.name} className={field} />
        </div>
        <div>
          <label htmlFor="slug" className={label}>Slug (lowercase-with-dashes; blank = auto)</label>
          <input id="slug" name="slug" defaultValue={product?.slug} className={field} />
        </div>
        <div>
          <label htmlFor="categoryId" className={label}>Category *</label>
          <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId} className={field}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="shortDescription" className={label}>Short description (card text)</label>
          <input id="shortDescription" name="shortDescription" defaultValue={product?.shortDescription ?? ""} className={field} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className={label}>Full description (blank line between paragraphs)</label>
          <textarea id="description" name="description" rows={6} defaultValue={product?.description ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="priceRupees" className={label}>Price (₹) *</label>
          <input id="priceRupees" name="priceRupees" type="number" step="1" min="1" required
            defaultValue={product ? product.price / 100 : ""} className={field} />
        </div>
        <div>
          <label htmlFor="compareAtRupees" className={label}>Compare-at price (₹, optional)</label>
          <input id="compareAtRupees" name="compareAtRupees" type="number" step="1" min="0"
            defaultValue={product?.compareAtPrice ? product.compareAtPrice / 100 : ""} className={field} />
        </div>
        <div>
          <label htmlFor="stockQuantity" className={label}>Stock quantity *</label>
          <input id="stockQuantity" name="stockQuantity" type="number" min="0" required defaultValue={product?.stockQuantity ?? 0} className={field} />
        </div>
        <div>
          <label htmlFor="sku" className={label}>SKU</label>
          <input id="sku" name="sku" defaultValue={product?.sku ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="status" className={label}>Status</label>
          <select id="status" name="status" defaultValue={product?.status ?? "ACTIVE"} className={field}>
            {PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="imageUrl" className={label}>Primary image URL{isNew ? " (upload to Cloudinary first, paste URL)" : ""}</label>
          <input id="imageUrl" name="imageUrl" placeholder="/products/… or https://res.cloudinary.com/…" defaultValue={product?.images[0]?.url ?? ""} className={field} />
        </div>
        <div className="flex items-center gap-6 md:col-span-2">
          {[
            ["featured", "Featured on homepage", product?.featured],
            ["bestseller", "Bestseller badge", product?.bestseller],
            ["newArrival", "New arrival badge", product?.newArrival],
          ].map(([name, text, checked]) => (
            <label key={name as string} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={name as string} defaultChecked={checked as boolean | undefined} className="h-4 w-4 accent-[#c9a227]" />
              {text as string}
            </label>
          ))}
        </div>
        <div className="md:col-span-2">
          <button className="rounded-full bg-maroon px-8 py-3 text-sm font-medium text-gold-light hover:bg-maroon-dark">
            {isNew ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </form>

      {product && product.variants.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-maroon">Variants</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {product.variants.map((v) => (
              <li key={v.id} className="flex justify-between border-b border-gold/10 pb-2">
                <span>{v.name} {v.size ? `(${v.size})` : ""} {v.sku ? `· ${v.sku}` : ""}</span>
                <span>{v.price ? `₹${v.price / 100}` : "inherits price"} · stock {v.stockQuantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Variant editing (add/remove/stock) is managed here — per-variant forms ship in the next iteration.</p>
        </div>
      )}
    </div>
  );
}
