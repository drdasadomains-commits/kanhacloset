export default function SectionHeading({ kicker, title, href, linkLabel }: { kicker?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="mb-1 text-xs font-medium uppercase tracking-[0.22em] text-gold">{kicker}</p>}
        <h2 className="font-display text-3xl font-semibold text-maroon">{title}</h2>
      </div>
      {href && linkLabel && (
        <a href={href} className="shrink-0 rounded-full border border-gold/60 px-4 py-1.5 text-sm text-maroon transition-colors hover:bg-gold/10">
          {linkLabel} →
        </a>
      )}
    </div>
  );
}
