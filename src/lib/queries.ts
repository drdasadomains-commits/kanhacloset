import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const productCard = {
  id: true, name: true, slug: true, shortDescription: true, price: true,
  compareAtPrice: true, stockQuantity: true, bestseller: true, newArrival: true,
  featured: true, festival: true,
  images: { where: { isPrimary: true }, take: 1 },
  variants: { select: { id: true, name: true, size: true, price: true, stockQuantity: true } },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCard }>;

// Array-form orderBy: multi-key objects are rejected by this Prisma version.
export const SORTS = {
  popular: [{ bestseller: "desc" as const }, { createdAt: "desc" as const }],
  newest: [{ createdAt: "desc" as const }],
  "price-asc": [{ price: "asc" as const }],
  "price-desc": [{ price: "desc" as const }],
} as const;
export type SortKey = keyof typeof SORTS;

export async function listProducts(opts: {
  categorySlug?: string; q?: string; sort?: SortKey; festival?: string;
  availability?: "in" | "out"; minPaise?: number; maxPaise?: number;
  take?: number; page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const take = opts.take ?? 12;
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (opts.categorySlug) where.category = { slug: opts.categorySlug };
  if (opts.festival) where.festival = opts.festival;
  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q, mode: "insensitive" } },
      { shortDescription: { contains: opts.q, mode: "insensitive" } },
      { sku: { contains: opts.q, mode: "insensitive" } },
      { category: { name: { contains: opts.q, mode: "insensitive" } } },
    ];
  }
  if (opts.minPaise !== undefined || opts.maxPaise !== undefined) {
    where.price = {};
    if (opts.minPaise !== undefined) where.price.gte = opts.minPaise;
    if (opts.maxPaise !== undefined) where.price.lte = opts.maxPaise;
  }
  if (opts.availability === "in") where.stockQuantity = { gt: 0 };
  if (opts.availability === "out") where.stockQuantity = { lte: 0 };

  const [items, total] = await db.$transaction([
    db.product.findMany({
      where, select: productCard,
      orderBy: [...SORTS[opts.sort ?? "popular"]],
      skip: (page - 1) * take, take,
    }),
    db.product.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / take)) };
}

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      category: { select: { name: true, slug: true } },
      reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function relatedProducts(categoryId: string, excludeId: string, take = 4) {
  return db.product.findMany({
    where: { categoryId, status: "ACTIVE", id: { not: excludeId } },
    select: productCard,
    orderBy: { bestseller: "desc" },
    take,
  });
}

export async function activeCategories() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, image: true, description: true },
  });
}
