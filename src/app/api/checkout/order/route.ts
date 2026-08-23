import { NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { quoteCart, PricingError } from "@/lib/pricing";
import { SHIPPING_METHODS } from "@/lib/constants";
import { getCustomerSession } from "@/lib/auth";
import { newOrderNumber, razorpayConfigured } from "@/lib/orders";

const Address = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().email().max(200),
  line1: z.string().trim().min(4).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  country: z.string().trim().default("India"),
});

const Body = z.object({
  address: Address,
  method: z.enum(SHIPPING_METHODS).default("STANDARD"),
  couponCode: z.string().max(40).nullable().optional(),
  lines: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1).nullable(),
    qty: z.number().int().min(1).max(10),
  })).min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid checkout details" }, { status: 400 });
    }
    const session = await getCustomerSession();

    // All pricing is computed server-side from the DB (spec §38.5–7)
    const quote = await quoteCart({
      lines: parsed.data.lines,
      method: parsed.data.method,
      couponCode: parsed.data.couponCode ?? null,
      customerId: session?.sub,
    });
    if (!quote.lines.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

    const orderNumber = newOrderNumber();
    const { address } = parsed.data;

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId: session?.sub,
        customerName: address.fullName,
        customerPhone: address.phone,
        customerEmail: address.email,
        shippingAddress: address,
        shippingMethod: parsed.data.method,
        subtotal: quote.subtotal,
        shipping: quote.shipping,
        discount: quote.discount,
        total: quote.total,
        couponCode: quote.couponCode,
        status: "PENDING",
        paymentStatus: "PENDING",
        items: {
          create: quote.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            productName: l.name,
            variantName: l.variantName,
            unitPrice: l.price,
            quantity: l.qty,
            lineTotal: l.lineTotal,
          })),
        },
        payments: {
          create: { amount: quote.total, currency: "INR", status: "CREATED" },
        },
        statusHistory: { create: { toStatus: "PENDING", note: "Order created, awaiting payment" } },
      },
    });

    // Dev-mode simulation lets the full flow be tested locally without keys.
    // Hard-disabled in production builds (spec §38.20).
    if (!razorpayConfigured()) {
      if (process.env.NODE_ENV === "production") {
        await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
        return NextResponse.json({ error: "Payments are not configured yet. Contact us on WhatsApp to place your order." }, { status: 503 });
      }
      return NextResponse.json({
        mode: "simulated",
        orderNumber,
        orderId: order.id,
        amount: quote.total,
      });
    }

    const rzp = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const rzpOrder = await rzp.orders.create({
      amount: quote.total,
      currency: "INR",
      receipt: orderNumber,
      notes: { orderNumber, store: "Kanha Closet" },
    });

    await db.payment.updateMany({
      where: { orderId: order.id, status: "CREATED" },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return NextResponse.json({
      mode: "razorpay",
      orderNumber,
      orderId: order.id,
      amount: quote.total,
      razorpayOrderId: rzpOrder.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: { name: address.fullName, email: address.email, contact: `+91${address.phone}` },
    });
  } catch (e) {
    if (e instanceof PricingError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error("checkout error", e);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
