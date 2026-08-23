import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";

// LOCAL DEV ONLY — lets the full order flow be exercised without Razorpay keys.
// Refuses to run in production builds (spec §38.20).
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const parsed = z.object({ orderId: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const order = await db.order.findUnique({ where: { id: parsed.data.orderId }, select: { id: true, orderNumber: true, paymentStatus: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const simPaymentId = `sim_${Date.now().toString(36)}`;
  await db.payment.updateMany({ where: { orderId: order.id, status: { in: ["CREATED", "AUTHORIZED"] } }, data: { razorpayPaymentId: simPaymentId, method: "simulated" } });
  const result = await markOrderPaid({ orderId: order.id, razorpayPaymentId: simPaymentId, method: "simulated" });
  if (!result.ok) return NextResponse.json({ error: "Could not complete simulated payment" }, { status: 500 });
  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}
