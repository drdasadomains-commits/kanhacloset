import type { Metadata } from "next";
import { Cormorant_Garamond, Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-display" });
const body = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sans" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kanhacloset.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Kanha Closet — Designer Dresses for Your Beloved Deities", template: "%s · Kanha Closet" },
  description:
    "Handpicked devotional dresses, shringar and accessories for Thakurji, Radha Rani and Laddu Gopal — crafted to bring beauty and devotion to your seva.",
  openGraph: { siteName: "Kanha Closet", type: "website", locale: "en_IN" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
