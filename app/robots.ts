import type { MetadataRoute } from "next";

// Allow crawling of marketing/legal pages; keep API and per-user book pages out
// of the index (book pages are private, per-order links).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/book/"],
    },
    sitemap: "https://mytinytales.studio/sitemap.xml",
    host: "https://mytinytales.studio",
  };
}
