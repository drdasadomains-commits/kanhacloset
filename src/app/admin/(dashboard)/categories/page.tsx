import { db } from "@/lib/db";
import { createCategory, updateCategory, toggleCategory } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  const field = "w-full rounded-xl border border-gold/40 bg-cream px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-maroon">Categories</h1>

      <form action={createCategory} className="mt-6 grid gap-3 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-5">
        <div className="md:col-span-5"><h2 className="font-display text-lg text-maroon">Add Category</h2></div>
        <input name="name" placeholder="Name *" required className={field} />
        <input name="slug" placeholder="slug-with-dashes *" required pattern="[a-z0-9-]+" className={field} />
        <input name="description" placeholder="Description" className="md:col-span-2 w-full rounded-xl border border-gold/40 bg-cream px-3 py-2 text-sm focus:border-gold focus:outline-none" />
        <input name="sortOrder" type="number" min="0" placeholder="Order" defaultValue={categories.length} className={field} />
        <button className="rounded-full bg-maroon px-6 py-2 text-sm text-gold-light hover:bg-maroon-dark md:col-span-5 md:justify-self-start">Create</button>
      </form>

      <div className="mt-6 space-y-3">
        {categories.map((c) => (
          <form key={c.id} action={updateCategory} className="grid items-center gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1.5fr_80px_auto_auto]">
            <input type="hidden" name="id" value={c.id} />
            <input name="name" defaultValue={c.name} className={field} aria-label="Name" />
            <input name="slug" defaultValue={c.slug} className={field} pattern="[a-z0-9-]+" aria-label="Slug" />
            <input name="description" defaultValue={c.description ?? ""} className={field} aria-label="Description" />
            <input name="sortOrder" type="number" defaultValue={c.sortOrder} className={field} aria-label="Sort order" />
            <span className="text-center text-xs text-muted">{c._count.products} products<br />
              <span className={c.isActive ? "text-emerald-800" : "text-red-800"}>{c.isActive ? "active" : "hidden"}</span>
            </span>
            <div className="flex gap-2">
              <button className="rounded-full bg-maroon px-4 py-1.5 text-xs text-gold-light">Save</button>
            </div>
            <div className="md:col-span-6">
              <button formAction={toggleCategory} className="text-xs text-muted underline hover:text-maroon">
                {c.isActive ? "Hide from store" : "Show in store"}
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
