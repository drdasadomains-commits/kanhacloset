"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { PRODUCT_STATUSES } from "@/lib/constants";

async function requireAdmin() {
  const s = await getAdminSession();
  if (!s || (s.role !== "ADMIN" && s.role !== "SUPERADMIN")) throw new Error("Unauthorized");
  return s;
}

const ProductInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3).max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(200).optional().or(z.literal("")),
  shortDescription: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  categoryId: z.string().min(1),
  priceRupees: z.coerce.number().min(1).max(1000000),
  compareAtRupees: z.coerce.number().min(0).max(1000000).optional(),
  stockQuantity: z.coerce.number().int().min(0).max(100000),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  status: z.enum(PRODUCT_STATUSES).default("ACTIVE"),
  featured: z.coerce.boolean().default(false),
  bestseller: z.coerce.boolean().default(false),
  newArrival: z.coerce.boolean().default(false),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

function formDataToProduct(form: FormData) {
  return ProductInput.parse({
    id: (form.get("id") as string) || undefined,
    name: form.get("name"),
    slug: form.get("slug") || "",
    shortDescription: form.get("shortDescription") || "",
    description: form.get("description") || "",
    categoryId: form.get("categoryId"),
    priceRupees: form.get("priceRupees"),
    compareAtRupees: (form.get("compareAtRupees") as string) || undefined,
    stockQuantity: form.get("stockQuantity") ?? 0,
    sku: form.get("sku") || "",
    status: form.get("status") || "ACTIVE",
    featured: form.get("featured") === "on",
    bestseller: form.get("bestseller") === "on",
    newArrival: form.get("newArrival") === "on",
    imageUrl: form.get("imageUrl") || "",
  });
}

export async function saveProduct(form: FormData) {
  await requireAdmin();
  const input = formDataToProduct(form);
  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const data = {
    name: input.name,
    slug,
    shortDescription: input.shortDescription || null,
    description: input.description || null,
    categoryId: input.categoryId,
    price: Math.round(input.priceRupees * 100),
    compareAtPrice: input.compareAtRupees ? Math.round(input.compareAtRupees * 100) : null,
    stockQuantity: input.stockQuantity,
    sku: input.sku || null,
    status: input.status,
    featured: input.featured,
    bestseller: input.bestseller,
    newArrival: input.newArrival,
  };

  let id = input.id;
  if (id) {
    await db.product.update({ where: { id }, data });
  } else {
    const created = await db.product.create({
      data: {
        ...data,
        images: input.imageUrl
          ? { create: { url: input.imageUrl, altText: input.name, isPrimary: true } }
          : undefined,
      },
    });
    id = created.id;
  }
  revalidatePath("/admin/products");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");
  redirect(`/admin/products?saved=${slug}`);
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = z.string().parse(form.get("id"));
  await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePath("/admin/products");
}

export async function duplicateProduct(form: FormData) {
  await requireAdmin();
  const id = z.string().parse(form.get("id"));
  const p = await db.product.findUnique({ where: { id }, include: { images: true, variants: true } });
  if (!p) return;
  const copy = await db.product.create({
    data: {
      name: `${p.name} (Copy)`,
      slug: `${p.slug}-copy-${Date.now().toString(36)}`,
      shortDescription: p.shortDescription,
      description: p.description,
      categoryId: p.categoryId,
      brand: p.brand,
      sku: p.sku ? `${p.sku}-C` : null,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stockQuantity: p.stockQuantity,
      status: "DRAFT",
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      images: { create: p.images.map((i) => ({ url: i.url, altText: i.altText, sortOrder: i.sortOrder, isPrimary: i.isPrimary })) },
      variants: { create: p.variants.map((v) => ({ name: v.name, size: v.size, color: v.color, price: v.price, stockQuantity: v.stockQuantity, sku: v.sku })) },
    },
  });
  revalidatePath("/admin/products");
  redirect(`/admin/products/${copy.id}`);
}
