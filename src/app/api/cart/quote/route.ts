import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCart, PricingError } from "@/lib/pricing";
import { SHIPPING_METHODS } from "@/lib/constants";
import { getCustomerSession } from "@/lib/auth";

const Body = z.object({
  lines: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1).nullable(),
    qty: z.number().int().min(1).max(10),
  })).max(50),
  method: z.enum(SHIPPING_METHODS).optional(),
  couponCode: z.string().max(40).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
    const session = await getCustomerSession();
    const quote = await quoteCart({ ...parsed.data, customerId: session?.sub });
    return NextResponse.json(quote);
  } catch (e) {
    if (e instanceof PricingError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error("quote error", e);
    return NextResponse.json({ error: "Could not price your cart. Please try again." }, { status: 500 });
  }
}
