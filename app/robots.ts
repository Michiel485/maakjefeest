import type { MetadataRoute } from "next"
import { MARKETING_URL } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Alles achter login, betaalflows, API's, klant-sites (noindex) en
        // privé-kaartlinks. Let op: "/kaart/" blokkeert /kaart-voorbeeld niet.
        disallow: [
          "/dashboard",
          "/bouwen",
          "/betalen",
          "/succes",
          "/verlengen",
          "/admin",
          "/inloggen",
          "/api",
          "/events",
          "/kaart/",
          "/print/",
        ],
      },
    ],
    sitemap: `${MARKETING_URL}/sitemap.xml`,
  }
}
