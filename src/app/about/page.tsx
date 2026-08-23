import Link from "next/link";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-deep via-maroon to-maroon-dark py-16 text-center text-cream">
        <div className="pattern-dots absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-[92%] max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-light">॥ Seva through silks &amp; stitches ॥</p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Dressing the Lordships with Love</h1>
        </div>
      </section>
      <div className="mx-auto w-[92%] max-w-3xl space-y-6 py-12 leading-relaxed text-ink">
        <p>
          Kanha Closet began in a small Vrindavan workshop, dressing Thakurji for daily darshan. Two decades later,
          our karigars still hand-embroider every poshakh — only now they dress deities in devotee homes and temples across India.
        </p>
        <p>
          We source pure silk, velvet and brocade from Varanasi and Kanchipuram, set each kundan by hand, and inspect every
          piece personally before it is wrapped in muslin and packed for your seva. From everyday cotton dhotis to
          jewel-encrusted Janmashtami shringar, everything we make begins with a prayer.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[["20+", "Years of seva"], ["1,000+", "Deities dressed"], ["100%", "Handcrafted"]].map(([n, l]) => (
            <div key={l} className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="font-display text-3xl font-bold text-maroon">{n}</p>
              <p className="mt-1 text-sm text-muted">{l}</p>
            </div>
          ))}
        </div>
        <p className="text-center">
          <Link href="/shop" className="inline-block rounded-full bg-maroon px-8 py-3 text-gold-light hover:bg-maroon-dark">Explore the Collection</Link>
        </p>
      </div>
    </div>
  );
}
