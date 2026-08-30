import type { MetadataRoute } from "next";

const BASE = "https://mytinytales.studio";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: "weekly" | "monthly" }[] = [
    { path: "",               priority: 1.0, freq: "weekly"  },
    { path: "/create",        priority: 0.9, freq: "weekly"  },
    { path: "/faq",           priority: 0.6, freq: "monthly" },
    { path: "/print-guide",   priority: 0.5, freq: "monthly" },
    { path: "/contact",       priority: 0.4, freq: "monthly" },
    { path: "/terms",         priority: 0.3, freq: "monthly" },
    { path: "/privacy",       priority: 0.3, freq: "monthly" },
    { path: "/refunds",       priority: 0.3, freq: "monthly" },
    { path: "/childrens-data", priority: 0.3, freq: "monthly" },
  ];
  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
