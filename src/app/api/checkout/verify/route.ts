import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPaymentSignature, markOrderPaid, markOrderFailed } from "@/lib/orders";

const Body = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  method: z.string().max(30).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, method } = parsed.data;

    // The payment record must exist and belong to this Razorpay order.
    const payment = await db.payment.findFirst({
      where: { orderId, razorpayOrderId },
      select: { id: true, orderId: true },
    });
    if (!payment) return NextResponse.json({ error: "Order not found for this payment." }, { status: 404 });

    if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      await markOrderFailed(orderId, "Signature verification failed");
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    const result = await markOrderPaid({ orderId, razorpayPaymentId, razorpayOrderId, method });
    return NextResponse.json({ ok: true, already: result.already ?? false });
  } catch (e) {
    console.error("verify error", e);
    return NextResponse.json({ error: "Verification failed. If you were charged, contact support — your payment is safe." }, { status: 500 });
  }
}

// Payment failure/dismissal from the Razorpay checkout modal
export async function PUT(req: Request) {
  const parsed = z.object({ orderId: z.string(), reason: z.string().max(300).optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  await markOrderFailed(parsed.data.orderId, parsed.data.reason ?? "Payment dismissed by user");
  return NextResponse.json({ ok: true });
}
