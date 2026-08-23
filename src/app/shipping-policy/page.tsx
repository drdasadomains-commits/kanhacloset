import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <LegalPage title="Shipping Policy">
      <h2>Dispatch Times</h2>
      <p>In-stock items are dispatched within 1–2 business days. Made-to-measure and custom shringar orders take 5–10 business days to craft before dispatch. You will receive a courier tracking number by email and SMS once your order ships.</p>
      <h2>Delivery Estimates</h2>
      <ul>
        <li><strong>Standard (3–7 business days):</strong> ₹49 flat, free on orders above ₹499.</li>
        <li><strong>Express (1–3 business days):</strong> ₹99 flat. Available for select PIN codes.</li>
      </ul>
      <p>Deliveries to remote PIN codes and festival peak periods may take additional days.</p>
      <h2>Care in Transit</h2>
      <p>Every dress is wrapped in muslin and packed in a protective box. If your parcel arrives damaged, please refuse delivery or contact us within 48 hours with photographs.</p>
    </LegalPage>
  );
}
