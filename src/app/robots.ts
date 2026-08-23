import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const base = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/checkout", "/cart"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
