import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Frequently Asked Questions" };

const FAQS: [string, string][] = [
  ["How do I choose the right dress size for my Laddu Gopal?", "Measure the vigraha's height (base to crown) in inches. Size 0 fits up to 4\", Size 1 fits 4–6\", Size 2 fits 6–8\", Size 3 fits 8–10\" and Size 4 fits 10–12\". If you're between sizes or unsure, message us a photo on WhatsApp and we'll guide you."],
  ["Can I order a custom-fit dress?", "Yes. Share your deity's measurements or a photo via the contact page and our karigars will craft a made-to-measure piece. Custom orders take 5–10 business days."],
  ["Which payment methods do you accept?", "All methods supported by Razorpay: UPI (GPay, PhonePe, Paytm), credit and debit cards, net banking and wallets."],
  ["Is my payment secure?", "Yes. Payments are processed by Razorpay over an encrypted connection and verified server-side. We never see your card or UPI credentials."],
  ["How fast will my order arrive?", "In-stock items ship in 1–2 business days and arrive within 3–7 days by standard courier, or 1–3 days by express where available."],
  ["Can I return a dress?", "Unused items in original packaging can be returned within 7 days. Custom-fit dresses are returnable only if defective."],
  ["Do you ship outside India?", "Not yet — international shipping is coming soon. Write to us and we'll notify you when it launches."],
];

export default function FaqPage() {
  return (
    <LegalPage title="Frequently Asked Questions">
      <div className="space-y-4">
        {FAQS.map(([q, a]) => (
          <details key={q} className="rounded-2xl bg-white p-5 shadow-sm">
            <summary className="cursor-pointer font-display text-lg font-semibold text-maroon">{q}</summary>
            <p className="mt-2 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </LegalPage>
  );
}
