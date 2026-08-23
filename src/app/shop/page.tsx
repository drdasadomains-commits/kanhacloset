import Link from "next/link";
import type { Metadata } from "next";
import { listProducts, activeCategories, type SortKey } from "@/lib/queries";
import ProductCard from "@/components/ProductCard";
import FilterSidebar from "@/components/FilterSidebar";
import SortSelect from "@/components/SortSelect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Deity Dresses, Shringar & Seva Essentials",
  description: "Browse handcrafted deity dresses, poshakh, mukuts, jewellery and festival collections for Thakurji, Radha Rani and Laddu Gopal.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const category = one(sp.category);
  const sort = (one(sp.sort) ?? "popular") as SortKey;
  const page = Math.max(1, parseInt(one(sp.page) ?? "1", 10) || 1);

  const [{ items, total, pages }, categories] = await Promise.all([
    listProducts({
      q,
      categorySlug: category,
      sort,
      festival: one(sp.festival),
      availability: one(sp.availability) === "in" ? "in" : undefined,
      minPaise: one(sp.min) ? parseInt(one(sp.min)!, 10) : undefined,
      maxPaise: one(sp.max) ? parseInt(one(sp.max)!, 10) : undefined,
      page,
    }),
    activeCategories(),
  ]);

  const catName = categories.find((c) => c.slug === category)?.name;
  const heading = q ? `Search: “${q}”` : catName ?? "All Products";
  const qs = (pageNo: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) { const val = one(v); if (val && k !== "page") next.set(k, val); }
    if (pageNo > 1) next.set("page", String(pageNo));
    const s = next.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return (
    <div className="mx-auto w-[92%] max-w-6xl py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-maroon">Home</Link> / <span className="text-ink">{heading}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-semibold text-maroon">{heading}</h1>
          <p className="mt-1 text-sm text-muted">{total} item{total === 1 ? "" : "s"}</p>
        </div>
        <SortSelect value={sort} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <FilterSidebar categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
        <div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gold/50 py-20 text-center">
              <p className="font-display text-2xl text-maroon">No items match your filters</p>
              <p className="mt-2 text-sm text-muted">Try clearing filters or a different search.</p>
              <Link href="/shop" className="mt-5 inline-block rounded-full bg-maroon px-6 py-2 text-sm text-gold-light hover:bg-maroon-dark">Browse all products</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex justify-center gap-2">
              {page > 1 && <Link href={qs(page - 1)} className="rounded-full border border-gold/50 px-4 py-1.5 text-sm hover:bg-gold/10">← Prev</Link>}
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={qs(n)} aria-current={n === page ? "page" : undefined}
                  className={`rounded-full px-4 py-1.5 text-sm ${n === page ? "bg-maroon text-gold-light" : "border border-gold/50 hover:bg-gold/10"}`}>
                  {n}
                </Link>
              ))}
              {page < pages && <Link href={qs(page + 1)} className="rounded-full border border-gold/50 px-4 py-1.5 text-sm hover:bg-gold/10">Next →</Link>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
