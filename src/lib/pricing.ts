import { db } from "@/lib/db";
import { shippingFor, type ShippingMethod, SHIPPING_METHODS } from "@/lib/constants";
import type { CartLine, ResolvedLine } from "@/lib/cart";

// Server-side cart resolution: prices, stock and availability come from the
// database; anything the browser sent about amounts is ignored (spec §38.5).

export class PricingError extends Error {}

export async function resolveCart(lines: CartLine[]): Promise<ResolvedLine[]> {
  if (!lines.length) return [];
  const ids = [...new Set(lines.map((l) => l.productId))];
  const variantIds = lines.map((l) => l.variantId).filter((v): v is string => !!v);

  const [products, variants] = await Promise.all([
    db.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: { images: { where: { isPrimary: true }, take: 1 } } }),
    db.variant.findMany({ where: { id: { in: variantIds } }, include: { product: { select: { id: true } } } }),
  ]);
  const pMap = new Map(products.map((p) => [p.id, p]));
  const vMap = new Map(variants.map((v) => [v.id, v]));

  const resolved: ResolvedLine[] = [];
  for (const line of lines) {
    const product = pMap.get(line.productId);
    if (!product) throw new PricingError(`A product in your cart is no longer available.`);
    let variant = line.variantId ? vMap.get(line.variantId) : null;
    if (variant && variant.productId !== product.id) variant = null; // tamper guard

    const stock = variant ? variant.stockQuantity : product.stockQuantity;
    if (stock <= 0) throw new PricingError(`"${product.name}" is out of stock.`);
    const qty = Math.min(Math.max(1, Math.floor(line.qty)), 10);
    if (qty > stock) throw new PricingError(`Only ${stock} left of "${product.name}${variant ? ` (${variant.name})` : ""}".`);

    const unitPrice = variant?.price ?? product.price;
    resolved.push({
      productId: product.id, variantId: variant?.id ?? null, qty,
      name: product.name, slug: product.slug, variantName: variant?.name ?? null,
      price: unitPrice, image: product.images[0]?.url ?? null, stock,
      lineTotal: unitPrice * qty,
    });
  }
  return resolved;
}

export type CouponResult =
  | { ok: true; code: string; discount: number }
  | { ok: false; reason: string };

export async function validateCoupon(code: string, subtotal: number, customerId?: string): Promise<CouponResult> {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.isActive) return { ok: false, reason: "Invalid coupon code." };
  const now = new Date();
  if (coupon.startsAt > now) return { ok: false, reason: "This coupon is not active yet." };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, reason: "This coupon has expired." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, reason: "This coupon has reached its usage limit." };
  if (subtotal < coupon.minOrderValue)
    return { ok: false, reason: `Minimum order for this coupon is ₹${Math.round(coupon.minOrderValue / 100)}.` };
  if (coupon.perCustomerLimit !== null && customerId) {
    const used = await db.order.count({ where: { customerId, couponCode: coupon.code, paymentStatus: "PAID" } });
    if (used >= coupon.perCustomerLimit) return { ok: false, reason: "You have already used this coupon." };
  }

  let discount = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { ok: true, code: coupon.code, discount };
}

export type Quote = {
  lines: ResolvedLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
};

export async function quoteCart(opts: {
  lines: CartLine[];
  method?: string;
  couponCode?: string | null;
  customerId?: string;
}): Promise<Quote> {
  const lines = await resolveCart(opts.lines);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const method: ShippingMethod = SHIPPING_METHODS.includes(opts.method as ShippingMethod)
    ? (opts.method as ShippingMethod)
    : "STANDARD";
  const shipping = lines.length ? shippingFor(method, subtotal - 0) : 0; // discount applied after shipping base? No — shipping on pre-discount subtotal (standard practice)

  let discount = 0;
  let couponCode: string | null = null;
  if (opts.couponCode) {
    // coupon threshold checked against merchandise subtotal (pre-shipping)
    const res = await validateCoupon(opts.couponCode, subtotal, opts.customerId);
    if (res.ok) { discount = res.discount; couponCode = res.code; }
    else throw new PricingError(res.reason);
  }
  const total = Math.max(0, subtotal + shipping - discount);
  return { lines, subtotal, shipping, discount, total, couponCode };
}
