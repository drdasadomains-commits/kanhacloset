import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What We Collect</h2>
      <p>To fulfil your orders we collect your name, mobile number, email and delivery address. Payments are processed by Razorpay — we never see or store your card numbers, UPI PINs or bank credentials.</p>
      <h2>How We Use It</h2>
      <ul>
        <li>Processing and delivering your orders, and sending order updates.</li>
        <li>Responding to your enquiries on WhatsApp, email or phone.</li>
        <li>If you opt in, sending you occasional updates about new collections.</li>
      </ul>
      <h2>What We Never Do</h2>
      <p>We do not sell, rent or trade your personal information to third parties. Analytics, if enabled, is configured to exclude payment details.</p>
      <h2>Your Rights</h2>
      <p>Email seva@kanhacloset.in to access, correct or delete your data, or to unsubscribe from communications at any time.</p>
    </LegalPage>
  );
}
