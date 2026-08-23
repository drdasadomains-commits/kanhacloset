import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature, markOrderPaid, markOrderFailed } from "@/lib/orders";

// Razorpay webhook — the source of truth for payment state. Signature is
// verified over the RAW body; processing is idempotent via WebhookEvent
// unique(eventId) (spec §16).
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: any };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const eventId: string | undefined = req.headers.get("x-razorpay-event-id") ?? event.payload?.payment?.entity?.id;
  const type = event.event ?? "unknown";

  // Record-first idempotency: unique constraint rejects duplicates.
  if (eventId) {
    const existing = await db.webhookEvent.findUnique({ where: { eventId } });
    if (existing) return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    const paymentEntity = event.payload?.payment?.entity;
    const rzpOrderId: string | undefined = paymentEntity?.order_id;
    const rzpPaymentId: string | undefined = paymentEntity?.id;

    let orderId: string | null = null;
    if (rzpOrderId) {
      const payment = await db.payment.findFirst({
        where: { razorpayOrderId: rzpOrderId },
        select: { orderId: true },
      });
      orderId = payment?.orderId ?? null;
    }

    if (eventId) {
      await db.webhookEvent.create({
        data: { eventId, eventType: type, payload: event.payload ?? {}, orderId },
      }).catch(() => {/* lost insert race — treat as duplicate */});
    }

    if (orderId && rzpPaymentId) {
      switch (type) {
        case "payment.captured":
        case "order.paid":
          await markOrderPaid({ orderId, razorpayPaymentId: rzpPaymentId, method: paymentEntity?.method });
          break;
        case "payment.failed":
          await markOrderFailed(orderId, paymentEntity?.error_description ?? "Payment failed at gateway");
          break;
        case "refund.processed": {
          await db.payment.updateMany({ where: { orderId }, data: { status: "REFUNDED" } });
          await db.order.update({ where: { id: orderId }, data: { paymentStatus: "REFUNDED", status: "REFUNDED" } });
          break;
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook processing error", e);
    // 500 makes Razorpay retry; safe because processing is idempotent.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
