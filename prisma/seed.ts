import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync } from "node:fs";

const db = new PrismaClient();

// ── placeholder SVG product images (replace later with Cloudinary uploads) ──
function svg(name: string, c1: string, c2: string, icon: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="600" height="750" fill="url(#g)"/>
  <rect x="20" y="20" width="560" height="710" fill="none" stroke="#e6c65c" stroke-width="2" opacity=".6"/>
  <rect x="34" y="34" width="532" height="682" fill="none" stroke="#e6c65c" stroke-width="1" opacity=".35"/>
  <text x="300" y="360" font-size="150" text-anchor="middle">${icon}</text>
  <text x="300" y="600" font-size="34" font-family="Georgia,serif" fill="#faf5ec" text-anchor="middle">${name}</text>
  <text x="300" y="645" font-size="20" font-family="Georgia,serif" fill="#e6c65c" text-anchor="middle" letter-spacing="4">KANHA CLOSET</text>
</svg>`;
}

const R = (n: number) => Math.round(n) * 100; // rupees → paise

async function main() {
  mkdirSync("public/products", { recursive: true });
  console.log("Clearing existing data…");
  await db.webhookEvent.deleteMany();
  await db.orderStatusHistory.deleteMany();
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.variant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.coupon.deleteMany();
  await db.adminUser.deleteMany();

  // ── Categories (spec §5) ──
  const catDefs: [string, string, string, string, string][] = [
    ["Krishna Dresses", "krishna-dresses", "#1f5a8a", "#0d2b45", "🪶"],
    ["Radha Dresses", "radha-dresses", "#a85a6e", "#4a0e1e", "🌸"],
    ["Laddu Gopal Dresses", "laddu-gopal-dresses", "#c98a3d", "#5a3210", "🧸"],
    ["Gopal Ji Shringar", "gopal-ji-shringar", "#6d4a8f", "#2b1740", "✨"],
    ["Deity Jewellery", "deity-jewellery", "#b8962e", "#5c4a0e", "📿"],
    ["Mukuts / Crowns", "mukuts-crowns", "#d4af37", "#6b5312", "👑"],
    ["Flutes", "flutes", "#7a5a3a", "#3a2814", "🎵"],
    ["Decorative Items", "decorative-items", "#5a7a4a", "#22301a", "🪔"],
    ["Festival Collections", "festival-collections", "#8a2f5a", "#3a0d24", "🎉"],
    ["Janmashtami Collection", "janmashtami-collection", "#2f6d8a", "#0e2b38", "🦚"],
  ];
  const cats: Record<string, { id: string }> = {};
  for (let i = 0; i < catDefs.length; i++) {
    const [name, slug, c1, c2, icon] = catDefs[i];
    const img = `products/cat-${slug}.svg`;
    writeFileSync(`public/${img}`, svg(name, c1, c2, icon));
    cats[slug] = await db.category.create({
      data: { name, slug, sortOrder: i, image: `/${img}`, description: `Handpicked ${name.toLowerCase()} for your beloved deities.` },
    });
  }

  // ── Products ──
  type P = {
    name: string; cat: string; price: number; compareAt?: number;
    short: string; icon: string; c1: string; c2: string;
    featured?: boolean; bestseller?: boolean; new?: boolean; festival?: string; stock?: number;
    variants?: string[]; // size list → variant per size
  };
  const products: P[] = [
    { name: "Rajwadi Zardozi Poshakh — Royal Blue", cat: "krishna-dresses", price: R(45), compareAt: R(58), short: "Raw silk poshakh with gold zardozi, pearl and kundan work for Thakurji.", icon: "👑", c1: "#1f3a8a", c2: "#0a1230", featured: true, bestseller: true, variants: ["Size 0", "Size 1", "Size 2", "Size 3", "Size 4"] },
    { name: "Peacock Feather Velvet Dress", cat: "krishna-dresses", price: R(39), short: "Emerald velvet dress with mor-pankh embroidery and gotta trim.", icon: "🦚", c1: "#0f6d5a", c2: "#04241d", bestseller: true, festival: "janmashtami", variants: ["Size 1", "Size 2", "Size 3"] },
    { name: "Banarasi Silk Krishna Poshakh — Maroon", cat: "krishna-dresses", price: R(52), short: "Pure Banarasi brocade poshakh with antique zari border.", icon: "🪶", c1: "#7a1f2b", c2: "#2b0710", featured: true, new: true, variants: ["Size 2", "Size 3", "Size 4"] },
    { name: "Radha Rani Kanchi Silk Lehenga — Pink", cat: "radha-dresses", price: R(49), compareAt: R(62), short: "Blush-pink Kanchipuram lehenga with silver gotta-patti and lace border.", icon: "🌸", c1: "#c26a85", c2: "#4a0e28", featured: true, variants: ["Size 1", "Size 2", "Size 3"] },
    { name: "Radhashtami Ivory-Gold Saree Dress", cat: "radha-dresses", price: R(55), short: "Ivory silk saree dress with real-zari border for Swamini Maharani.", icon: "🤍", c1: "#b8a878", c2: "#4a3a1a", festival: "radhashtami", new: true, variants: ["Size 2", "Size 3"] },
    { name: "Laddu Gopal Red Velvet Dress", cat: "laddu-gopal-dresses", price: R(12), compareAt: R(16), short: "Classic red velvet dress with pearl border for your little Kanha.", icon: "🧸", c1: "#a81f2b", c2: "#38060d", bestseller: true, featured: true, variants: ["Size 0", "Size 1", "Size 2", "Size 3", "Size 4"] },
    { name: "Laddu Gopal Yellow Mukut-Dress Set", cat: "laddu-gopal-dresses", price: R(15), short: "Makar-mukut with matching yellow chanderi dress — complete shringar set.", icon: "🌟", c1: "#c9a227", c2: "#5c470a", new: true, variants: ["Size 0", "Size 1", "Size 2", "Size 3"] },
    { name: "Daily Cotton Dhoti-Uttariya Set (5 colours)", cat: "laddu-gopal-dresses", price: R(8), short: "Soft breathable cotton seva set — one each in safed, peela, laal, haree, neela.", icon: "🧵", c1: "#c98a3d", c2: "#4a2c0e", bestseller: true, variants: ["Size 0", "Size 1", "Size 2", "Size 3", "Size 4"] },
    { name: "Gopal Ji Shringar Box — Complete", cat: "gopal-ji-shringar", price: R(89), compareAt: R(110), short: "Dress, mukut, jewellery, flute, mor-pankh and garland in one ready-seva box.", icon: "🎁", c1: "#6d4a8f", c2: "#22103a", featured: true, stock: 12 },
    { name: "Polki Haar & Bangles Set", cat: "deity-jewellery", price: R(35), short: "Gold-plated polki necklace with matching kangan and kundal.", icon: "📿", c1: "#b8962e", c2: "#4a3a0a", bestseller: true, variants: ["Small", "Medium", "Large"] },
    { name: "Kundan Mukut with Kalangi", cat: "mukuts-crowns", price: R(28), short: "Hand-set kundan crown with pearl kalangi and adjustable dori.", icon: "👑", c1: "#d4af37", c2: "#5c4708", featured: true, variants: ["Size 1", "Size 2", "Size 3"] },
    { name: "Premium Bansuri — Pure Bamboo", cat: "flutes", price: R(6), short: "Concert-grade bamboo flute in Bansuri Bihari finish.", icon: "🎵", c1: "#7a5a3a", c2: "#33220e", variants: ["12 inch", "15 inch", "18 inch"] },
    { name: "Peacock Diya Set (Pair)", cat: "decorative-items", price: R(9), short: "Brass peacock diyas for aarti, polished by Moradabad artisans.", icon: "🪔", c1: "#3a7a5a", c2: "#12301e", new: true },
    { name: "Janmashtami Midnight Shringar Ensemble", cat: "janmashtami-collection", price: R(75), compareAt: R(95), short: "Peacock-blue velvet attire with gota-patti for the midnight abhishek darshan.", icon: "🌑", c1: "#144e5a", c2: "#061c22", festival: "janmashtami", featured: true, stock: 8 },
    { name: "Diwali Gold Brocade Dress", cat: "festival-collections", price: R(58), short: "Rich gold brocade with antique-kundan trim for Deepavali darshan.", icon: "🪔", c1: "#8a6a1f", c2: "#332505", festival: "diwali", variants: ["Size 2", "Size 3"] },
  ];

  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const img = `products/${slug}.svg`;
    writeFileSync(`public/${img}`, svg(p.name.split("—")[0].trim(), p.c1, p.c2, p.icon));
    await db.product.create({
      data: {
        name: p.name,
        slug,
        shortDescription: p.short,
        description: `${p.short}\n\nCrafted by master karigars and inspected personally before packing. Cut, embroidered and finished by hand — each piece arrives ready for seva. To care: dry clean only, store in the muslin bag provided, keep away from moisture.\n\nFree shipping across India on this item. Custom sizing available on request via the contact page.`,
        categoryId: cats[p.cat].id,
        brand: "Kanha Closet",
        sku: slug.slice(0, 12).toUpperCase(),
        price: p.price,
        compareAtPrice: p.compareAt ?? null,
        stockQuantity: p.stock ?? 25,
        status: "ACTIVE",
        featured: p.featured ?? false,
        bestseller: p.bestseller ?? false,
        newArrival: p.new ?? false,
        festival: p.festival ?? null,
        images: { create: { url: `/${img}`, altText: p.name, isPrimary: true } },
        variants: p.variants
          ? {
              create: p.variants.map((size, i) => ({
                name: size, size, sku: `${slug.slice(0, 10).toUpperCase()}-${size.replace(/\s/g, "")}`, stockQuantity: 6 + i,
              })),
            }
          : undefined,
      },
    });
  }

  // ── Coupons (spec §21) ──
  await db.coupon.create({ data: { code: "WELCOME100", type: "FIXED", value: R(1), minOrderValue: R(5), startsAt: new Date("2026-01-01") } });
  await db.coupon.create({ data: { code: "JANMASHTAMI10", type: "PERCENT", value: 10, minOrderValue: R(10), maxDiscount: R(5), startsAt: new Date("2026-01-01") } });
  await db.coupon.create({ data: { code: "FESTIVAL15", type: "PERCENT", value: 15, minOrderValue: R(30), maxDiscount: R(10), startsAt: new Date("2026-01-01"), usageLimit: 500 } });

  // ── Admin (from .env; change before launch) ──
  const email = process.env.ADMIN_EMAIL ?? "admin@kanhacloset.in";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  await db.adminUser.create({
    data: { email, passwordHash: await bcrypt.hash(password, 12), name: "Store Admin", role: "SUPERADMIN" },
  });

  const [pc, cc] = [await db.product.count(), await db.category.count()];
  console.log(`Seeded: ${cc} categories, ${pc} products, 3 coupons, admin=${email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
