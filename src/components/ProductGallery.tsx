"use client";

import Image from "next/image";
import { useState } from "react";

type Img = { url: string; altText: string | null };

export default function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  if (!images.length) {
    return <div className="flex aspect-square items-center justify-center rounded-2xl bg-cream-dark text-6xl">🪷</div>;
  }
  const current = images[active];

  return (
    <div>
      <div
        className={`relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-gold/25 bg-white ${zoom ? "cursor-zoom-out" : ""}`}
        onClick={() => setZoom(!zoom)}
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.altText ?? name}
          fill
          priority
          sizes="(max-width: 768px) 92vw, 45vw"
          className={`object-contain transition-transform duration-300 ${zoom ? "scale-150" : "scale-100"}`}
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-maroon-deep/70 px-3 py-1 text-xs text-cream">{zoom ? "Click to zoom out" : "Click to zoom"}</span>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 ${i === active ? "border-gold" : "border-transparent"}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
