import type { MetadataRoute } from "next"
import { getAllTips } from "@/lib/tips"

const BASE = "https://sayingyes.nl"

export default function sitemap(): MetadataRoute.Sitemap {
  const tips = getAllTips().map(tip => ({
    url: `${BASE}/tips/${tip.slug}`,
    lastModified: new Date(tip.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [
    { url: BASE,                      lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/aanmaken`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tips`,            lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    ...tips,
    { url: `${BASE}/contact`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/voorwaarden`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ]
}
