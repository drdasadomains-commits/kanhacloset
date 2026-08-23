export default function LegalPage({ title, updated = "23 August 2026", children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[92%] max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold text-maroon">{title}</h1>
      <p className="mt-1 text-sm text-muted">Last updated: {updated}</p>
      <div className="prose-lg mt-8 space-y-6 leading-relaxed text-ink [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-maroon [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </div>
  );
}
