"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { restoreStock } from "@/lib/orders";

async function requireAdmin() {
  const s = await getAdminSession();
  if (!s || (s.role !== "ADMIN" && s.role !== "SUPERADMIN")) throw new Error("Unauthorized");
}

const UpdateInput = z.object({
  orderNumber: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
  trackingNumber: z.string().trim().max(80).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function updateOrder(form: FormData) {
  await requireAdmin();
  const input = UpdateInput.parse({
    orderNumber: form.get("orderNumber"),
    status: form.get("status"),
    trackingNumber: form.get("trackingNumber") || "",
    note: form.get("note") || "",
  });

  const order = await db.order.findUnique({ where: { orderNumber: input.orderNumber }, select: { id: true, status: true } });
  if (!order) throw new Error("Order not found");

  const returning = (["CANCELLED", "RETURNED", "REFUNDED"] as OrderStatus[]).includes(input.status)
    && !(["CANCELLED", "RETURNED", "REFUNDED"] as OrderStatus[]).includes(order.status as OrderStatus);

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        trackingNumber: input.trackingNumber || undefined,
        ...(input.status === "REFUNDED" ? { paymentStatus: "REFUNDED" as const } : {}),
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, fromStatus: order.status, toStatus: input.status, note: input.note || null },
    });
  });

  if (returning) await restoreStock(order.id);

  revalidatePath(`/admin/orders/${input.orderNumber}`);
  revalidatePath("/admin/orders");
}
