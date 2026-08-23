import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { productCard } from "@/lib/queries";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";

export const dynamic = "force-dynamic"; // catalog-backed homepage

async function getHome() {
  const [categories, featured, bestsellers, newArrivals, festival] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { name: true, slug: true, image: true } }),
    db.product.findMany({ where: { status: "ACTIVE", featured: true }, select: productCard, take: 8 }),
    db.product.findMany({ where: { status: "ACTIVE", bestseller: true }, select: productCard, take: 4, orderBy: { createdAt: "desc" } }),
    db.product.findMany({ where: { status: "ACTIVE", newArrival: true }, select: productCard, take: 4, orderBy: { createdAt: "desc" } }),
    db.product.findMany({ where: { status: "ACTIVE", festival: "janmashtami" }, select: productCard, take: 3, orderBy: { createdAt: "desc" } }),
  ]);
  return { categories, featured, bestsellers, newArrivals, festival };
}

export default async function HomePage() {
  const { categories, featured, bestsellers, newArrivals, festival } = await getHome();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-deep via-maroon to-maroon-dark text-cream">
        <div className="pattern-dots absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid w-[92%] max-w-6xl items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="fade-up">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-light">॥ Handcrafted with devotion ॥</p>
            <h1 className="font-display text-4xl font-bold leading-tight text-cream md:text-6xl">
              Beautiful Dresses for Your <em className="text-gold-light">Beloved Deities</em>
            </h1>
            <p className="mt-5 max-w-md text-cream/85">
              Handpicked devotional dresses, shringar and accessories crafted to bring beauty and devotion to your seva.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/shop" className="rounded-full bg-gradient-to-br from-gold to-gold-light px-7 py-3 font-medium text-maroon-deep shadow-lg shadow-gold/30 transition-transform hover:-translate-y-0.5">
                Shop Now
              </Link>
              <Link href="#categories" className="rounded-full border border-gold px-7 py-3 text-gold-light transition-colors hover:bg-gold/10">
                Explore Collections
              </Link>
            </div>
          </div>
          <div className="fade-up flex flex-col items-center">
            <Image
              src="/brand/logo.jpg"
              alt="Kanha Closet — logo"
              width={480}
              height={480}
              priority
              className="w-64 rounded-full border-4 border-gold/70 shadow-2xl shadow-gold/25 sm:w-72 md:w-80"
            />
            <div className="mt-6 flex items-center gap-3">
              {featured.slice(0, 3).map((p) =>
                p.images[0] ? (
                  <Link key={p.id} href={`/product/${p.slug}`} className="relative h-20 w-16 overflow-hidden rounded-xl border border-gold/30 transition-transform hover:-translate-y-1 sm:h-24 sm:w-20">
                    <Image src={p.images[0].url} alt={p.name} fill sizes="80px" className="object-cover" />
                  </Link>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-b border-gold/15 bg-white">
        <div className="mx-auto grid w-[92%] max-w-6xl grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
          {[
            ["✧", "Hand Embroidery", "Zardozi & gotta-patti by master karigars"],
            ["✦", "Premium Fabrics", "Silk, velvet & brocade from Varanasi & Kanchi"],
            ["❁", "Made to Measure", "Custom fits for every vigraha size"],
            ["☸", "Seva-Ready Packing", "Each order packed with care and a prayer"],
          ].map(([icon, title, sub]) => (
            <div key={title}>
              <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-xl text-gold">{icon}</span>
              <h3 className="font-display text-lg font-semibold text-maroon">{title}</h3>
              <p className="mt-1 text-xs text-muted">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section id="categories" className="mx-auto w-[92%] max-w-6xl py-14">
        <SectionHeading kicker="Our Collections" title="Shop by Category" href="/shop" linkLabel="View all" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className="card-hover group relative aspect-square overflow-hidden rounded-2xl">
              {c.image && <Image src={c.image} alt={c.name} fill sizes="(max-width:640px) 50vw, 20vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/85 via-maroon-deep/20 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 font-display text-lg font-semibold text-cream">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <section className="mx-auto w-[92%] max-w-6xl py-6">
          <SectionHeading kicker="Handpicked" title="Featured Deity Dresses" href="/shop?sort=popular" linkLabel="View all" />
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Festival banner ── */}
      {festival.length > 0 && (
        <section className="mx-auto my-12 w-[92%] max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-[#144e5a] to-[#061c22] text-cream">
          <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold-light">Festival Collection</p>
              <h2 className="font-display text-3xl font-bold">Janmashtami Shringar is Here</h2>
              <p className="mt-3 text-cream/80">Midnight-abhishek attire, mor-pankh poshakh and special mukuts for Kanha&apos;s appearance day.</p>
              <Link href="/shop?festival=janmashtami" className="mt-6 inline-block rounded-full bg-gold px-6 py-2.5 font-medium text-maroon-deep hover:bg-gold-light">
                Shop Janmashtami
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {festival.map((p) =>
                p.images[0] ? (
                  <Link key={p.id} href={`/product/${p.slug}`} className="overflow-hidden rounded-xl border border-gold/25">
                    <Image src={p.images[0].url} alt={p.name} width={200} height={250} className="h-full w-full object-cover" />
                  </Link>
                ) : null,
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Bestsellers ── */}
      {bestsellers.length > 0 && (
        <section className="mx-auto w-[92%] max-w-6xl py-6">
          <SectionHeading kicker="Loved by Devotees" title="Best Sellers" href="/shop?sort=popular" linkLabel="View all" />
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {bestsellers.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── New arrivals ── */}
      {newArrivals.length > 0 && (
        <section className="mx-auto w-[92%] max-w-6xl py-6">
          <SectionHeading kicker="Just Arrived" title="New Arrivals" href="/shop?sort=newest" linkLabel="View all" />
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {newArrivals.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section className="mx-auto mb-4 mt-12 w-[92%] max-w-6xl rounded-3xl bg-maroon-deep py-12 text-center text-cream">
        <h2 className="font-display text-2xl font-semibold text-gold-light">Get first darshan of new collections</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream/75">Join our list for festival drops, restocks and seva tips. No spam — only shringar.</p>
        <form action="/api/newsletter" method="post" className="mx-auto mt-6 flex max-w-md gap-2 px-4">
          <label htmlFor="nl-email" className="sr-only">Email</label>
          <input id="nl-email" name="email" type="email" required placeholder="you@example.com"
            className="flex-1 rounded-full border border-cream/25 bg-maroon px-5 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none" />
          <button className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-maroon-deep hover:bg-gold-light">Subscribe</button>
        </form>
      </section>
    </div>
  );
}
