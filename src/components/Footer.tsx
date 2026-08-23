import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-maroon-deep text-cream/75">
      <div className="mx-auto grid w-[92%] max-w-6xl gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl font-bold text-gold-light">॥ Kanha Closet</p>
          <p className="mt-3 text-sm leading-relaxed">
            Handcrafted poshakh, shringar and seva essentials for Thakurji, Radha Rani and Laddu Gopal.
            Every order is packed with care and a prayer.
          </p>
        </div>
        <div>
          <p className="mb-3 font-display text-lg text-cream">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-gold-light" href="/shop?category=krishna-dresses">Krishna Dresses</Link></li>
            <li><Link className="hover:text-gold-light" href="/shop?category=radha-dresses">Radha Dresses</Link></li>
            <li><Link className="hover:text-gold-light" href="/shop?category=laddu-gopal-dresses">Laddu Gopal Dresses</Link></li>
            <li><Link className="hover:text-gold-light" href="/shop?category=mukuts-crowns">Mukuts / Crowns</Link></li>
            <li><Link className="hover:text-gold-light" href="/shop?category=janmashtami-collection">Janmashtami Collection</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display text-lg text-cream">Help</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-gold-light" href="/track">Track Order</Link></li>
            <li><Link className="hover:text-gold-light" href="/faq">FAQ</Link></li>
            <li><Link className="hover:text-gold-light" href="/shipping-policy">Shipping Policy</Link></li>
            <li><Link className="hover:text-gold-light" href="/returns-policy">Returns &amp; Refunds</Link></li>
            <li><Link className="hover:text-gold-light" href="/contact">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display text-lg text-cream">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-gold-light" href="/about">About Us</Link></li>
            <li><Link className="hover:text-gold-light" href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link className="hover:text-gold-light" href="/terms">Terms &amp; Conditions</Link></li>
          </ul>
          <p className="mt-4 text-sm">📞 +91 99999 99999<br />✉ seva@kanhacloset.in</p>
        </div>
      </div>
      <div className="border-t border-gold/15 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Kanha Closet · Secured payments by Razorpay · UPI · Cards · NetBanking
      </div>
    </footer>
  );
}
