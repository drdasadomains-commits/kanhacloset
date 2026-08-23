"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

// Filter navigation built as links so every filter state is a shareable,
// crawlable URL (spec §23 clean URLs).

type Props = { categories: { name: string; slug: string }[] };

const PRICE_BANDS: [string, string, string][] = [
  ["Under ₹500", "0", "49999"],
  ["₹500 – ₹1,000", "50000", "100000"],
  ["₹1,000 – ₹2,500", "100000", "250000"],
  ["₹2,500 – ₹5,000", "250000", "500000"],
  ["Above ₹5,000", "500000", ""],
];

const FESTIVALS = ["janmashtami", "radhashtami", "diwali"];

export default function FilterSidebar({ categories }: Props) {
  const params = useSearchParams();
  const pathname = usePathname();

  function href(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page");
    return `${pathname}?${next.toString()}`;
  }
  const active = (key: string, value: string) => params.get(key) === value;

  return (
    <aside className="space-y-7 text-sm">
      <section>
        <h3 className="mb-3 font-display text-lg font-semibold text-maroon">Category</h3>
        <ul className="space-y-2">
          <li>
            <Link href={href((p) => p.delete("category"))} className={!params.get("category") ? "font-medium text-gold" : "text-muted hover:text-maroon"}>
              All Products
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={href((p) => p.set("category", c.slug))} className={active("category", c.slug) ? "font-medium text-gold" : "text-muted hover:text-maroon"}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold text-maroon">Price</h3>
        <ul className="space-y-2">
          {PRICE_BANDS.map(([label, min, max]) => {
            const key = `${min}-${max}`;
            return (
              <li key={key}>
                <Link href={href((p) => { p.set("min", min); max ? p.set("max", max) : p.delete("max"); })} className={active("min", min) ? "font-medium text-gold" : "text-muted hover:text-maroon"}>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold text-maroon">Festival</h3>
        <ul className="space-y-2">
          {FESTIVALS.map((f) => (
            <li key={f}>
              <Link href={href((p) => (active("festival", f) ? p.delete("festival") : p.set("festival", f)))} className={active("festival", f) ? "font-medium text-gold" : "text-muted capitalize hover:text-maroon"}>
                {f}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold text-maroon">Availability</h3>
        <ul className="space-y-2">
          <li><Link href={href((p) => (active("availability", "in") ? p.delete("availability") : p.set("availability", "in")))} className={active("availability", "in") ? "font-medium text-gold" : "text-muted hover:text-maroon"}>In stock</Link></li>
              <li><Link href={href((p) => { p.delete("min"); p.delete("max"); p.delete("category"); p.delete("festival"); p.delete("availability"); p.delete("q"); p.delete("sort"); })} className="text-muted hover:text-maroon">Clear all filters</Link></li>
        </ul>
      </section>
    </aside>
  );
}
