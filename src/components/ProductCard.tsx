import Image from "next/image";
import Link from "next/link";
import { rupees, discountPercent } from "@/lib/money";
import type { ProductCard as CardData } from "@/lib/queries";

export default function ProductCard({ p }: { p: CardData }) {
  const img = p.images[0]?.url;
  const off = discountPercent(p.price, p.compareAtPrice);
  const out = p.stockQuantity <= 0;

  return (
    <article className="card-hover group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <Link href={`/product/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-cream-dark" aria-label={p.name}>
        {img ? (
          <Image src={img} alt={p.images[0]?.altText ?? p.name} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🪷</div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off !== null && <span className="rounded-full bg-maroon px-2.5 py-1 text-[11px] font-semibold text-gold-light">{off}% OFF</span>}
          {p.bestseller && <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-maroon-deep">Bestseller</span>}
          {p.newArrival && !p.bestseller && <span className="rounded-full bg-emerald-800 px-2.5 py-1 text-[11px] font-semibold text-cream">New</span>}
        </div>
        {out && (
          <div className="absolute inset-0 flex items-center justify-center bg-maroon-deep/60">
            <span className="rounded-full bg-cream px-4 py-1.5 text-sm font-medium text-maroon">Out of Stock</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link href={`/product/${p.slug}`} className="font-display text-lg leading-snug text-maroon hover:text-maroon-dark">
          {p.name}
        </Link>
        <p className="line-clamp-2 flex-1 text-xs text-muted">{p.shortDescription}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-maroon">{rupees(p.price)}</span>
          {p.compareAtPrice && p.compareAtPrice > p.price && (
            <span className="text-sm text-muted line-through">{rupees(p.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
