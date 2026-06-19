import type { MetadataRoute } from "next"

const BASE = "https://sayingyes.nl"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                      lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/aanmaken`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/contact`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/voorwaarden`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ]
}
