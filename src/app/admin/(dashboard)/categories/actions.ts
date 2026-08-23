"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

async function requireAdmin() {
  const s = await getAdminSession();
  if (!s || (s.role !== "ADMIN" && s.role !== "SUPERADMIN")) throw new Error("Unauthorized");
}

const CategoryInput = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function createCategory(form: FormData) {
  await requireAdmin();
  const input = CategoryInput.parse({
    name: form.get("name"), slug: form.get("slug"), description: form.get("description") || "",
    image: form.get("image") || "", sortOrder: form.get("sortOrder") ?? 0,
  });
  await db.category.create({ data: { ...input, description: input.description || null, image: input.image || null } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateCategory(form: FormData) {
  await requireAdmin();
  const id = z.string().parse(form.get("id"));
  const input = CategoryInput.parse({
    name: form.get("name"), slug: form.get("slug"), description: form.get("description") || "",
    image: form.get("image") || "", sortOrder: form.get("sortOrder") ?? 0,
  });
  await db.category.update({ where: { id }, data: { ...input, description: input.description || null, image: input.image || null } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function toggleCategory(form: FormData) {
  await requireAdmin();
  const id = z.string().parse(form.get("id"));
  const cat = await db.category.findUnique({ where: { id }, select: { isActive: true } });
  if (!cat) return;
  await db.category.update({ where: { id }, data: { isActive: !cat.isActive } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
