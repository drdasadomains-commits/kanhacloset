// Status vocabularies — kept as string unions + arrays (not DB enums) so the
// same constants validate input in zod, render badges in UI, and stay in sync
// with the Prisma schema docs.

export const ORDER_STATUSES = [
  "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED",
  "CANCELLED", "RETURN_REQUESTED", "RETURNED", "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const SHIPPING_METHODS = ["STANDARD", "EXPRESS"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

// Shipping rules (paise) — flat + free-above-threshold; provider-agnostic per spec §27
export const SHIPPING_RULES: Record<ShippingMethod, { label: string; eta: string; flat: number; freeAbove: number | null }> = {
  STANDARD: { label: "Standard (3–7 days)", eta: "3–7 business days", flat: 4900, freeAbove: 49900 },
  EXPRESS: { label: "Express (1–3 days)", eta: "1–3 business days", flat: 9900, freeAbove: null },
};

export function shippingFor(method: ShippingMethod, subtotal: number): number {
  const rule = SHIPPING_RULES[method];
  if (rule.freeAbove !== null && subtotal >= rule.freeAbove) return 0;
  return rule.flat;
}

export const FESTIVALS = ["janmashtami", "radhashtami", "diwali", "holi", "govardhan-puja"] as const;
