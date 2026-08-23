"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

const OPTIONS = [
  ["popular", "Popular"],
  ["newest", "Newest"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
];

export default function SortSelect({ value }: { value: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Sort
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", e.target.value);
          next.delete("page");
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="rounded-lg border border-gold/40 bg-white px-3 py-1.5 text-ink focus:border-gold focus:outline-none"
      >
        {OPTIONS.map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </label>
  );
}
