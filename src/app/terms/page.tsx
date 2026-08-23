import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <h2>The Store</h2>
      <p>Kanha Closet sells devotional apparel, shringar and accessories for personal and temple seva. By placing an order you agree to these terms.</p>
      <h2>Pricing</h2>
      <p>All prices are in Indian Rupees and inclusive of GST where applicable. Prices and offers may change without notice; the price shown at the time of a confirmed, paid order is final.</p>
      <h2>Orders &amp; Availability</h2>
      <p>An order is a request to buy. It becomes binding when payment is captured and we confirm dispatch. If an item becomes unavailable after payment, we will refund it in full within 5–7 business days.</p>
      <h2>Deity Merchandise</h2>
      <p>Products are devotional apparel and decorative items. Slight variations in hand embroidery, fabric shade and craftsmanship are natural to handmade goods and are not defects.</p>
      <h2>Governing Law</h2>
      <p>These terms are governed by the laws of India, with exclusive jurisdiction of the courts at Mathura, Uttar Pradesh.</p>
    </LegalPage>
  );
}
