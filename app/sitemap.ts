import type { MetadataRoute } from "next"
import { getAllTips } from "@/lib/tips"
import { MARKETING_URL } from "@/lib/site-url"

const BASE = MARKETING_URL

// Statische pagina's krijgen bewust geen lastModified: een datum die altijd
// "vandaag" is, negeert Google juist. Artikelen krijgen hun echte datum.
export default function sitemap(): MetadataRoute.Sitemap {
  const tips = getAllTips().map((tip) => ({
    url: `${BASE}/tips/${tip.slug}`,
    lastModified: new Date(tip.updated ?? tip.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [
    { url: BASE,                      changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/digitale-uitnodiging`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/aanmaken`,        changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/kaart-voorbeeld`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/tips`,            changeFrequency: "weekly",  priority: 0.7 },
    ...tips,
    { url: `${BASE}/contact`,         changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/privacy`,         changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/voorwaarden`,     changeFrequency: "yearly",  priority: 0.2 },
  ]
}
