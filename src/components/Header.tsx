"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?festival=janmashtami", label: "Janmashtami" },
  { href: "/shop?sort=newest", label: "New Arrivals" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { count, hydrated } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  function search(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-maroon-deep/95 backdrop-blur text-cream">
      {/* announcement */}
      <div className="bg-gold/15 py-1.5 text-center text-xs tracking-wide text-gold-light">
        ॥ Free shipping across India on orders above ₹499 ॥
      </div>
      <div className="mx-auto flex w-[92%] max-w-6xl items-center gap-6 py-3">
        <Link href="/" className="flex items-baseline gap-1 font-display text-2xl font-bold text-gold-light">
          <span className="text-gold">॥</span> Kanha <em className="font-normal not-italic text-cream">Closet</em>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm text-cream/85 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-gold-light">
              {n.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={search} className="ml-auto hidden lg:ml-6 lg:block" role="search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dresses, mukut…"
            aria-label="Search products"
            className="w-48 rounded-full border border-cream/25 bg-maroon px-4 py-1.5 text-sm text-cream placeholder:text-cream/40 focus:w-64 focus:border-gold focus:outline-none transition-all"
          />
        </form>

        <Link href="/cart" aria-label={`Cart, ${hydrated ? count : 0} items`} className="relative ml-2 rounded-full p-2 hover:bg-white/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" />
            <path d="M9 10V6a3 3 0 0 1 6 0v4" />
          </svg>
          {hydrated && count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold text-maroon-deep">
              {count}
            </span>
          )}
        </Link>

        <button
          className="ml-1 rounded p-2 text-gold-light lg:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* mobile drawer */}
      {open && (
        <nav className="border-t border-gold/20 px-[4%] pb-4 pt-2 lg:hidden">
          <form onSubmit={search} className="mb-3" role="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dresses, mukut…"
              aria-label="Search products"
              className="w-full rounded-full border border-cream/25 bg-maroon px-4 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
            />
          </form>
          {[...NAV, { href: "/cart", label: "Cart" }, { href: "/track", label: "Track Order" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-2.5 text-cream/90 hover:text-gold-light">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
