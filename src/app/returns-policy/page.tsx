import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Returns & Refunds" };

export default function ReturnsPolicyPage() {
  return (
    <LegalPage title="Returns & Refund Policy">
      <h2>7-Day Easy Returns</h2>
      <p>Unused items can be returned within 7 days of delivery, in original packaging with all tags and accessories (mukut, dori, box) intact. Because deity apparel is devotional merchandise, used or altered items cannot be accepted.</p>
      <h2>How to Request</h2>
      <ul>
        <li>Email seva@kanhacloset.in or WhatsApp +91 99999 99999 with your order number and reason.</li>
        <li>We arrange a reverse pickup for serviceable PIN codes; otherwise ship the item back to the address we provide.</li>
      </ul>
      <h2>Refunds</h2>
      <p>Once the return passes inspection, refunds are issued to the original payment method within 5–7 business days via the Razorpay gateway. Shipping charges are non-refundable unless the item arrived damaged or incorrect — in which case we refund 100% including shipping, or replace the item, your choice.</p>
      <h2>Custom Orders</h2>
      <p>Made-to-measure dresses are crafted for your deity&apos;s specific vigraha and are not eligible for return unless defective.</p>
    </LegalPage>
  );
}
