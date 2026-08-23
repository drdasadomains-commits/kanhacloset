import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-[92%] max-w-2xl flex-col items-center py-24 text-center">
      <p className="text-6xl">🪷</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-maroon">This page took moksha</h1>
      <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="rounded-full bg-maroon px-6 py-2.5 text-sm text-gold-light hover:bg-maroon-dark">Go Home</Link>
        <Link href="/shop" className="rounded-full border border-gold/60 px-6 py-2.5 text-sm text-maroon hover:bg-gold/10">Browse Shop</Link>
      </div>
    </div>
  );
}
