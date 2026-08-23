import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getProductBySlug, relatedProducts } from "@/lib/queries";
import { discountPercent, rupees } from "@/lib/money";
import ProductGallery from "@/components/ProductGallery";
import ProductBuyBox from "@/components/ProductBuyBox";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, select: { name: true, seoTitle: true, seoDescription: true, shortDescription: true, images: { where: { isPrimary: true }, take: 1 } } });
  if (!product) return { title: "Product not found" };
  const title = product.seoTitle ?? product.name;
  const description = product.seoDescription ?? product.shortDescription ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: { title, description, images: product.images[0]?.url },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await relatedProducts(product.categoryId, product.id);
  const off = discountPercent(product.price, product.compareAtPrice);
  const avgRating = product.reviews.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  // Product structured data (spec §23)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? undefined,
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: product.brand ?? "Kanha Closet" },
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviews.length
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating, reviewCount: product.reviews.length } }
      : {}),
  };

  return (
    <div className="mx-auto w-[92%] max-w-6xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-maroon">Home</Link> /{" "}
        <Link href="/shop" className="hover:text-maroon">Shop</Link> /{" "}
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-maroon">{product.category.name}</Link> /{" "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.bestseller && <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-semibold text-maroon-deep">Bestseller</span>}
            {product.newArrival && <span className="rounded-full bg-emerald-800 px-3 py-1 text-[11px] font-semibold text-cream">New Arrival</span>}
            {avgRating && <span className="text-sm text-muted">★ {avgRating} ({product.reviews.length} review{product.reviews.length === 1 ? "" : "s"})</span>}
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold text-maroon">{product.name}</h1>
          {product.sku && <p className="mt-1 text-xs uppercase tracking-wider text-muted">SKU: {product.sku}</p>}

          {product.compareAtPrice && off !== null && (
            <p className="mt-3 text-sm">
              <span className="mr-2 rounded-full bg-maroon px-2.5 py-1 font-semibold text-gold-light">{off}% OFF</span>
              <span className="text-muted line-through">{rupees(product.compareAtPrice)}</span>
            </p>
          )}

          <div className="mt-5">
            <ProductBuyBox
              productId={product.id}
              name={product.name}
              price={product.price}
              stock={product.stockQuantity}
              variants={product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, stockQuantity: v.stockQuantity }))}
            />
          </div>

          <div className="mt-8 space-y-3 border-t border-gold/20 pt-6 text-sm text-ink">
            <details open>
              <summary className="cursor-pointer font-display text-lg text-maroon">Description</summary>
              {product.description?.split("\n\n").map((para, i) => <p key={i} className="mt-2 text-muted">{para}</p>)}
            </details>
            <details>
              <summary className="cursor-pointer font-display text-lg text-maroon">Specifications</summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-muted">
                <dt className="font-medium text-ink">Category</dt><dd>{product.category.name}</dd>
                {product.brand && <><dt className="font-medium text-ink">Brand</dt><dd>{product.brand}</dd></>}
                <dt className="font-medium text-ink">Variants</dt>
                <dd>{product.variants.length ? product.variants.map((v) => v.name).join(", ") : "One size"}</dd>
              </dl>
            </details>
            <details>
              <summary className="cursor-pointer font-display text-lg text-maroon">Shipping &amp; Returns</summary>
              <p className="mt-2 text-muted">
                Free standard shipping on orders above ₹499 (3–7 business days). Express 1–3 days available at checkout.
                7-day easy return for unused items in original packaging — see <Link href="/returns-policy" className="underline hover:text-maroon">Returns &amp; Refunds</Link>.
              </p>
            </details>
          </div>
        </div>
      </div>

      {/* Reviews — only genuine, approved reviews display (spec §38.19) */}
      {product.reviews.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-semibold text-maroon">Customer Reviews</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {product.reviews.map((r) => (
              <article key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-gold">{"★".repeat(r.rating)}<span className="text-gold/30">{"★".repeat(5 - r.rating)}</span></p>
                {r.title && <h3 className="mt-1 font-display text-lg text-maroon">{r.title}</h3>}
                <p className="mt-1 text-sm text-muted">{r.body}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-muted/70">— {r.authorName}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-semibold text-maroon">You may also like</h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
