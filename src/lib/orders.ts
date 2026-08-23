import crypto from "node:crypto";
import { db } from "@/lib/db";

export function newOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KC${ymd}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_SECRET && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
}

export function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Mark an order paid exactly once, decrement stock atomically (preventing
 * overselling), bump coupon usage and write status history. Safe to call from
 * both the verify endpoint and the webhook — the first caller wins on the
 * paymentStatus transition, everyone else no-ops (spec §16, §17, §38.11).
 */
export async function markOrderPaid(opts: {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  method?: string;
}): Promise<{ ok: boolean; already?: boolean }> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: opts.orderId },
      include: { items: true },
    });
    if (!order) return { ok: false };
    if (order.paymentStatus === "PAID") return { ok: true, already: true };

    // Atomic stock decrement — fails if two buyers race for the last item.
    for (const item of order.items) {
      const productUpdated = await tx.product.updateMany({
        where: { id: item.productId, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (productUpdated.count === 0) throw new Error(`Insufficient stock for ${item.productName}`);
      if (item.variantId) {
        const variantUpdated = await tx.variant.updateMany({
          where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (variantUpdated.count === 0) throw new Error(`Insufficient stock for ${item.productName} (${item.variantName})`);
      }
    }

    await tx.payment.updateMany({
      where: { orderId: order.id, status: { in: ["CREATED", "AUTHORIZED"] } },
      data: { status: "CAPTURED", razorpayPaymentId: opts.razorpayPaymentId, method: opts.method },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, fromStatus: order.status, toStatus: "CONFIRMED", note: "Payment captured" },
    });

    if (order.couponCode) {
      await tx.coupon.updateMany({ where: { code: order.couponCode }, data: { usedCount: { increment: 1 } } });
    }
    return { ok: true };
  });
}

export async function markOrderFailed(orderId: string, reason?: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true, status: true } });
    if (!order || order.paymentStatus === "PAID") return;
    await tx.payment.updateMany({ where: { orderId, status: { in: ["CREATED", "AUTHORIZED"] } }, data: { status: "FAILED", failureReason: reason } });
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" } });
  });
}

/** Restore stock when an order is cancelled or refunded (spec §17). */
export async function restoreStock(orderId: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return;
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      if (item.variantId) {
        await tx.variant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
      }
    }
  });
}
