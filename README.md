# Kanha Closet — Deity Dress Ecommerce Store

Production ecommerce store for deity dresses, shringar and seva essentials.
**Next.js 16 · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma · Razorpay**

## Run locally

```bash
# 1. PostgreSQL (already created: kanhacloset db on localhost:5432)
createdb kanhacloset          # if missing

# 2. Configure
cp .env.example .env          # then edit DATABASE_URL, AUTH_SECRET, ADMIN_*

# 3. Install, migrate, seed
npm install
npx prisma migrate dev
npm run seed                  # 10 categories, 15 products, 3 coupons, admin user

# 4. Dev server (payment simulation enabled without Razorpay keys)
npm run dev                   # http://localhost:3000
```

Admin: **http://localhost:3000/admin** — login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
(seed default: `admin@kanhacloset.in` / `ChangeMe123!` — change before launch).

Without Razorpay keys, checkout runs in **simulated payment mode** (dev only —
hard-disabled in production builds) so the full order flow can be exercised.

## Verified end-to-end

- [x] Checkout creates order with server-side pricing (browser amounts ignored)
- [x] Coupons: WELCOME100 / JANMASHTAMI10 / FESTIVAL15 validated server-side
- [x] Payment marks order PAID → CONFIRMED, decrements stock atomically (product + variant)
- [x] Order tracking page shows live status timeline
- [x] Admin login (JWT httpOnly cookie), dashboard stats, product/category/order management
- [x] Unauthenticated `/admin` redirects to login
- [x] Razorpay signature verification + idempotent webhooks (code paths; needs live keys for final test)

## Deploy to Vercel (production)

> Per spec: use a **paid Vercel plan** (Pro) for the commercial store, not Hobby.

### 1. Database — Neon (recommended) or Supabase
Create a PostgreSQL database at neon.tech → copy the pooled connection string.

### 2. Push to GitHub
```bash
git remote add origin https://github.com/YOUR-NAME/deity-dress-store.git
git push -u origin main
```

### 3. Vercel
- vercel.com → **Add New → Project → Import** the repo (framework auto-detected)
- Environment Variables (Production):
  ```
  DATABASE_URL              postgres://…neon.tech/…?sslmode=require
  NEXT_PUBLIC_SITE_URL      https://yourdomain.com
  NEXT_PUBLIC_RAZORPAY_KEY_ID   rzp_live_xxxx
  RAZORPAY_KEY_SECRET       (server only)
  RAZORPAY_WEBHOOK_SECRET   (server only)
  AUTH_SECRET               openssl rand -base64 32
  ADMIN_EMAIL               you@yourdomain.com
  ADMIN_PASSWORD            strong password
  ```
- Deploy. Then run the migration + seed once against production:
  ```bash
  DATABASE_URL="postgres://…neon…" npx prisma migrate deploy
  DATABASE_URL="postgres://…neon…" ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run seed
  ```

### 4. Razorpay
- dashboard.razorpay.com → Settings → API Keys → generate live keys → add to Vercel
- Settings → Webhooks → **Add New Webhook**
  - URL: `https://yourdomain.com/api/webhooks/razorpay`
  - Events: `payment.captured`, `payment.failed`, `refund.processed`, `order.paid`
  - Secret → `RAZORPAY_WEBHOOK_SECRET` in Vercel

### 5. Connect your domain
- Vercel → Project → **Settings → Domains** → add `yourdomain.com`
- At your registrar: `A` record `@ → 76.76.21.21`, `CNAME` `www → cname.vercel-dns.com`
- HTTPS is automatic. Test the whole checkout with a real ₹1 UPI payment before announcing.

## Security model (per spec)

- Prices, stock and totals are **always recalculated server-side** from the DB
- Razorpay orders created server-side; signatures verified with HMAC + timing-safe compare
- Webhooks verified by signature and processed **idempotently** (`WebhookEvent` unique event id)
- Stock decremented atomically inside a transaction (`updateMany` guard prevents overselling)
- Secrets never reach the browser; admin on a separate cookie from customer sessions
- Payment success never trusted from the frontend success page

## Project structure

```
src/
├── app/
│   ├── (storefront)         home, shop, product/[slug], cart, checkout, track,
│   │                        order/success, about, contact, faq, policies
│   ├── admin/(dashboard)    login-protected: dashboard, products, categories, orders
│   └── api/
│       ├── cart/quote       server-side cart pricing
│       ├── checkout/order   order + Razorpay order creation
│       ├── checkout/verify  payment signature verification
│       ├── webhooks/razorpay  idempotent webhook processing
│       └── admin/{login,logout}
├── components/              Header, Footer, ProductCard, BuyBox, Gallery, filters…
└── lib/                     db, auth (JWT sessions), pricing, orders, cart, constants
prisma/                      schema.prisma, migrations, seed.ts
```

## Still open (next iterations)

- Customer accounts (login/register, saved addresses) — schema ready (`Customer`, `Address`)
- Admin coupon management UI + variant add/edit forms (schema + validation ready)
- Cloudinary image uploads (products currently use seeded SVG placeholders)
- Transactional emails (order/shipping notifications)
- Shiprocket/Delhivery courier integration (tracking entry is manual for now)
- Google Analytics 4 + Search Console
