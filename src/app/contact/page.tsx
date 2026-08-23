export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto w-[92%] max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold text-maroon">Contact Us</h1>
      <p className="mt-2 text-muted">Custom sizing, bulk temple orders, or a question about your order — we reply within one business day.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <a href="https://wa.me/919999999999" target="_blank" rel="noopener" className="card-hover rounded-2xl bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-2xl">💬</span>
          <h2 className="mt-3 font-display text-xl text-maroon">WhatsApp</h2>
          <p className="mt-1 text-sm text-muted">+91 99999 99999</p>
          <p className="mt-2 text-sm font-medium text-maroon underline">Chat now →</p>
        </a>
        <a href="mailto:seva@kanhacloset.in" className="card-hover rounded-2xl bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-2xl">✉</span>
          <h2 className="mt-3 font-display text-xl text-maroon">Email</h2>
          <p className="mt-1 text-sm text-muted">seva@kanhacloset.in</p>
          <p className="mt-2 text-sm font-medium text-maroon underline">Write to us →</p>
        </a>
        <a href="https://maps.google.com/?q=Vrindavan" target="_blank" rel="noopener" className="card-hover rounded-2xl bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-2xl">⌂</span>
          <h2 className="mt-3 font-display text-xl text-maroon">Visit</h2>
          <p className="mt-1 text-sm text-muted">Vraja Marg, Vrindavan, UP — by appointment</p>
          <p className="mt-2 text-sm font-medium text-maroon underline">Directions →</p>
        </a>
      </div>
    </div>
  );
}
